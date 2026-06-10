import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { LucideArrowRight, LucideHeart, LucideShoppingCart, LucideStar, LucidePackage } from '@lucide/angular';

import { ProductListDto } from '../../../models/product-models';
import { ProductService } from '../../../services/product-service';
import { WishlistService } from '../../../services/wishlist-service';

interface UiProduct extends ProductListDto {
  inWishlist: boolean;
  isNew: boolean; // 🆕 Добавляем флаг новинки в UI-модель
  discount?: number;
  gradient?: string;
}

@Component({
  selector: 'app-best-sellers',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterModule,
    LucideArrowRight, LucideHeart, LucideShoppingCart, LucideStar, LucidePackage
  ],
  templateUrl: './best-sellers.html',
  styleUrl: './best-sellers.css',
})
export class BestSellersComponent implements OnInit {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  // 🎯 2. Инжектим сервис избранного
  private wishlistService = inject(WishlistService);

  loading = signal(true);
  error = signal<string | null>(null);
  skeletonArray = Array(4).fill(0);

  // 🎯 УДАЛЯЕМ локальный wishlistState = signal<Set<number>>(new Set());

  private gradientCache = new Map<number, string>();

  // 🎯 3. Обновляем вычисляемый сигнал
  products = computed<UiProduct[]>(() => {
    // Получаем ID всех товаров, которые сейчас загружены как новинки
    const newArrivalsIds = new Set(this.productService.newArrivals().map(p => p.id));

    return this.productService.featuredProducts()
      .slice(0, 4)
      .map(p => ({
        ...p,
        // Проверяем статус напрямую через глобальный сервис!
        inWishlist: this.wishlistService.isInWishlist(p.id),
        isNew: (p as any).isNew || newArrivalsIds.has(p.id),
        discount: this.calcDiscount(p),
        gradient: this.getGradient(p.id)
      }));
  });

  ngOnInit(): void {
    // Если кэш уже заполнен (например, другим компонентом или при возврате на страницу) —
    // сразу показываем данные без запроса
    if (this.productService.featuredProducts().length > 0) {
      this.loading.set(false);
      return;
    }

    this.productService.loadFeatured(4).subscribe({
      next: () => {
        this.loading.set(false);
        this.cdr.detectChanges(); // обязательно в zoneless
      },
      error: (err) => {
        console.error('Ошибка загрузки хитов продаж', err);
        this.error.set('Не удалось загрузить товары');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  toggleWishlist(product: UiProduct): void {
    // Больше никаких локальных Set. Просто отправляем запрос, 
    // сервис обновит свой сигнал, и карточки перерисуются сами!
    this.wishlistService.toggleItem(product.id).subscribe();
  }

  addToCart(product: UiProduct): void {
    console.log(`Товар добавлен в корзину: ${product.name}`);
  }

  private calcDiscount(p: ProductListDto): number | undefined {
    if (p.discountPrice && p.discountPrice < p.price) {
      return Math.round(((p.price - p.discountPrice) / p.price) * 100);
    }
    return undefined;
  }

  private getGradient(productId: number): string {
    if (!this.gradientCache.has(productId)) {
      const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)',
        'linear-gradient(135deg, #1e293b 0%, #64748b 100%)',
        'linear-gradient(135deg, #0f172a 0%, #334155 100%)'
      ];
      this.gradientCache.set(productId, gradients[Math.floor(Math.random() * gradients.length)]);
    }
    return this.gradientCache.get(productId)!;
  }
}
