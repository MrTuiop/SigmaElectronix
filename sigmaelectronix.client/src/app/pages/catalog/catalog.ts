import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideChevronRight } from '@lucide/angular';
import { CategoryGridComponent } from '../../components/category-components/category-grid/category-grid';
import { ProductListComponent } from '../../components/category-components/product-list/product-list';
import { CategoryService } from '../../services/category-service';

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
export class CatalogPage implements OnInit {
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService); // <-- Подключили реальный сервис

  category = signal<CategoryData | null>(null);
  isLoading = signal(true);
  currentSlug = signal<string | null>(null);
  breadcrumbs = signal<{ label: string; slug?: string }[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('categorySlug');
      this.currentSlug.set(slug);

      const tree = this.categoryService.categoryTree();

      // Если дерево категорий еще не загружено (пользователь обновил страницу)
      if (tree.length === 0) {
        this.isLoading.set(true);
        this.categoryService.loadTree().subscribe(() => {
          this.loadCategoryFromTree(slug);
        });
      } else {
        this.loadCategoryFromTree(slug);
      }
    });
  }

  private loadCategoryFromTree(slug: string | null): void {
    const tree = this.categoryService.categoryTree();
    this.isLoading.set(false);

    // 🌟 ВИРТУАЛЬНАЯ КАТЕГОРИЯ: НОВИНКИ
    if (slug === 'new-arrivals') {
      this.category.set({
        id: -2, // Специальный отрицательный ID, чтобы фронтенд понял, что это новинки
        name: 'Новинки',
        slug: 'new-arrivals',
        subcategories: [] // Оставляем пустым, чтобы Angular сразу вывел список товаров (ProductListComponent)
      });

      this.breadcrumbs.set([
        { label: 'Главная', slug: '' },
        { label: 'Каталог', slug: 'catalog' },
        { label: 'Новинки' }
      ]);
      return;
    }

    // 🔥 ВИРТУАЛЬНАЯ КАТЕГОРИЯ 2: ХИТЫ ПРОДАЖ
    if (slug === 'best-sellers') {
      this.category.set({
        id: -3, // Новый специальный отрицательный ID
        name: 'Хиты продаж',
        slug: 'best-sellers',
        subcategories: [] // Оставляем пустым, чтобы вывелась сетка товаров
      });
      this.breadcrumbs.set([
        { label: 'Главная', slug: '' },
        { label: 'Каталог', slug: 'catalog' },
        { label: 'Хиты продаж' }
      ]);
      return;
    }

    // 1. Открыт корень каталога (site.com/catalog)
    if (!slug) {
      this.category.set({
        id: 0,
        name: 'Каталог товаров',
        slug: '',
        subcategories: tree.map(c => ({ name: c.name, slug: c.slug, icon: 'folder' }))
      });
      this.breadcrumbs.set([{ label: 'Каталог' }]);
      return;
    }

    // 2. Ищем выбранную категорию рекурсивно
    const result = this.findCategoryInTree(tree, slug);

    if (result) {
      this.category.set({
        id: result.category.id,
        name: result.category.name,
        slug: result.category.slug,
        subcategories: result.category.subCategories?.map((c: any) => ({
          name: c.name,
          slug: c.slug,
          icon: 'folder'
        })) || []
      });

      const crumbs: { label: string; slug?: string }[] = [
        { label: 'Главная', slug: '' },
        { label: 'Каталог', slug: 'catalog' }
      ];
      result.path.forEach(p => crumbs.push({ label: p.name, slug: `catalog/${p.slug}` }));
      crumbs.push({ label: result.category.name });

      this.breadcrumbs.set(crumbs);
    } else {
      // 3. Если ввели несуществующий slug
      this.category.set({
        id: -1,
        name: 'Категория не найдена',
        slug: slug,
        subcategories: []
      });
      this.breadcrumbs.set([{ label: 'Каталог', slug: 'catalog' }, { label: 'Ошибка' }]);
    }
  }

  // Умный поиск: возвращает саму категорию и список её родителей (для хлебных крошек)
  private findCategoryInTree(categories: any[], slug: string, path: any[] = []): { category: any, path: any[] } | null {
    for (const cat of categories) {
      if (cat.slug === slug) {
        return { category: cat, path };
      }
      if (cat.subCategories && cat.subCategories.length > 0) {
        const found = this.findCategoryInTree(cat.subCategories, slug, [...path, cat]);
        if (found) return found;
      }
    }
    return null;
  }
}
