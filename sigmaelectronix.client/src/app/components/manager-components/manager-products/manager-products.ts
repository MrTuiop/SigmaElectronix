import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category-service';
import { BrandService } from '../../../services/brand-service';
import { ProductListDto, CreateProductDto, UpdateProductDto } from '../../../models/product-models';
import { BrandListDto } from '../../../models/brand-models';
import {
  LucidePackage, LucidePlus, LucideTrash2, LucideEdit2,
  LucideEye, LucideEyeOff, LucideArrowRight, LucideArrowLeft,
  LucideCheck, LucideChevronLeft, LucideChevronRight, LucideListPlus, LucideX,
  LucideChevronDown, LucideSearch, LucideChevronUp
} from '@lucide/angular';
import { ProductService } from '../../../services/product-service';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';

@Component({
  selector: 'app-manager-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucidePackage, LucidePlus, LucideTrash2, LucideEdit2,
    LucideEye, LucideEyeOff, LucideArrowRight, LucideArrowLeft,
    LucideCheck, LucideChevronLeft, LucideChevronRight, LucideListPlus, LucideX, LucideChevronDown, LucideSearch, LucideChevronUp,
    SpinnerComponent
  ],
  templateUrl: './manager-products.html',
  styleUrl: './manager-products.css'
})
export class ManagerProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private fb = inject(FormBuilder);

  // --- Состояния таблицы ---
  products = signal<ProductListDto[]>([]);
  totalCount = signal(0);
  pageNumber = signal(1);
  pageSize = signal(15); // Загружаем по 15 штук за раз

  loading = signal(false);
  isLoadingMore = signal(false); // Отдельный лоадер для догрузки снизу

  searchQuery = signal('');
  currentSort = signal('date_desc'); // По умолчанию сортируем по дате (новые сверху)
  private searchTimeout: any;

  // Справочники для выпадающих списков
  categories = this.categoryService.allCategories;

  // --- Состояния для Умного поиска категорий ---
  categorySearch = signal('');
  isCatDropdownOpen = signal(false);
  selectedCatDisplay = signal(''); // Здесь храним выбранный путь для отображения

  // --- Состояния для автокомплита характеристик ---
  availableSpecs = signal<Record<string, string[]>>({});
  availableSpecKeys = computed(() => Object.keys(this.availableSpecs()));


  // 1. УМНАЯ ФИЛЬТРАЦИЯ С ПОИСКОМ
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
        if (!current.parentCategoryId) {
          rootName = current.name;
        }
        current = allCats.find(c => c.id === current.parentCategoryId);
      }

      if (pathNames.length > 1) pathNames.shift();
      const displayPath = pathNames.join(' → ');

      // ФИЛЬТРАЦИЯ: Если есть запрос, пропускаем то, что не совпадает (ищем и в пути, и в корне)
      if (search && !displayPath.toLowerCase().includes(search) && !rootName.toLowerCase().includes(search)) {
        return;
      }

      if (!groups.has(rootName)) groups.set(rootName, []);
      groups.get(rootName)!.push({ id: cat.id, displayPath });
    });

    return Array.from(groups.entries()).map(([name, items]) => ({
      groupName: name,
      categories: items.sort((a, b) => a.displayPath.localeCompare(b.displayPath))
    })).sort((a, b) => a.groupName.localeCompare(b.groupName))
      .filter(g => g.categories.length > 0); // Убираем пустые группы после поиска
  });

  filteredBrands = computed(() => {
    const search = this.brandSearch().toLowerCase().trim();
    if (!search) return this.brands();
    return this.brands().filter(b => b.name.toLowerCase().includes(search));
  });

  // --- Методы для поиска брендов ---
  openBrandSearch(): void {
    this.isBrandDropdownOpen.set(true);
    this.brandSearch.set('');
  }

  closeBrandSearch(): void {
    setTimeout(() => this.isBrandDropdownOpen.set(false), 200);
  }

  onBrandSearch(event: Event): void {
    this.brandSearch.set((event.target as HTMLInputElement).value);
    this.isBrandDropdownOpen.set(true);
  }

  selectBrand(id: number, name: string): void {
    this.productForm.patchValue({ brandId: id });
    this.selectedBrandDisplay.set(name);
    this.isBrandDropdownOpen.set(false);
  }

  brands = signal<BrandListDto[]>([]);

  // UI Состояния
  viewMode = signal<'list' | 'form'>('list');
  currentStep = signal(1);
  isEditing = signal(false);
  editingId = signal<number | null>(null);

  productForm!: FormGroup;

  brandSearch = signal('');
  isBrandDropdownOpen = signal(false);
  selectedBrandDisplay = signal('');

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();

    if (this.categories().length === 0) {
      this.categoryService.loadAll().subscribe();
    }
    this.brandService.getBrands(1, 100).subscribe(res => this.brands.set(res.items));
  }

  initForm(): void {
    // 1. СОЗДАЕМ ФОРМУ (скорее всего, этот блок случайно удалился)
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

    // 2. Авто-генерация slug
    this.productForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.isEditing()) {
        const generatedSlug = this.slugify(name);
        this.productForm.get('slug')?.setValue(generatedSlug, { emitEvent: false });
      }
    });

    // 3. АВТОЗАПОЛНЕНИЕ ХАРАКТЕРИСТИК И ПОДСКАЗОК при выборе категории
    this.productForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      // Делаем это только при создании нового товара
      if (categoryId && !this.isEditing()) {
        this.loading.set(true);
        this.productService.getFilters(categoryId).subscribe({
          next: (filters) => {
            // СОХРАНЯЕМ базу подсказок для datalist
            this.availableSpecs.set(filters.specifications || {});

            this.specsArray.clear(); // Очищаем старые поля

            // Если в категории уже есть товары и фильтры
            if (filters.specifications && Object.keys(filters.specifications).length > 0) {
              const keys = Object.keys(filters.specifications);
              // Создаем пустые поля для каждого известного ключа
              keys.forEach(key => this.addSpecification(key, ''));
            } else {
              this.addSpecification(); // Если категория пустая, даем 1 пустую строку
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

  // --- Методы для поиска категорий ---
  openCategorySearch(): void {
    this.isCatDropdownOpen.set(true);
    this.categorySearch.set(''); // Очищаем поиск при открытии
  }

  closeCategorySearch(): void {
    // Небольшая задержка, чтобы успел сработать клик по элементу списка
    setTimeout(() => this.isCatDropdownOpen.set(false), 200);
  }

  onCatSearch(event: Event): void {
    this.categorySearch.set((event.target as HTMLInputElement).value);
    this.isCatDropdownOpen.set(true);
  }

  selectCategory(id: number, path: string): void {
    this.productForm.patchValue({ categoryId: id });
    this.selectedCatDisplay.set(path);
    this.isCatDropdownOpen.set(false);
    this.productForm.get('categoryId')?.updateValueAndValidity();
  }

  // --- Метод для значений характеристик ---
  getValuesForSpecKey(key: string): string[] {
    if (!key) return [];
    return this.availableSpecs()[key.trim()] || [];
  }

  loadProducts(): void {
    if (this.pageNumber() === 1) this.loading.set(true);
    else this.isLoadingMore.set(true);

    this.productService.getAdminProducts({
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      searchQuery: this.searchQuery(), // Передаем поиск
      sortBy: this.currentSort()       // Передаем сортировку
    }).subscribe({
      next: (res) => {
        if (this.pageNumber() === 1) {
          this.products.set(res.items); // Заменяем список (при поиске/сортировке)
        } else {
          // ДОБАВЛЯЕМ в конец списка (при скролле вниз)
          this.products.update(prev => [...prev, ...res.items]);
        }
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  // --- Работа с характеристиками ---
  get specsArray(): FormArray {
    return this.productForm.get('specifications') as FormArray;
  }

  addSpecification(key = '', value = ''): void {
    const specGroup = this.fb.group({
      key: [key, Validators.required],
      value: [value, Validators.required]
    });
    this.specsArray.push(specGroup);
  }

  removeSpecification(index: number): void {
    this.specsArray.removeAt(index);
  }

  // --- Навигация мастера ---
  openCreateMode(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.productForm.reset({ price: 0, isPublished: true });
    this.specsArray.clear();
    this.selectedCatDisplay.set('');    // очищаем отображение категории
    this.selectedBrandDisplay.set('');  // очищаем отображение бренда
    this.currentStep.set(1);
    this.viewMode.set('form');
    this.productForm.reset({ price: 0, isPublished: true, tagsText: '' });
  }

  closeForm(): void {
    this.viewMode.set('list');
  }

  // 2. ПРОВЕРКА ВАЛИДНОСТИ ШАГА
  isStepValid(step: number): boolean {
    const f = this.productForm.controls;
    if (step === 1) {
      return f['name'].valid && f['slug'].valid && f['categoryId'].valid && f['brandId'].valid;
    }
    if (step === 2) {
      return f['price'].valid && f['discountPrice'].valid;
    }
    return true; // 3-й шаг проверяется целиком всей формой
  }

  nextStep(): void {
    if (this.currentStep() < 3 && this.isStepValid(this.currentStep())) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  // --- Сохранение ---
  saveProduct(): void {
    if (this.productForm.invalid) {
      alert('Пожалуйста, заполните все обязательные поля корректно.');
      return;
    }

    this.loading.set(true);
    const formValue = this.productForm.value;

    const specsRecord: Record<string, string> = {};
    formValue.specifications.forEach((spec: { key: string, value: string }) => {
      if (spec.key && spec.value) {
        specsRecord[spec.key.trim()] = spec.value.trim();
      }
    });

    // 1. Превращаем строку с запятыми в чистый массив тегов
    let parsedTags: string[] = [];
    if (formValue.tagsText) {
      parsedTags = formValue.tagsText
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);
    }

    // 2. Исключаем 'tagsText' из отправляемых данных (чтобы не мусорить в запросе)
    const { tagsText, ...cleanFormValue } = formValue;

    // 3. Формируем финальный payload
    const payload: CreateProductDto = {
      ...cleanFormValue,
      specifications: specsRecord,
      tags: parsedTags // 👈 ВОТ ОНО! Теперь мы точно отправляем массив тегов!
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

  // --- Редактирование товара ---
  editProduct(productListItem: ProductListDto): void {
    this.loading.set(true);

    // Переводим форму в режим редактирования ДО заполнения данных, 
    // чтобы не сработал автокомплит характеристик из Шага 1
    this.isEditing.set(true);
    this.editingId.set(productListItem.id);

    // Запрашиваем полные данные товара (с характеристиками и полным описанием)
    this.productService.getProductById(productListItem.id).subscribe({
      next: (fullProduct) => {
        // Заполняем основные поля формы (patchValue)
        const tagsString = fullProduct.tags ? fullProduct.tags.join(', ') : '';
        this.productForm.patchValue({
          name: fullProduct.name,
          slug: fullProduct.slug,
          categoryId: fullProduct.categoryId,
          brandId: fullProduct.brand?.id || null,
          price: fullProduct.price,
          discountPrice: fullProduct.discountPrice,
          // Берем isPublished из элемента списка
          isPublished: productListItem.isPublished,
          shortDescription: fullProduct.shortDescription,
          fullDescription: fullProduct.fullDescription,
          tagsText: tagsString
        });

        // Заполняем характеристики
        this.specsArray.clear();
        if (fullProduct.specifications && Object.keys(fullProduct.specifications).length > 0) {
          Object.entries(fullProduct.specifications).forEach(([key, value]) => {
            this.addSpecification(key, value as string);
          });
        } else {
          this.addSpecification(); // пустая строка, если характеристик нет
        }

        // Обновляем текст в наших кастомных селектах
        this.selectedCatDisplay.set(fullProduct.categoryName || '');
        this.selectedBrandDisplay.set(fullProduct.brand?.name || '');

        // Открываем форму на первом шаге
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

  // --- Переключение статуса товара ---
  togglePublish(product: ProductListDto): void {
    // Сохраняем оригинальный статус на случай ошибки
    const originalStatus = product.isPublished;

    // Мгновенно меняем статус в UI (Оптимистичный UI)
    product.isPublished = !product.isPublished;

    this.productService.togglePublishStatus(product.id).subscribe({
      next: () => {
        // Успешно переключено (можешь добавить вызов Toast-уведомления, если хочешь)
      },
      error: () => {
        // Если сервер выдал ошибку, возвращаем статус как было
        product.isPublished = originalStatus;
        alert('Не удалось изменить статус товара');
      }
    });
  }

  // --- СОРТИРОВКА И ПОИСК ---
  resetAndLoad(): void {
    this.pageNumber.set(1);
    this.loadProducts();
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.searchTimeout);
    // Ждем 500мс после того как юзер перестал печатать, чтобы не спамить бэкенд
    this.searchTimeout = setTimeout(() => {
      this.searchQuery.set(value);
      this.resetAndLoad();
    }, 500);
  }

  toggleSort(column: 'name' | 'price' | 'date' | 'brand' | 'category' | 'status'): void {
    const current = this.currentSort();
    let nextSort = 'date_desc';

    if (column === 'name') {
      nextSort = current === 'name_asc' ? 'name_desc' : 'name_asc';
    } else if (column === 'price') {
      nextSort = current === 'price_asc' ? 'price_desc' : 'price_asc';
    } else if (column === 'date') {
      nextSort = current === 'date_desc' ? 'date_asc' : 'date_desc';
    } else if (column === 'brand') {
      nextSort = current === 'brand_asc' ? 'brand_desc' : 'brand_asc';
    } else if (column === 'category') {
      nextSort = current === 'category_asc' ? 'category_desc' : 'category_asc';
    } else if (column === 'status') {
      nextSort = current === 'status_desc' ? 'status_asc' : 'status_desc';
    }

    this.currentSort.set(nextSort);
    this.resetAndLoad();
  }

  // --- БЕСКОНЕЧНЫЙ СКРОЛЛ ---
  onTableScroll(event: Event): void {
    const target = event.target as HTMLElement;
    // Если доскроллили почти до конца (осталось 100px)
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
      // Если сейчас не грузим и если загружены еще не все товары
      if (!this.loading() && !this.isLoadingMore() && this.products().length < this.totalCount()) {
        this.pageNumber.update(p => p + 1);
        this.loadProducts();
      }
    }
  }
}
