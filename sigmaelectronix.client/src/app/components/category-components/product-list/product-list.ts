import { Component, Input, signal, computed, OnInit, inject, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideSlidersHorizontal, LucideStar, LucideHeart, LucideShoppingCart, LucideCheck,
  LucideChevronDown
} from '@lucide/angular';
import { CartService } from '../../../services/cart-service';
import { WishlistService } from '../../../services/wishlist-service';
import { ToastService } from '../../../services/toast';
import { ProductService } from '../../../services/product-service';
import { ProductListDto, ProductFilterDto, BrandSummaryDto } from '../../../models/product-models';

interface UiProduct extends ProductListDto {
  inWishlist: boolean;
  discountPercent?: number;
  gradient: string;
  inStock: boolean;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    LucideStar, LucideHeart, LucideShoppingCart, LucideCheck, LucideChevronDown
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListComponent implements OnInit, OnChanges {
  @Input() categoryId?: number;

  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // === СИГНАЛЫ СОСТОЯНИЯ ===
  displayedProducts = signal<UiProduct[]>([]);
  page = signal(1);
  readonly pageSize = 6;
  hasMore = signal(true);
  isLoading = signal(false);

  // === СИГНАЛЫ ФИЛЬТРОВ ===
  priceRange = signal({ min: 0, max: 200000 });
  selectedBrandIds = signal<number[]>([]);
  sortBy = signal<'popular' | 'price_asc' | 'price_desc' | 'newest'>('popular');

  // Доступные фильтры с бэкенда
  availableBrands = signal<readonly BrandSummaryDto[]>([]); // ✅ Добавлен readonly
  availableSpecs = signal<{ key: string, values: readonly string[] }[]>([]);
  selectedSpecs = signal<Record<string, readonly string[]>>({});

  private gradientCache = new Map<number, string>();

  // === СИГНАЛЫ ДЛЯ АККОРДЕОНА ФИЛЬТРОВ ===
  expandedFilters = signal<string[]>(['price', 'brands']);

  toggleFilter(key: string) {
    this.expandedFilters.update(filters => {
      if (filters.includes(key)) {
        return filters.filter(f => f !== key);
      } else {
        return [...filters, key];
      }
    });
  }

  isExpanded(key: string): boolean {
    return this.expandedFilters().includes(key);
  }

  ngOnInit(): void {
    this.resetAndLoad();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryId']) {
      if (this.categoryId === -2) {
        this.sortBy.set('newest');
      } else if (this.categoryId === -3) {
        this.sortBy.set('popular');
      } else {
        this.sortBy.set('popular');
      }
      this.loadFiltersAndProducts();
    }
  }

  loadFiltersAndProducts(): void {
    const dbCategoryId = (this.categoryId && this.categoryId > 0) ? this.categoryId : undefined;

    this.productService.getFilters(dbCategoryId).subscribe({
      next: (filters) => {
        this.availableBrands.set(filters.brands);
        this.priceRange.set({ min: filters.minPrice, max: filters.maxPrice });

        const specsArray = Object.entries(filters.specifications).map(([key, values]) => ({ key, values }));
        this.availableSpecs.set(specsArray);

        this.selectedBrandIds.set([]);
        this.selectedSpecs.set({});
        this.resetAndLoad();
      }
    });
  }

  toggleSpec(key: string, value: string): void {
    const current = this.selectedSpecs();
    const currentValuesForKey = current[key] || [];

    let newValuesForKey: readonly string[];

    if (currentValuesForKey.includes(value)) {
      newValuesForKey = currentValuesForKey.filter(v => v !== value);
    } else {
      newValuesForKey = [...currentValuesForKey, value];
    }

    const newSpecs = { ...current };

    if (newValuesForKey.length === 0) {
      delete newSpecs[key];
    } else {
      newSpecs[key] = newValuesForKey;
    }

    this.selectedSpecs.set(newSpecs);
    this.resetAndLoad();
  }

  toggleWishlist(product: UiProduct): void {
    product.inWishlist = !product.inWishlist;

    if (product.inWishlist) {
      this.toastService.success('Добавлено в избранное');
    } else {
      this.toastService.info('Удалено из избранного');
    }

    this.wishlistService.toggleItem(product.id).subscribe({
      error: () => {
        product.inWishlist = !product.inWishlist;
        this.toastService.error('Не удалось обновить избранное');
      }
    });
  }

  addToCart(product: UiProduct): void {
    if (this.isInCart(product.id)) {
      this.router.navigate(['/cart']);
      return;
    }

    this.cartService.addItem({
      productId: product.id,
      quantity: 1,
      price: product.finalPrice
    }).subscribe({
      next: () => this.toastService.success('Товар добавлен в корзину'),
      error: () => this.toastService.error('Ошибка при добавлении в корзину')
    });
  }

  isInCart(productId: number): boolean {
    return this.cartService.isInCart(productId);
  }

  resetAndLoad(): void {
    this.displayedProducts.set([]);
    this.page.set(1);
    this.hasMore.set(true);
    this.loadMore();
  }

  loadMore(): void {
    if (!this.hasMore() || this.isLoading()) return;
    this.isLoading.set(true);

    const filter: ProductFilterDto = {
      pageNumber: this.page(),
      pageSize: this.pageSize,
      minPrice: this.priceRange().min,
      maxPrice: this.priceRange().max,
      categoryId: (this.categoryId && this.categoryId > 0) ? this.categoryId : undefined,
      sortBy: this.sortBy(),
      brandIds: this.selectedBrandIds().length > 0 ? this.selectedBrandIds() : undefined,
      specifications: Object.keys(this.selectedSpecs()).length > 0 ? this.selectedSpecs() : undefined
    };

    this.productService.getProducts(filter).subscribe({
      next: (res) => {
        const mapped: UiProduct[] = res.items.map(p => ({
          ...p,
          inWishlist: this.wishlistService.isInWishlist(p.id),
          discountPercent: p.discountPrice && p.discountPrice < p.price
            ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
            : undefined,
          gradient: this.getGradient(p.id),
          inStock: true
        }));

        this.displayedProducts.update(prev => [...prev, ...mapped]);
        this.hasMore.set(res.items.length === this.pageSize);
        this.page.update(p => p + 1);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Ошибка загрузки товаров');
        this.isLoading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.selectedBrandIds.set([]);
    this.selectedSpecs.set({});
    this.priceRange.set({ min: 0, max: 200000 });

    if (this.categoryId === -2) {
      this.sortBy.set('newest');
    } else {
      this.sortBy.set('popular');
    }

    this.resetAndLoad();
  }

  toggleBrand(brandId: number): void {
    this.selectedBrandIds.update(v =>
      v.includes(brandId) ? v.filter(id => id !== brandId) : [...v, brandId]
    );
    this.resetAndLoad();
  }

  onSortChange(newSort: any): void {
    this.sortBy.set(newSort);
    this.resetAndLoad();
  }

  private getGradient(productId: number): string {
    if (!this.gradientCache.has(productId)) {
      const gradients = [
        'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
        'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
        'linear-gradient(135deg, #3b0764 0%, #8b5cf6 100%)',
      ];
      this.gradientCache.set(productId, gradients[Math.floor(Math.random() * gradients.length)]);
    }
    return this.gradientCache.get(productId)!;
  }
}
