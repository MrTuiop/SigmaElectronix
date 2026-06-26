import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router'; // 👈 ДОБАВИЛИ Router
import { CommonModule, Location } from '@angular/common'; // 👈 ДОБАВИЛИ Location
import { LucideChevronRight } from '@lucide/angular';
import { CategoryGridComponent } from '../../components/category-components/category-grid/category-grid';
import { ProductListComponent } from '../../components/category-components/product-list/product-list';
import { CategoryService } from '../../services/category-service';
import { LanguageService } from '../../services/language-service'; // 👈 ДОБАВИЛИ
import { TranslateService, TranslateDirective, TranslatePipe } from '@ngx-translate/core';

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  subcategories?: { name: string; slug: string; icon: string; imageUrl?: string }[];
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CategoryGridComponent,
    ProductListComponent,
    LucideChevronRight,
    TranslateDirective,
    TranslatePipe
  ],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class CatalogPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router); // 👈 ДОБАВИЛИ
  private location = inject(Location); // 👈 ДОБАВИЛИ
  private categoryService = inject(CategoryService);
  private languageService = inject(LanguageService); // 👈 ДОБАВИЛИ
  private translate = inject(TranslateService);

  category = signal<CategoryData | null>(null);
  isLoading = signal(true);
  currentSlug = signal<string | null>(null);
  categoryId = signal<number>(0); // 👈 ДОБАВИЛИ: Храним ID, чтобы найти категорию после смены языка
  breadcrumbs = signal<{ label: string; slug?: string }[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('categorySlug');
      this.currentSlug.set(slug);

      const tree = this.categoryService.categoryTree();

      if (tree.length === 0) {
        this.isLoading.set(true);
        this.categoryService.loadTree().subscribe(() => {
          this.loadCategoryFromTree(slug);
        });
      } else {
        this.loadCategoryFromTree(slug);
      }
    });

    // 👇 РЕАКТИВНАЯ СМЕНА ЯЗЫКА (Аналогично ProductDetailPage)
    this.languageService.languageChanged$.subscribe(() => {
      const currentCat = this.category();
      if (!currentCat) return;

      // Перезагружаем дерево, чтобы получить свежие переводы и новые slug'и с бэкенда
      this.categoryService.loadTree().subscribe(() => {
        const tree = this.categoryService.categoryTree();

        // Если это виртуальная категория (Новинки, Хиты, Все товары, Ошибка), просто пересчитываем
        if (currentCat.id <= 0) {
          this.loadCategoryFromTree(this.currentSlug());
          return;
        }

        // Ищем реальную категорию по её ID в новом дереве
        const result = this.findCategoryInTreeById(tree, currentCat.id);

        if (result) {
          this.category.set({
            id: result.category.id,
            name: result.category.name,
            slug: result.category.slug,
            subcategories: result.category.subCategories?.map((c: any) => ({
              name: c.name,
              slug: c.slug,
              icon: 'folder',
              imageUrl: c.imageUrl
            })) || []
          });

          // Перестраиваем хлебные крошки
          const crumbs: { label: string; slug?: string }[] = [
            { label: this.translate.instant('CATALOG.BREADCRUMBS.HOME'), slug: '' },
            { label: this.translate.instant('CATALOG.BREADCRUMBS.CATALOG'), slug: 'catalog' }
          ];
          result.path.forEach(p => crumbs.push({ label: p.name, slug: `catalog/${p.slug}` }));
          crumbs.push({ label: result.category.name });
          this.breadcrumbs.set(crumbs);

          // 🚀 МЕНЯЕМ URL БЕЗ ПЕРЕЗАГРУЗКИ СТРАНИЦЫ, если slug изменился
          if (result.category.slug !== currentCat.slug) {
            this.currentSlug.set(result.category.slug);
            const newUrl = this.router.createUrlTree(['/catalog', result.category.slug]).toString();
            this.location.replaceState(newUrl);
          }
        } else {
          // Если вдруг не нашли (например, категорию удалили), fallback
          this.loadCategoryFromTree(this.currentSlug());
        }
      });
    });
  }

  private loadCategoryFromTree(slug: string | null): void {
    const tree = this.categoryService.categoryTree();
    this.isLoading.set(false);

    // 🌟 ВИРТУАЛЬНАЯ КАТЕГОРИЯ: НОВИНКИ
    if (slug === 'new-arrivals') {
      this.categoryId.set(-2); // 👈 Сохраняем ID
      this.category.set({
        id: -2,
        name: this.translate.instant('CATALOG.VIRTUAL.NEW_ARRIVALS'),
        slug: 'new-arrivals',
        subcategories: []
      });

      this.breadcrumbs.set([
        { label: this.translate.instant('CATALOG.BREADCRUMBS.HOME'), slug: '' },
        { label: this.translate.instant('CATALOG.BREADCRUMBS.CATALOG'), slug: 'catalog' },
        { label: this.translate.instant('CATALOG.VIRTUAL.NEW_ARRIVALS') }
      ]);
      return;
    }

    // 🔥 ВИРТУАЛЬНАЯ КАТЕГОРИЯ 2: ХИТЫ ПРОДАЖ
    if (slug === 'best-sellers') {
      this.categoryId.set(-3); // 👈 Сохраняем ID
      this.category.set({
        id: -3,
        name: this.translate.instant('CATALOG.VIRTUAL.BEST_SELLERS'),
        slug: 'best-sellers',
        subcategories: []
      });
      this.breadcrumbs.set([
        { label: this.translate.instant('CATALOG.BREADCRUMBS.HOME'), slug: '' },
        { label: this.translate.instant('CATALOG.BREADCRUMBS.CATALOG'), slug: 'catalog' },
        { label: this.translate.instant('CATALOG.VIRTUAL.BEST_SELLERS') }
      ]);
      return;
    }

    // 1. Открыт корень каталога (site.com/catalog)
    if (!slug) {
      this.categoryId.set(0); // 👈 Сохраняем ID
      this.category.set({
        id: 0,
        name: this.translate.instant('CATALOG.VIRTUAL.ALL_PRODUCTS'),
        slug: '',
        subcategories: tree.map(c => ({
          name: c.name,
          slug: c.slug,
          icon: 'folder',
          imageUrl: c.imageUrl
        }))
      });
      this.breadcrumbs.set([{ label: this.translate.instant('CATALOG.BREADCRUMBS.CATALOG') }]);
      return;
    }

    // 2. Ищем выбранную категорию рекурсивно
    const result = this.findCategoryInTree(tree, slug);

    if (result) {
      this.categoryId.set(result.category.id); // 👈 Сохраняем ID
      this.category.set({
        id: result.category.id,
        name: result.category.name,
        slug: result.category.slug,
        subcategories: result.category.subCategories?.map((c: any) => ({
          name: c.name,
          slug: c.slug,
          icon: 'folder',
          imageUrl: c.imageUrl
        })) || []
      });

      const crumbs: { label: string; slug?: string }[] = [
        { label: this.translate.instant('CATALOG.BREADCRUMBS.HOME'), slug: '' },
        { label: this.translate.instant('CATALOG.BREADCRUMBS.CATALOG'), slug: 'catalog' }
      ];
      result.path.forEach(p => crumbs.push({ label: p.name, slug: `catalog/${p.slug}` }));
      crumbs.push({ label: result.category.name });

      this.breadcrumbs.set(crumbs);
    } else {
      // 3. Если ввели несуществующий slug
      this.categoryId.set(-1); // 👈 Сохраняем ID
      this.category.set({
        id: -1,
        name: this.translate.instant('CATALOG.VIRTUAL.NOT_FOUND'),
        slug: slug || '',
        subcategories: []
      });
      this.breadcrumbs.set([
        { label: this.translate.instant('CATALOG.BREADCRUMBS.CATALOG'), slug: 'catalog' },
        { label: this.translate.instant('CATALOG.BREADCRUMBS.ERROR') }
      ]);
    }
  }

  // 👇 НОВЫЙ МЕТОД: Поиск категории по ID (необходим при смене языка, когда slug уже другой)
  private findCategoryInTreeById(categories: any[], id: number, path: any[] = []): { category: any, path: any[] } | null {
    for (const cat of categories) {
      if (cat.id === id) {
        return { category: cat, path };
      }
      if (cat.subCategories && cat.subCategories.length > 0) {
        const found = this.findCategoryInTreeById(cat.subCategories, id, [...path, cat]);
        if (found) return found;
      }
    }
    return null;
  }

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
