import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // <-- 1. ДОБАВИЛ Router
import { LucideSearch } from '@lucide/angular';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { SearchService } from '../../../services/search-service';
import { SearchSuggestDto } from '../../../models/search-models';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideSearch],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css'],
})
export class SearchBarComponent implements OnInit{
  private searchService = inject(SearchService);
  private router = inject(Router); // <-- 2. ИНЖЕКТИРУЕМ РОУТЕР

  searchQuery = signal('');
  defaultPlaceholder = 'Искать ноутбук, смартфон, наушники...';
  currentPlaceholder = signal(this.defaultPlaceholder);

  // Сигналы для умного поиска
  suggestions = signal<SearchSuggestDto | null>(null);
  isDropdownOpen = signal(false);
  isLoading = signal(false);

  quickTags = signal<string[]>([]);

  hoverTimeout: any;

  constructor() {
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
  }

  ngOnInit(): void {
    this.searchService.getPopularTags(10).subscribe({
      next: (tags) => {
        if (tags && tags.length > 0) {
          this.quickTags.set(tags);
        } else {
          // Если бэкенд почему-то ничего не вернул, ставим запасные (Fallback)
          this.quickTags.set(['Смартфоны', 'Ноутбуки', 'Наушники', 'Игры', 'Аксессуары']);
        }
      },
      error: (err) => {
        console.error('Ошибка при загрузке популярных тегов:', err);
        // Запасной вариант при ошибке сервера
        this.quickTags.set(['Смартфоны', 'Ноутбуки', 'Наушники', 'Игры', 'Аксессуары']);
      }
    });
  }

  onTagHover(tag: string) {
    clearTimeout(this.hoverTimeout);
    this.currentPlaceholder.set(`Нажмите, чтобы искать: "${tag}"`);
  }

  onTagLeave() {
    this.hoverTimeout = setTimeout(() => {
      this.currentPlaceholder.set(this.defaultPlaceholder);
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

  // 🚀 3. ОБНОВЛЕННЫЙ МЕТОД ПОИСКА ПО ENTER / КЛИКУ
  triggerSearch() {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.closeDropdown();

    // Берем текущие подсказки (то, что бэкенд уже успел найти)
    const sugs = this.suggestions();

    if (sugs) {
      // ПРИОРИТЕТ 1: Если нашли подходящую категорию (ввели "телефоны")
      if (sugs.categories.length > 0) {
        this.router.navigate(['/catalog', sugs.categories[0].slug]);
        return;
      }

      // ПРИОРИТЕТ 2: Если нашли подходящий бренд (ввели "Apple")
      if (sugs.brands.length > 0) {
        this.router.navigate(['/brands', sugs.brands[0].slug]);
        return;
      }

      // ПРИОРИТЕТ 3: Если нашли конкретный товар (ввели "iPhone 15 Pro")
      if (sugs.products.length > 0) {
        // Убедись, что тут правильный маршрут (/product или /products)
        this.router.navigate(['/products', sugs.products[0].slug]);
        return;
      }
    }

    // 💡 ПАДЕНИЕ (ФОЛЛБЭК):
    // Если пользователь напечатал абракадабру очень быстро и сразу нажал Enter,
    // или ничего не нашлось — мы кидаем его на общую страницу результатов поиска.
    // Если у тебя еще нет такой страницы, пока можешь оставить просто console.log
    // this.router.navigate(['/search'], { queryParams: { q: query } });
    console.log('Ничего конкретного не найдено, открываем страницу всех результатов для:', query);
  }
}
