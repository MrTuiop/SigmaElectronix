import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product-service';
import { LanguageService } from '../../../services/language-service';
import { ToastService } from '../../../services/toast';
import { ProductListDto, ProductDetailDto, ProductTranslationDto } from '../../../models/product-models';
import { LanguageDto } from '../../../models/language-models';
import {
  LucideLanguages, LucideSearch, LucideChevronLeft, LucideCheck,
  LucideX, LucideSave, LucidePackage, LucideGlobe
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';

// Расширяем интерфейсы локально для поддержки новых полей бэкенда
interface ExtendedProductList extends ProductListDto {
  translationsCount?: number;
}
interface ExtendedProductDetail extends ProductDetailDto {
  translations?: ProductTranslationDto[];
}

@Component({
  selector: 'app-manager-translations-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideLanguages, LucideSearch, LucideChevronLeft, LucideCheck, LucideX,
    LucideSave, LucidePackage, LucideGlobe,
    SpinnerComponent
  ],
  templateUrl: './manager-translations-products.html',
  styleUrl: './manager-translations-products.css'
})
export class ManagerTranslationsProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private languageService = inject(LanguageService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // --- Состояния списка товаров ---
  products = signal<readonly ExtendedProductList[]>([]);
  totalCount = signal(0);
  pageNumber = signal(1);
  pageSize = signal(15);
  loading = signal(false);
  isLoadingMore = signal(false);
  searchQuery = signal('');
  private searchTimeout: any;

  // --- Состояния режима перевода ---
  viewMode = signal<'list' | 'form'>('list');
  baseProduct = signal<ExtendedProductDetail | null>(null);

  languages = signal<LanguageDto[]>([]);
  targetLanguages = computed(() => this.languages().filter(l => l.code !== 'ru' && l.isActive));

  selectedLang = signal<string>('');
  selectedLangObj = computed(() => this.languages().find(l => l.code === this.selectedLang()));

  translationForm!: FormGroup;

  ngOnInit(): void {
    this.loadProducts();
    this.loadLanguages();
    this.initForm();
  }

  loadLanguages(): void {
    this.languageService.getAllLanguages(false).subscribe({
      next: (langs) => this.languages.set(langs)
    });
  }

  loadProducts(): void {
    if (this.pageNumber() === 1) this.loading.set(true);
    else this.isLoadingMore.set(true);

    this.productService.getAdminProducts({
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      searchQuery: this.searchQuery(),
      sortBy: 'date_desc'
    }).subscribe({
      next: (res) => {
        if (this.pageNumber() === 1) {
          this.products.set(res.items);
        } else {
          this.products.update(prev => [...prev, ...res.items]);
        }
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.toastService.error('Ошибка загрузки списка товаров');
        this.loading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchQuery.set(value);
      this.pageNumber.set(1);
      this.loadProducts();
    }, 500);
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

  openTranslateMode(product: ExtendedProductList): void {
    this.loading.set(true);
    this.productService.getProductByIdForAdmin(product.id).subscribe({
      next: (fullProduct) => {
        this.baseProduct.set(fullProduct as ExtendedProductDetail);
        this.selectedLang.set('');
        this.viewMode.set('form');
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Не удалось загрузить данные товара');
        this.loading.set(false);
      }
    });
  }

  closeForm(): void {
    this.viewMode.set('list');
    this.baseProduct.set(null);
    this.loadProducts(); // Обновляем список, чтобы счетчики переводов актуализировались
  }

  selectLanguage(code: string): void {
    this.selectedLang.set(code);
    this.populateTranslationForm(code);
  }

  initForm(): void {
    this.translationForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      shortDescription: ['', Validators.required],
      fullDescription: [''],
      tagsText: [''],
      specifications: this.fb.array([])
    });

    this.translationForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.translationForm.get('slug')?.touched) {
        const generatedSlug = this.slugify(name);
        this.translationForm.get('slug')?.setValue(generatedSlug, { emitEvent: false });
      }
    });
  }

  get specsArray(): FormArray {
    return this.translationForm.get('specifications') as FormArray;
  }

  baseSpecs = computed(() => {
    const p = this.baseProduct();
    if (!p || !p.specifications) return [];
    return Object.entries(p.specifications).map(([key, value]) => ({ key, value }));
  });

  getBaseTags(): string {
    const p = this.baseProduct();
    return p?.tags?.join(', ') || '—';
  }

  populateTranslationForm(langCode: string): void {
    const product = this.baseProduct();
    if (!product) return;

    const existingTranslation = product.translations?.find(t => t.languageCode === langCode);

    if (existingTranslation) {
      this.translationForm.patchValue({
        name: existingTranslation.name,
        slug: existingTranslation.slug,
        shortDescription: existingTranslation.shortDescription,
        fullDescription: existingTranslation.fullDescription,
        tagsText: existingTranslation.tags?.join(', ') || ''
      });

      this.specsArray.clear();
      if (existingTranslation.specifications && Object.keys(existingTranslation.specifications).length > 0) {
        Object.entries(existingTranslation.specifications).forEach(([key, value]) => {
          this.specsArray.push(this.fb.group({
            key: [key, Validators.required],
            value: [value, Validators.required]
          }));
        });
      } else {
        this.buildEmptySpecs();
      }
    } else {
      this.translationForm.reset({
        name: '',
        slug: product.slug + '-' + langCode,
        shortDescription: '',
        fullDescription: '',
        tagsText: ''
      });
      this.specsArray.clear();
      this.buildEmptySpecs();
    }
  }

  private buildEmptySpecs(): void {
    this.baseSpecs().forEach(() => {
      this.specsArray.push(this.fb.group({
        key: ['', Validators.required],
        value: ['', Validators.required]
      }));
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

  saveTranslation(): void {
    if (this.translationForm.invalid) {
      this.translationForm.markAllAsTouched();
      return;
    }

    const product = this.baseProduct();
    if (!product) return;

    this.loading.set(true);
    const formValue = this.translationForm.value;

    const specsRecord: Record<string, string> = {};
    formValue.specifications.forEach((spec: { key: string, value: string }) => {
      if (spec.key && spec.value) {
        specsRecord[spec.key.trim()] = spec.value.trim();
      }
    });

    let parsedTags: string[] = [];
    if (formValue.tagsText) {
      parsedTags = formValue.tagsText.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    }

    const translationPayload: ProductTranslationDto = {
      languageCode: this.selectedLang(),
      name: formValue.name,
      slug: formValue.slug,
      shortDescription: formValue.shortDescription,
      fullDescription: formValue.fullDescription || '',
      specifications: specsRecord,
      tags: parsedTags
    };

    const existingTranslations = product.translations || [];
    const updatedTranslations = existingTranslations.filter(t => t.languageCode !== translationPayload.languageCode);
    updatedTranslations.push(translationPayload);

    const updatePayload = {
      price: product.price,
      discountPrice: product.discountPrice,
      brandId: product.brand.id,
      categoryId: product.categoryId,
      isPublished: product.isPublished,
      images: product.images,
      translations: updatedTranslations
    };

    this.productService.updateProduct(product.id, updatePayload as any).subscribe({
      next: () => {
        this.toastService.success(`Перевод для ${this.selectedLangObj()?.nativeName} успешно сохранён!`);
        this.loading.set(false);

        // Обновляем локальный кэш товара, чтобы при клике на вкладку снова данные подгружались мгновенно
        this.baseProduct.update(p => p ? { ...p, translations: updatedTranslations } : p);

        // Специально НЕ закрываем форму, чтобы менеджер мог перейти к следующему языку
      },
      error: () => {
        this.toastService.error('Ошибка при сохранении перевода');
        this.loading.set(false);
      }
    });
  }
}
