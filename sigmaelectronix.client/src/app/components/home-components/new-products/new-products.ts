import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideArrowRight, LucideHeart, LucideShoppingCart, LucideStar, LucidePackage } from '@lucide/angular';
import { ProductListDto } from '../../../models/product-models';
import { ProductService } from '../../../services/product-service';
import { WishlistService } from '../../../services/wishlist-service';

interface UiProduct extends ProductListDto {
  inWishlist: boolean;
  discount?: number;
  gradient?: string;
}

@Component({
  selector: 'app-new-products',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterModule,
    LucideArrowRight, LucideHeart, LucideShoppingCart, LucideStar, LucidePackage
  ],
  templateUrl: './new-products.html',
  styleUrl: './new-products.css',
})
export class NewProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);
  private wishlistService = inject(WishlistService);

  loading = signal(true);
  error = signal<string | null>(null);
  skeletonArray = Array(4).fill(0);

  // Кеш градиентов, чтобы цвета не моргали при клике на лайк
  private gradientCache = new Map<number, string>();

  // Сигнал автоматически пересчитается, если изменится список товаров ИЛИ список избранного
  products = computed<UiProduct[]>(() =>
    this.productService.newArrivals().slice(0, 4).map(p => ({
      ...p,
      inWishlist: this.wishlistService.isInWishlist(p.id),
      discount: this.calcDiscount(p),
      gradient: this.getGradient(p.id)
    }))
  );

  ngOnInit(): void {
    // 🎯 ВОТ ЭТОТ КОД БЫЛ ПОТЕРЯН! Возвращаем его на место:
    if (this.productService.newArrivals().length > 0) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.productService.loadNewArrivals(4).subscribe({
      next: () => {
        this.loading.set(false);
        this.cdr.detectChanges(); // обязательно для zoneless
      },
      error: (err) => {
        console.error('Ошибка загрузки новинок', err);
        this.error.set('Не удалось загрузить новинки');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  toggleWishlist(product: UiProduct): void {
    this.wishlistService.toggleItem(product.id).subscribe();
  }

  addToCart(product: UiProduct): void {
    console.log(`Товар добавлен в корзину: ${product.name}`);
  }

  // Вспомогательный метод для скидки
  private calcDiscount(p: ProductListDto): number | undefined {
    if (p.discountPrice && p.discountPrice < p.price) {
      return Math.round(((p.price - p.discountPrice) / p.price) * 100);
    }
    return undefined;
  }

  // Вспомогательный метод для градиентов (с кешированием)
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
