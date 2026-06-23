import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category-service';
import { LanguageService } from '../../../services/language-service';
import { ToastService } from '../../../services/toast';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto, CategoryTranslationDto } from '../../../models/category-models';
import { LanguageDto } from '../../../models/language-models';
import {
  LucideLanguages, LucideSearch, LucideChevronLeft, LucideCheck,
  LucideX, LucideSave, LucideFolderTree, LucideGlobe
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';

@Component({
  selector: 'app-manager-translations-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideLanguages, LucideSearch, LucideChevronLeft, LucideCheck, LucideX,
    LucideSave, LucideFolderTree, LucideGlobe,
    SpinnerComponent
  ],
  templateUrl: './manager-translations-categories.html',
  styleUrl: './manager-translations-categories.css'
})
export class ManagerTranslationsCategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private languageService = inject(LanguageService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // --- Состояния списка категорий ---
  categories = signal<readonly CategoryDto[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  // Локальная пагинация/фильтрация
  filteredCategories = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.categories();
    return this.categories().filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query)
    );
  });

  // --- Состояния режима перевода ---
  viewMode = signal<'list' | 'form'>('list');
  baseCategory = signal<CategoryDto | null>(null);

  languages = signal<LanguageDto[]>([]);
  // Исключаем базовый язык (ru) из списка доступных для перевода
  targetLanguages = computed(() => this.languages().filter(l => l.code !== 'ru' && l.isActive));

  selectedLang = signal<string>('');
  selectedLangObj = computed(() => this.languages().find(l => l.code === this.selectedLang()));

  translationForm!: FormGroup;

  ngOnInit(): void {
    this.loadCategories();
    this.loadLanguages();
    this.initForm();
  }

  loadLanguages(): void {
    this.languageService.getAllLanguages(false).subscribe({
      next: (langs) => this.languages.set(langs)
    });
  }

  loadCategories(): void {
    this.loading.set(true);
    // Загружаем плоский список категорий из админского эндпоинта
    this.categoryService.loadAllForAdmin().subscribe({
      next: (res) => {
        this.categories.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Ошибка загрузки списка категорий');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  openTranslateMode(category: CategoryDto): void {
    this.loading.set(true);
    // Запрашиваем полные данные категории (с массивом translations)
    this.categoryService.getByIdForAdmin(category.id).subscribe({
      next: (fullCategory) => {
        this.baseCategory.set(fullCategory);
        this.selectedLang.set('');
        this.viewMode.set('form');
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Не удалось загрузить данные категории');
        this.loading.set(false);
      }
    });
  }

  closeForm(): void {
    this.viewMode.set('list');
    this.baseCategory.set(null);
    this.loadCategories(); // Обновляем список, чтобы обновить счетчики переводов
  }

  selectLanguage(code: string): void {
    this.selectedLang.set(code);
    this.populateTranslationForm(code);
  }

  initForm(): void {
    this.translationForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9\-_]+$/)]]
    });

    // Умная автогенерация slug для перевода
    this.translationForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.translationForm.get('slug')?.touched) {
        const generatedSlug = this.slugify(name);
        this.translationForm.get('slug')?.setValue(generatedSlug, { emitEvent: false });
      }
    });
  }

  populateTranslationForm(langCode: string): void {
    const category = this.baseCategory();
    if (!category) return;

    const existingTranslation = category.translations?.find(t => t.languageCode === langCode);

    if (existingTranslation) {
      // Если перевод уже есть, заполняем форму им
      this.translationForm.patchValue({
        name: existingTranslation.name,
        slug: existingTranslation.slug
      });
    } else {
      // Если перевода нет, очищаем форму и подставляем базовый slug с префиксом языка
      this.translationForm.reset({
        name: '',
        slug: category.slug + '-' + langCode
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

    const category = this.baseCategory();
    if (!category) return;

    this.loading.set(true);
    const formValue = this.translationForm.value;

    const translationPayload: CategoryTranslationDto = {
      languageCode: this.selectedLang(),
      name: formValue.name,
      slug: formValue.slug
    };

    // Берем существующие переводы и заменяем/добавляем текущий
    const existingTranslations = category.translations || [];
    const updatedTranslations = existingTranslations.filter(t => t.languageCode !== translationPayload.languageCode);
    updatedTranslations.push(translationPayload);

    // Формируем payload для обновления всей категории
    const updatePayload: UpdateCategoryDto = {
      imageUrl: category.imageUrl,
      icon: category.icon,
      parentCategoryId: category.parentCategoryId,
      translations: updatedTranslations
    };

    this.categoryService.update(category.id, updatePayload).subscribe({
      next: () => {
        this.toastService.success(`Перевод для ${this.selectedLangObj()?.nativeName} успешно сохранён!`);
        this.loading.set(false);

        // Обновляем локальное состояние, чтобы можно было сразу переключиться на другой язык
        this.baseCategory.update(c => c ? { ...c, translations: updatedTranslations } : c);
      },
      error: () => {
        this.toastService.error('Ошибка при сохранении перевода');
        this.loading.set(false);
      }
    });
  }
}
