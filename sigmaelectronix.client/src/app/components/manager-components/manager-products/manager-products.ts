import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category-service';
import { BrandService } from '../../../services/brand-service';
import { FileService } from '../../../services/file-service';
import { ProductListDto, CreateProductDto } from '../../../models/product-models';
import { BrandListDto } from '../../../models/brand-models';
import { HttpEventType } from '@angular/common/http';
import {
  LucidePackage, LucidePlus, LucideTrash2, LucideEdit2,
  LucideEye, LucideEyeOff, LucideArrowRight, LucideArrowLeft,
  LucideCheck, LucideChevronLeft, LucideChevronRight, LucideListPlus, LucideX,
  LucideChevronDown, LucideSearch, LucideChevronUp,
  LucideImagePlus, LucideStar
} from '@lucide/angular';
import { ProductService } from '../../../services/product-service';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';

type ProductSortOption =
  | 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'
  | 'rating' | 'popular' | 'date_desc' | 'date_asc'
  | 'brand_asc' | 'brand_desc'
  | 'category_asc' | 'category_desc'
  | 'status_asc' | 'status_desc';

interface ProductImageUI {
  url: string;
  isMain: boolean;
}

@Component({
  selector: 'app-manager-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucidePackage, LucidePlus, LucideTrash2, LucideEdit2,
    LucideEye, LucideEyeOff, LucideArrowRight, LucideArrowLeft,
    LucideCheck, LucideChevronLeft, LucideChevronRight, LucideListPlus, LucideX,
    LucideChevronDown, LucideSearch, LucideChevronUp, LucideImagePlus, LucideStar,
    SpinnerComponent
  ],
  templateUrl: './manager-products.html',
  styleUrl: './manager-products.css'
})
export class ManagerProductsComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private fileService = inject(FileService);
  private fb = inject(FormBuilder);

  // --- Состояния таблицы ---
  products = signal<readonly ProductListDto[]>([]);
  totalCount = signal(0);
  pageNumber = signal(1);
  pageSize = signal(15);

  loading = signal(false);
  isLoadingMore = signal(false);

  searchQuery = signal('');
  // ✅ Типизирован расширенным типом сортировок
  currentSort = signal<ProductSortOption>('date_desc');
  private searchTimeout: any;

  categories = this.categoryService.allCategories;

  // --- Состояния для Умного поиска ---
  categorySearch = signal('');
  isCatDropdownOpen = signal(false);
  selectedCatDisplay = signal('');

  brandSearch = signal('');
  isBrandDropdownOpen = signal(false);
  selectedBrandDisplay = signal('');
  brands = signal<readonly BrandListDto[]>([]);

  // --- Состояния для автокомплита характеристик ---
  availableSpecs = signal<Readonly<Record<string, readonly string[]>>>({});
  availableSpecKeys = computed(() => Object.keys(this.availableSpecs()));

  // UI Состояния
  viewMode = signal<'list' | 'form'>('list');
  currentStep = signal(1);
  isEditing = signal(false);
  editingId = signal<number | null>(null);

  productForm!: FormGroup;

  productImages = signal<ProductImageUI[]>([]);
  isUploadingImages = signal(false);
  isDragoverImages = signal(false);

  private tempUploadedFiles: string[] = [];
  private filesToDeleteOnSave: string[] = [];
  private originalImages: string[] = [];

  // 1. УМНАЯ ФИЛЬТРАЦИЯ КАТЕГОРИЙ
  filteredGroupedCategories = computed(() => {
    const allCats = this.categories();
    const leaves = allCats.filter(c => c.subCategoriesCount === 0);
    const search = this.categorySearch().toLowerCase().trim();

    const groups = new Map<string, { id: number, displayPath: string }[]>();

    leaves.forEach(cat => {
      let pathNames: string[] = [];
      let current: any = cat;
      let rootName = 'Без группы';

      while (current) {
        pathNames.unshift(current.name);
        if (!current.parentCategoryId) rootName = current.name;
        current = allCats.find(c => c.id === current.parentCategoryId);
      }

      if (pathNames.length > 1) pathNames.shift();
      const displayPath = pathNames.join(' → ');

      if (search && !displayPath.toLowerCase().includes(search) && !rootName.toLowerCase().includes(search)) return;

      if (!groups.has(rootName)) groups.set(rootName, []);
      groups.get(rootName)!.push({ id: cat.id, displayPath });
    });

    return Array.from(groups.entries()).map(([name, items]) => ({
      groupName: name,
      categories: items.sort((a, b) => a.displayPath.localeCompare(b.displayPath))
    })).sort((a, b) => a.groupName.localeCompare(b.groupName))
      .filter(g => g.categories.length > 0);
  });

  filteredBrands = computed(() => {
    const search = this.brandSearch().toLowerCase().trim();
    if (!search) return this.brands();
    return this.brands().filter(b => b.name.toLowerCase().includes(search));
  });

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();

    if (this.categories().length === 0) {
      this.categoryService.loadAll().subscribe();
    }
    this.brandService.getBrands(1, 100).subscribe(res => this.brands.set(res.items));
  }

  ngOnDestroy(): void {
    this.cleanupTempFiles();
  }

  // --- ЛОГИКА ГАЛЕРЕИ ---
  onDragOverImages(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragoverImages.set(true);
  }

  onDragLeaveImages(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragoverImages.set(false);
  }

  onDropImages(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragoverImages.set(false);
    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length > 0) this.uploadFiles(files);
  }

  onImagesSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    if (files.length > 0) this.uploadFiles(files);
  }

  private uploadFiles(files: File[]): void {
    this.isUploadingImages.set(true);
    let completedCount = 0;

    files.forEach(file => {
      this.fileService.uploadImageWithProgress(file, 'products').subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.Response) {
            const res = event.body;
            const imageUrl = res?.url || res?.Url || (typeof res === 'string' ? res : null);

            if (imageUrl) {
              this.tempUploadedFiles.push(imageUrl);

              this.productImages.update(imgs => {
                const isFirst = imgs.length === 0;
                return [...imgs, { url: imageUrl, isMain: isFirst }];
              });
            }

            completedCount++;
            if (completedCount === files.length) {
              this.isUploadingImages.set(false);
            }
          }
        },
        error: () => {
          alert('Ошибка при загрузке одной из картинок');
          completedCount++;
          if (completedCount === files.length) {
            this.isUploadingImages.set(false);
          }
        }
      });
    });
  }

  removeProductImage(url: string): void {
    this.productImages.update(imgs => {
      const filtered = imgs.filter(img => img.url !== url);
      if (imgs.find(i => i.url === url)?.isMain && filtered.length > 0) {
        filtered[0].isMain = true;
      }
      return filtered;
    });

    if (this.tempUploadedFiles.includes(url)) {
      this.fileService.deleteImage(url).subscribe();
      this.tempUploadedFiles = this.tempUploadedFiles.filter(u => u !== url);
    } else if (this.originalImages.includes(url)) {
      this.filesToDeleteOnSave.push(url);
    }
  }

  setMainImage(url: string): void {
    this.productImages.update(imgs =>
      imgs.map(img => ({ ...img, isMain: img.url === url }))
    );
  }

  private cleanupTempFiles(): void {
    this.tempUploadedFiles.forEach(url => this.fileService.deleteImage(url).subscribe());
    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = [];
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      slug: ['', Validators.required],
      categoryId: [null, Validators.required],
      brandId: [null, Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      discountPrice: [null],
      isPublished: [true],
      shortDescription: ['', Validators.required],
      fullDescription: [''],
      tagsText: [''],
      specifications: this.fb.array([])
    });

    this.productForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.isEditing()) {
        const generatedSlug = this.slugify(name);
        this.productForm.get('slug')?.setValue(generatedSlug, { emitEvent: false });
      }
    });

    this.productForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      if (categoryId && !this.isEditing()) {
        this.loading.set(true);
        this.productService.getFilters(categoryId).subscribe({
          next: (filters) => {
            this.availableSpecs.set(filters.specifications || {});
            this.specsArray.clear();

            if (filters.specifications && Object.keys(filters.specifications).length > 0) {
              const keys = Object.keys(filters.specifications);
              keys.forEach(key => this.addSpecification(key, ''));
            } else {
              this.addSpecification();
            }
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.addSpecification();
          }
        });
      }
    });
  }

  openCategorySearch(): void { this.isCatDropdownOpen.set(true); this.categorySearch.set(''); }
  closeCategorySearch(): void { setTimeout(() => this.isCatDropdownOpen.set(false), 200); }
  onCatSearch(event: Event): void { this.categorySearch.set((event.target as HTMLInputElement).value); this.isCatDropdownOpen.set(true); }
  selectCategory(id: number, path: string): void {
    this.productForm.patchValue({ categoryId: id });
    this.selectedCatDisplay.set(path);
    this.isCatDropdownOpen.set(false);
    this.productForm.get('categoryId')?.updateValueAndValidity();
  }

  openBrandSearch(): void { this.isBrandDropdownOpen.set(true); this.brandSearch.set(''); }
  closeBrandSearch(): void { setTimeout(() => this.isBrandDropdownOpen.set(false), 200); }
  onBrandSearch(event: Event): void { this.brandSearch.set((event.target as HTMLInputElement).value); this.isBrandDropdownOpen.set(true); }
  selectBrand(id: number, name: string): void {
    this.productForm.patchValue({ brandId: id });
    this.selectedBrandDisplay.set(name);
    this.isBrandDropdownOpen.set(false);
  }

  getValuesForSpecKey(key: string): readonly string[] {
    if (!key) return [];
    return this.availableSpecs()[key.trim()] || [];
  }

  loadProducts(): void {
    if (this.pageNumber() === 1) this.loading.set(true);
    else this.isLoadingMore.set(true);

    this.productService.getAdminProducts({
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      searchQuery: this.searchQuery(),
      sortBy: this.currentSort()
    }).subscribe({
      next: (res) => {
        if (this.pageNumber() === 1) this.products.set(res.items);
        else this.products.update(prev => [...prev, ...res.items]);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
        this.isLoadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.isLoadingMore.set(false); }
    });
  }

  get specsArray(): FormArray { return this.productForm.get('specifications') as FormArray; }
  addSpecification(key = '', value = ''): void {
    this.specsArray.push(this.fb.group({ key: [key, Validators.required], value: [value, Validators.required] }));
  }
  removeSpecification(index: number): void { this.specsArray.removeAt(index); }

  openCreateMode(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.productForm.reset({ price: 0, isPublished: true });
    this.specsArray.clear();
    this.selectedCatDisplay.set('');
    this.selectedBrandDisplay.set('');

    this.productImages.set([]);
    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = [];
    this.originalImages = [];

    this.currentStep.set(1);
    this.viewMode.set('form');
  }

  closeForm(): void {
    this.cleanupTempFiles();
    this.viewMode.set('list');
  }

  isStepValid(step: number): boolean {
    const f = this.productForm.controls;
    if (step === 1) return f['name'].valid && f['slug'].valid && f['categoryId'].valid && f['brandId'].valid;
    if (step === 2) return f['price'].valid && f['discountPrice'].valid;
    if (step === 3) return f['shortDescription'].valid;
    return true;
  }

  nextStep(): void {
    if (this.currentStep() < 4 && this.isStepValid(this.currentStep())) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      alert('Пожалуйста, заполните все обязательные поля корректно.');
      return;
    }

    this.loading.set(true);
    const formValue = this.productForm.value;

    const specsRecord: Record<string, string> = {};
    formValue.specifications.forEach((spec: { key: string, value: string }) => {
      if (spec.key && spec.value) specsRecord[spec.key.trim()] = spec.value.trim();
    });

    let parsedTags: string[] = [];
    if (formValue.tagsText) {
      parsedTags = formValue.tagsText.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    }

    const { tagsText, ...cleanFormValue } = formValue;

    const formattedImages = this.productImages().map((img, idx) => ({
      url: img.url,
      isPrimary: img.isMain,
      sortOrder: idx
    }));

    const payload = {
      ...cleanFormValue,
      specifications: specsRecord,
      tags: parsedTags,
      images: formattedImages
    };

    if (this.isEditing() && this.editingId()) {
      this.productService.updateProduct(this.editingId()!, payload).subscribe({
        next: () => this.onSaveSuccess(),
        error: () => this.loading.set(false)
      });
    } else {
      this.productService.createProduct(payload).subscribe({
        next: () => this.onSaveSuccess(),
        error: () => this.loading.set(false)
      });
    }
  }

  private onSaveSuccess(): void {
    this.filesToDeleteOnSave.forEach(url => this.fileService.deleteImage(url).subscribe());
    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = [];

    this.loadProducts();
    this.viewMode.set('list');
  }

  deleteProduct(id: number, name: string): void {
    if (confirm(`Вы уверены, что хотите удалить товар "${name}"?`)) {
      this.loading.set(true);
      this.productService.deleteProduct(id).subscribe({
        next: () => this.loadProducts(),
        error: () => this.loading.set(false)
      });
    }
  }

  editProduct(productListItem: ProductListDto): void {
    this.loading.set(true);
    this.isEditing.set(true);
    this.editingId.set(productListItem.id);

    this.productService.getProductById(productListItem.id).subscribe({
      next: (fullProduct) => {
        const tagsString = fullProduct.tags ? fullProduct.tags.join(', ') : '';
        this.productForm.patchValue({
          name: fullProduct.name,
          slug: fullProduct.slug,
          categoryId: fullProduct.categoryId,
          brandId: fullProduct.brand?.id || null,
          price: fullProduct.price,
          discountPrice: fullProduct.discountPrice,
          isPublished: productListItem.isPublished,
          shortDescription: fullProduct.shortDescription,
          fullDescription: fullProduct.fullDescription,
          tagsText: tagsString
        });

        this.specsArray.clear();
        if (fullProduct.specifications && Object.keys(fullProduct.specifications).length > 0) {
          Object.entries(fullProduct.specifications).forEach(([key, value]) => {
            this.addSpecification(key, value as string);
          });
        } else {
          this.addSpecification();
        }

        this.tempUploadedFiles = [];
        this.filesToDeleteOnSave = [];
        if (fullProduct.images) {
          this.productImages.set(fullProduct.images.map(img => ({
            url: img.url,
            isMain: img.isPrimary
          })));
          this.originalImages = fullProduct.images.map(img => img.url);
        } else {
          this.productImages.set([]);
          this.originalImages = [];
        }

        this.selectedCatDisplay.set(fullProduct.categoryName || '');
        this.selectedBrandDisplay.set(fullProduct.brand?.name || '');

        this.currentStep.set(1);
        this.viewMode.set('form');
        this.loading.set(false);
      },
      error: () => {
        alert('Не удалось загрузить данные товара для редактирования');
        this.loading.set(false);
        this.isEditing.set(false);
      }
    });
  }

  slugify(text: string): string {
    const ru = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    let slug = text.toLowerCase();
    let newSlug = '';
    for (let i = 0; i < slug.length; i++) {
      const char = slug[i];
      newSlug += ru[char as keyof typeof ru] !== undefined ? ru[char as keyof typeof ru] : char;
    }
    return newSlug.replace(/[^a-z0-9\-_]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  // ✅ ИСПРАВЛЕННЫЙ МЕТОД (иммутабельный подход)
  togglePublish(product: ProductListDto): void {
    const originalStatus = product.isPublished;
    const newStatus = !originalStatus;

    // Optimistic UI: создаём НОВЫЙ массив
    this.products.update(items =>
      items.map(p => p.id === product.id ? { ...p, isPublished: newStatus } : p)
    );

    this.productService.togglePublishStatus(product.id).subscribe({
      next: () => {
        // Успех — UI уже обновлён
      },
      error: () => {
        // Rollback: создаём новый массив с исходным статусом
        this.products.update(items =>
          items.map(p => p.id === product.id ? { ...p, isPublished: originalStatus } : p)
        );
        alert('Не удалось изменить статус товара');
      }
    });
  }

  resetAndLoad(): void { this.pageNumber.set(1); this.loadProducts(); }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchQuery.set(value);
      this.resetAndLoad();
    }, 500);
  }

  toggleSort(column: 'name' | 'price' | 'date' | 'brand' | 'category' | 'status'): void {
    const current = this.currentSort();
    let nextSort: ProductSortOption = 'date_desc';

    if (column === 'name') nextSort = current === 'name_asc' ? 'name_desc' : 'name_asc';
    else if (column === 'price') nextSort = current === 'price_asc' ? 'price_desc' : 'price_asc';
    else if (column === 'date') nextSort = current === 'date_desc' ? 'date_asc' : 'date_desc';
    else if (column === 'brand') nextSort = current === 'brand_asc' ? 'brand_desc' : 'brand_asc';
    else if (column === 'category') nextSort = current === 'category_asc' ? 'category_desc' : 'category_asc';
    else if (column === 'status') nextSort = current === 'status_desc' ? 'status_asc' : 'status_desc';

    this.currentSort.set(nextSort);
    this.resetAndLoad();
  }

  onTableScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
      if (!this.loading() && !this.isLoadingMore() && this.products().length < this.totalCount()) {
        this.pageNumber.update(p => p + 1);
        this.loadProducts();
      }
    }
  }

  goToStep(step: number): void {
    if (this.isEditing()) {
      this.currentStep.set(step);
    } else {
      if (step < this.currentStep()) {
        this.currentStep.set(step);
      }
    }
  }
}
