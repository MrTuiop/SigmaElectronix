import { Component, Input, signal, computed, OnInit, inject, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideSlidersHorizontal, LucideStar, LucideHeart, LucideShoppingCart, LucideCheck
} from '@lucide/angular';
import { CartService } from '../../../services/cart-service';
import { WishlistService } from '../../../services/wishlist-service';
import { ToastService } from '../../../services/toast';
import { ProductService } from '../../../services/product-service';
import { ProductListDto, ProductFilterDto } from '../../../models/product-models';

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
    LucideStar, LucideHeart, LucideShoppingCart, LucideCheck
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
  sortBy = signal<'popular' | 'price_asc' | 'price_desc' | 'new'>('popular'); // <-- Теперь это СИГНАЛ!

  // Доступные фильтры с бэкенда
  availableBrands = signal<{ id: number, name: string }[]>([]);
  availableSpecs = signal<{ key: string, values: string[] }[]>([]);
  selectedSpecs = signal<Record<string, string[]>>({});

  private gradientCache = new Map<number, string>();

  ngOnInit(): void {
    this.resetAndLoad();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryId']) {
      this.loadFiltersAndProducts();
    }
  }

  // 1. Загружаем доступные фильтры для этой категории
  loadFiltersAndProducts(): void {
    this.productService.getFilters(this.categoryId).subscribe({
      next: (filters) => {
        // Устанавливаем доступные бренды и цены из БД
        this.availableBrands.set(filters.brands);
        this.priceRange.set({ min: filters.minPrice, max: filters.maxPrice });

        // Превращаем словарь в массив для удобного вывода в HTML
        const specsArray = Object.entries(filters.specifications).map(([key, values]) => ({ key, values }));
        this.availableSpecs.set(specsArray);

        // Очищаем старый выбор и грузим товары
        this.selectedBrandIds.set([]);
        this.selectedSpecs.set({});
        this.resetAndLoad();
      }
    });
  }

  // 2. Добавляем метод клика по характеристике
  toggleSpec(key: string, value: string): void {
    const current = this.selectedSpecs();
    const currentValuesForKey = current[key] || []; // Текущие выбранные значения для этой харакеристики

    let newValuesForKey: string[];

    if (currentValuesForKey.includes(value)) {
      // Если значение уже было выбрано — удаляем его из массива
      newValuesForKey = currentValuesForKey.filter(v => v !== value);
    } else {
      // Иначе — добавляем в массив
      newValuesForKey = [...currentValuesForKey, value];
    }

    const newSpecs = { ...current };

    if (newValuesForKey.length === 0) {
      // Если массив опустел, вообще удаляем этот ключ, чтобы не слать пустые запросы
      delete newSpecs[key];
    } else {
      newSpecs[key] = newValuesForKey;
    }

    this.selectedSpecs.set(newSpecs);
    this.resetAndLoad();
  }

  toggleWishlist(product: UiProduct): void {
    // 1. Мгновенно меняем визуальное состояние в интерфейсе (Оптимистичный UI)
    product.inWishlist = !product.inWishlist;

    // 2. Сразу показываем уведомление пользователю
    if (product.inWishlist) {
      this.toastService.success('Добавлено в избранное');
    } else {
      this.toastService.info('Удалено из избранного');
    }

    // 3. Отправляем запрос на сервер в фоновом режиме
    this.wishlistService.toggleItem(product.id).subscribe({
      error: () => {
        // Если сервер вернул ошибку (например, пропал интернет), откатываем визуал назад
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

  // === ЛОГИКА ФИЛЬТРАЦИИ И ЗАГРУЗКИ С СЕРВЕРА ===

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
      categoryId: this.categoryId && this.categoryId > 0 ? this.categoryId : undefined,
      sortBy: this.sortBy(),
      brandIds: this.selectedBrandIds().length > 0 ? this.selectedBrandIds() : undefined,
      specifications: Object.keys(this.selectedSpecs()).length > 0 ? this.selectedSpecs() : undefined // ПЕРЕДАЕМ ХАРАКТЕРИСТИКИ
    };

    // Отправляем запрос
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
    this.selectedSpecs.set({}); // <-- Добавили очистку характеристик!
    this.priceRange.set({ min: 0, max: 200000 });
    this.sortBy.set('popular');
    this.resetAndLoad();
  }

  // Теперь переключаем ID бренда, а не строку
  toggleBrand(brandId: number): void {
    this.selectedBrandIds.update(v =>
      v.includes(brandId) ? v.filter(id => id !== brandId) : [...v, brandId]
    );
    this.resetAndLoad();
  }

  // Если юзер меняет сортировку в селекте
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
