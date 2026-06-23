import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrandService } from '../../../services/brand-service';
import { LanguageService } from '../../../services/language-service';
import { ToastService } from '../../../services/toast';
import { BrandListDto, BrandShowcaseDto, BrandTranslationDto, CreateBrandDto } from '../../../models/brand-models';
import { LanguageDto } from '../../../models/language-models';
import {
  LucideLanguages, LucideSearch, LucideChevronLeft, LucideCheck,
  LucideX, LucideSave, LucideAward, LucideGlobe, LucideChevronUp, LucideChevronDown
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';

@Component({
  selector: 'app-manager-translations-brands',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideLanguages, LucideSearch, LucideChevronLeft, LucideCheck, LucideX,
    LucideSave, LucideAward, LucideGlobe, LucideChevronUp, LucideChevronDown,
    SpinnerComponent
  ],
  templateUrl: './manager-translations-brands.html',
  styleUrl: './manager-translations-brands.css'
})
export class ManagerTranslationsBrandsComponent implements OnInit {
  private brandService = inject(BrandService);
  private languageService = inject(LanguageService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // --- Состояния списка брендов ---
  brands = signal<readonly BrandListDto[]>([]);
  totalCount = signal(0);
  pageNumber = signal(1);
  pageSize = signal(15);
  loading = signal(false);
  isLoadingMore = signal(false);
  searchQuery = signal('');
  private searchTimeout: any;

  // --- Состояния режима перевода ---
  viewMode = signal<'list' | 'form'>('list');
  baseBrand = signal<BrandShowcaseDto | null>(null);

  languages = signal<LanguageDto[]>([]);
  targetLanguages = computed(() => this.languages().filter(l => l.code !== 'ru' && l.isActive));

  selectedLang = signal<string>('');
  selectedLangObj = computed(() => this.languages().find(l => l.code === this.selectedLang()));

  translationForm!: FormGroup;

  ngOnInit(): void {
    this.loadBrands();
    this.loadLanguages();
    this.initForm();
  }

  loadLanguages(): void {
    this.languageService.getAllLanguages(false).subscribe({
      next: (langs) => this.languages.set(langs)
    });
  }

  loadBrands(): void {
    if (this.pageNumber() === 1) this.loading.set(true);
    else this.isLoadingMore.set(true);

    // ✅ ПРАВИЛЬНО: Передаем аргументы через запятую
    this.brandService.getBrandsForAdmin(
      this.pageNumber(),
      this.pageSize(),
      this.searchQuery(),
      'name_asc'
    ).subscribe({
      next: (res) => {
        if (this.pageNumber() === 1) {
          this.brands.set(res.items);
        } else {
          this.brands.update(prev => [...prev, ...res.items]);
        }
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.toastService.error('Ошибка загрузки списка брендов');
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
      this.loadBrands();
    }, 500);
  }

  onTableScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
      if (!this.loading() && !this.isLoadingMore() && this.brands().length < this.totalCount()) {
        this.pageNumber.update(p => p + 1);
        this.loadBrands();
      }
    }
  }

  openTranslateMode(brand: BrandListDto): void {
    this.loading.set(true);
    this.brandService.getBrandBySlugForAdmin(brand.slug).subscribe({
      next: (fullBrand) => {
        this.baseBrand.set(fullBrand);
        this.selectedLang.set('');
        this.viewMode.set('form');
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Не удалось загрузить данные бренда');
        this.loading.set(false);
      }
    });
  }

  closeForm(): void {
    this.viewMode.set('list');
    this.baseBrand.set(null);
    this.loadBrands();
  }

  selectLanguage(code: string): void {
    this.selectedLang.set(code);
    this.populateTranslationForm(code);
  }

  initForm(): void {
    this.translationForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      description: ['', Validators.required],
      heroTitle: [''],
      heroSubtitle: [''],
      bannerButtonText: ['']
    });

    this.translationForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.translationForm.get('slug')?.touched) {
        const generatedSlug = this.slugify(name);
        this.translationForm.get('slug')?.setValue(generatedSlug, { emitEvent: false });
      }
    });
  }

  populateTranslationForm(langCode: string): void {
    const brand = this.baseBrand();
    if (!brand) return;

    const existingTranslation = brand.translations?.find(t => t.languageCode === langCode);

    if (existingTranslation) {
      this.translationForm.patchValue({
        name: existingTranslation.name,
        slug: existingTranslation.slug,
        description: existingTranslation.description,
        heroTitle: existingTranslation.heroTitle || '',
        heroSubtitle: existingTranslation.heroSubtitle || '',
        bannerButtonText: existingTranslation.bannerButtonText || ''
      });
    } else {
      this.translationForm.reset({
        name: '',
        slug: brand.slug + '-' + langCode,
        description: '',
        heroTitle: '',
        heroSubtitle: '',
        bannerButtonText: ''
      });
    }
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

    const brand = this.baseBrand();
    if (!brand) return;

    this.loading.set(true);
    const formValue = this.translationForm.value;

    const translationPayload: BrandTranslationDto = {
      languageCode: this.selectedLang(),
      name: formValue.name,
      slug: formValue.slug,
      description: formValue.description,
      heroTitle: formValue.heroTitle || null,
      heroSubtitle: formValue.heroSubtitle || null,
      bannerButtonText: formValue.bannerButtonText || null
    };

    const existingTranslations = brand.translations || [];
    const updatedTranslations = existingTranslations.filter(t => t.languageCode !== translationPayload.languageCode);
    updatedTranslations.push(translationPayload);

    // Подготавливаем полное DTO обновления, сохраняя оригинальные картинки
    const updatePayload: any = {
      logoUrl: brand.logoUrl,
      heroImageUrl: brand.heroImageUrl,
      isFeatured: brand.isFeatured,
      isActive: brand.isActive,
      translations: updatedTranslations
    };

    this.brandService.updateBrand(brand.id, updatePayload).subscribe({
      next: () => {
        this.toastService.success(`Перевод для ${this.selectedLangObj()?.nativeName} успешно сохранён!`);
        this.loading.set(false);
        this.baseBrand.update(b => b ? { ...b, translations: updatedTranslations } : b);
      },
      error: () => {
        this.toastService.error('Ошибка при сохранении перевода');
        this.loading.set(false);
      }
    });
  }
}
