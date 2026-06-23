import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideSearch } from '@lucide/angular';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { SearchService } from '../../../services/search-service';
import { SearchSuggestDto } from '../../../models/search-models';
import { LanguageService } from '../../../services/language-service'; // 👈 Импортируем

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideSearch],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css'],
})
export class SearchBarComponent implements OnInit {
  private searchService = inject(SearchService);
  private router = inject(Router);
  private languageService = inject(LanguageService); // 👈 Инжектим

  private previousLanguage = signal<string>(this.languageService.currentLanguage());

  searchQuery = signal('');

  // 👇 Словарь переводов для placeholder и fallback тегов
  private readonly translations: Record<string, { placeholder: string; fallbackTags: string[] }> = {
    ru: {
      placeholder: 'Искать ноутбук, смартфон, наушники...',
      fallbackTags: ['Смартфоны', 'Ноутбуки', 'Наушники', 'Игры', 'Аксессуары']
    },
    en: {
      placeholder: 'Search laptop, smartphone, headphones...',
      fallbackTags: ['Smartphones', 'Laptops', 'Headphones', 'Gaming', 'Accessories']
    },
    uz: {
      placeholder: 'Noutbuk, smartfon, quloqchin qidirish...',
      fallbackTags: ['Smartfonlar', 'Noutbuklar', 'Quloqchinlar', 'O\'yinlar', 'Aksessuarlar']
    }
  };

  defaultPlaceholder = signal(this.getTranslation().placeholder);
  currentPlaceholder = signal(this.getTranslation().placeholder);

  suggestions = signal<SearchSuggestDto | null>(null);
  isDropdownOpen = signal(false);
  isLoading = signal(false);
  quickTags = signal<string[]>([]);

  hoverTimeout: any;

  constructor() {
    // Реактивный поиск с debounce
    toObservable(this.searchQuery).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(query => {
        if (!query || query.length < 2) {
          this.isDropdownOpen.set(false);
          this.suggestions.set(null);
          this.isLoading.set(false);
          return false;
        }
        return true;
      }),
      switchMap(query => {
        this.isLoading.set(true);
        return this.searchService.getSuggestions(query);
      })
    ).subscribe({
      next: (data) => {
        this.suggestions.set(data);
        this.isDropdownOpen.set(true);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Ошибка поиска:', err);
        this.isLoading.set(false);
      }
    });

    // 👇 Магия effect: реагирует на смену языка
    this.languageEffect = effect(() => {
      const currentLang = this.languageService.currentLanguage();
      if (this.previousLanguage() !== currentLang) {
        this.previousLanguage.set(currentLang);
        this.onLanguageChanged();
      }
    });
  }

  private languageEffect!: ReturnType<typeof effect>;

  ngOnInit(): void {
    this.loadPopularTags();
  }

  // 👇 Отдельный метод для загрузки тегов (используется в ngOnInit и при смене языка)
  private loadPopularTags(): void {
    this.searchService.getPopularTags(7).subscribe({
      next: (tags) => {
        if (tags && tags.length > 0) {
          this.quickTags.set(tags);
        } else {
          this.quickTags.set(this.getTranslation().fallbackTags);
        }
      },
      error: (err) => {
        console.error('Ошибка при загрузке популярных тегов:', err);
        this.quickTags.set(this.getTranslation().fallbackTags);
      }
    });
  }

  // 👇 Вызывается при смене языка
  private onLanguageChanged(): void {
    // 1. Обновляем placeholder
    const translation = this.getTranslation();
    this.defaultPlaceholder.set(translation.placeholder);

    // Если placeholder не был изменён hover-эффектом — обновляем currentPlaceholder
    if (!this.currentPlaceholder().includes('Нажмите, чтобы искать') &&
      !this.currentPlaceholder().includes('Click to search') &&
      !this.currentPlaceholder().includes('Bosing')) {
      this.currentPlaceholder.set(translation.placeholder);
    }

    // 2. Перезагружаем популярные теги (придут с новым переводом)
    this.loadPopularTags();

    // 3. Если пользователь уже ввёл запрос — перезапускаем поиск, 
    //    чтобы dropdown обновился на новом языке
    const currentQuery = this.searchQuery();
    if (currentQuery && currentQuery.length >= 2) {
      this.isLoading.set(true);
      this.searchService.getSuggestions(currentQuery).subscribe({
        next: (data) => {
          this.suggestions.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    }
  }

  // 👇 Хелпер для получения перевода по текущему языку
  private getTranslation() {
    const lang = this.languageService.currentLanguage();
    return this.translations[lang] || this.translations['ru'];
  }

  onTagHover(tag: string) {
    clearTimeout(this.hoverTimeout);
    const lang = this.languageService.currentLanguage();
    const prefix = lang === 'en' ? 'Click to search:'
      : lang === 'uz' ? 'Qidirish uchun bosing:'
        : 'Нажмите, чтобы искать:';
    this.currentPlaceholder.set(`${prefix} "${tag}"`);
  }

  onTagLeave() {
    this.hoverTimeout = setTimeout(() => {
      this.currentPlaceholder.set(this.defaultPlaceholder());
    }, 50);
  }

  onTagClick(tag: string) {
    this.searchQuery.set(tag);
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  closeDropdown() {
    this.isDropdownOpen.set(false);
  }

  triggerSearch() {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.closeDropdown();

    const sugs = this.suggestions();

    if (sugs) {
      if (sugs.categories.length > 0) {
        this.router.navigate(['/catalog', sugs.categories[0].slug]);
        return;
      }

      if (sugs.brands.length > 0) {
        this.router.navigate(['/brands', sugs.brands[0].slug]);
        return;
      }

      if (sugs.products.length > 0) {
        this.router.navigate(['/products', sugs.products[0].slug]);
        return;
      }
    }

    console.log('Ничего конкретного не найдено, открываем страницу всех результатов для:', query);
  }
}
