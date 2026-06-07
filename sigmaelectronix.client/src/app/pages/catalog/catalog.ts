import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  LucideChevronRight
} from '@lucide/angular';
import { CategoryGridComponent } from '../../components/category-components/category-grid/category-grid';
import { ProductListComponent } from '../../components/category-components/product-list/product-list';


interface CategoryData {
  id: number;
  name: string;
  slug: string;
  subcategories?: { name: string; slug: string; icon: string }[];
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CategoryGridComponent,
    ProductListComponent,
    LucideChevronRight
  ],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class CatalogPage {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  category = signal<CategoryData | null>(null);
  isLoading = signal(true);
  currentSlug = signal<string | null>(null);

  // Хлебные крошки — будем строить из цепочки категорий (заглушка)
  breadcrumbs = signal<{ label: string; slug?: string }[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('categorySlug');
      this.currentSlug.set(slug);
      this.loadCategory(slug);
    });
  }

  loadCategory(slug: string | null): void {
    this.isLoading.set(true);
    // Заглушка: возвращаем статические данные в зависимости от слага
    // В реальном проекте — сервис, который обращается к API
    const data$ = this.getCategoryData(slug);
    data$.subscribe(data => {
      this.category.set(data);
      this.buildBreadcrumbs(slug, data);
      this.isLoading.set(false);
    });
  }

  private getCategoryData(slug: string | null): Observable<CategoryData> {
    // Имитация задержки и ответа от сервера
    return of(this.getMockData(slug)).pipe(
      // delay(300) // если нужно показать лоадер
    );
  }

  private getMockData(slug: string | null): CategoryData {
    if (!slug) {
      return {
        id: 0,
        name: 'Каталог товаров',
        slug: '',
        subcategories: [
          { name: 'Смартфоны', slug: 'smartphones', icon: 'smartphone' },
          { name: 'Ноутбуки', slug: 'laptops', icon: 'laptop' },
          { name: 'Наушники', slug: 'headphones', icon: 'headphones' },
          { name: 'Часы', slug: 'watches', icon: 'watch' },
          { name: 'Телевизоры', slug: 'tvs', icon: 'tv' },
          { name: 'Игровые приставки', slug: 'consoles', icon: 'gamepad-2' }
        ]
      };
    }

    if (slug === 'smartphones') {
      return {
        id: 1,
        name: 'Смартфоны',
        slug: 'smartphones',
        subcategories: [
          { name: 'Apple iPhone', slug: 'iphone', icon: 'smartphone' },
          { name: 'Samsung Galaxy', slug: 'samsung', icon: 'smartphone' },
          { name: 'Xiaomi', slug: 'xiaomi', icon: 'smartphone' }
        ]
      };
    }

    if (slug === 'iphone') {
      return {
        id: 2,
        name: 'iPhone',
        slug: 'iphone',
        subcategories: [] // конечная категория → покажем товары
      };
    }

    if (slug === 'samsung') {
      return {
        id: 3,
        name: 'Samsung Galaxy',
        slug: 'samsung',
        subcategories: []
      };
    }

    if (slug === 'xiaomi') {
      return {
        id: 4,
        name: 'Xiaomi',
        slug: 'xiaomi',
        subcategories: []
      };
    }

    if (slug === 'laptops') {
      return {
        id: 5,
        name: 'Ноутбуки',
        slug: 'laptops',
        subcategories: [
          { name: 'Apple MacBook', slug: 'macbook', icon: 'laptop' },
          { name: 'Игровые ноутбуки', slug: 'gaming-laptops', icon: 'laptop' }
        ]
      };
    }

    if (slug === 'macbook') {
      return {
        id: 6,
        name: 'MacBook',
        slug: 'macbook',
        subcategories: []
      };
    }

    if (slug === 'gaming-laptops') {
      return {
        id: 7,
        name: 'Игровые ноутбуки',
        slug: 'gaming-laptops',
        subcategories: []
      };
    }

    // По умолчанию — категория без подкатегорий (для остальных slug)
    return {
      id: 99,
      name: slug || 'Категория',
      slug: slug || '',
      subcategories: []
    };
  }

  private buildBreadcrumbs(slug: string | null, category: CategoryData): void {
    const crumbs: { label: string; slug?: string }[] = [{ label: 'Главная', slug: '' }];
    if (slug) {
      // Простейшая логика: добавляем родительские категории, основываясь на slug
      // В реальности надо получать с бэкенда. Здесь делаем заглушку по карте.
      const map: Record<string, { parent: string; label: string }> = {
        'iphone': { parent: 'smartphones', label: 'Смартфоны' },
        'samsung': { parent: 'smartphones', label: 'Смартфоны' },
        'xiaomi': { parent: 'smartphones', label: 'Смартфоны' },
        'macbook': { parent: 'laptops', label: 'Ноутбуки' },
        'gaming-laptops': { parent: 'laptops', label: 'Ноутбуки' }
      };
      if (map[slug]) {
        crumbs.push({ label: map[slug].label, slug: map[slug].parent });
      }
      crumbs.push({ label: category.name });
    } else {
      crumbs.push({ label: 'Каталог' });
    }
    this.breadcrumbs.set(crumbs);
  }
}

