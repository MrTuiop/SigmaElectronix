import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideArrowRight, LucideHeart, LucideShoppingCart, LucideStar, LucidePackage, LucideCheck } from '@lucide/angular';
import { ProductListDto } from '../../../models/product-models';
import { ProductService } from '../../../services/product-service';
import { WishlistService } from '../../../services/wishlist-service';
import { CartService } from '../../../services/cart-service';
import { ToastService } from '../../../services/toast';

interface UiProduct extends ProductListDto {
  inWishlist: boolean;
  isNew: boolean;
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
    LucideArrowRight, LucideHeart, LucideShoppingCart, LucideStar, LucidePackage, LucideCheck
  ],
  templateUrl: './best-sellers.html',
  styleUrl: './best-sellers.css',
})
export class BestSellersComponent implements OnInit {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);
  private wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService); // <-- сервис уведомлений
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  skeletonArray = Array(4).fill(0);

  private gradientCache = new Map<number, string>();

  products = computed<UiProduct[]>(() => {
    const newArrivalsIds = new Set(this.productService.newArrivals().map(p => p.id));

    return this.productService.featuredProducts()
      .slice(0, 4)
      .map(p => ({
        ...p,
        inWishlist: this.wishlistService.isInWishlist(p.id),
        isNew: (p as any).isNew || newArrivalsIds.has(p.id),
        discount: this.calcDiscount(p),
        gradient: this.getGradient(p.id)
      }));
  });

  ngOnInit(): void {
    if (this.productService.featuredProducts().length > 0) {
      this.loading.set(false);
      return;
    }

    this.productService.loadFeatured(4).subscribe({
      next: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
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
    this.wishlistService.toggleItem(product.id).subscribe({
      next: () => {
        const nowInWishlist = this.wishlistService.isInWishlist(product.id);
        if (nowInWishlist) {
          this.toastService.success('Добавлено в избранное');
        } else {
          this.toastService.info('Удалено из избранного');
        }
      },
      error: () => this.toastService.error('Не удалось обновить избранное')
    });
  }

  addToCart(product: any): void {
    if (this.isInCart(product.id)) {
      this.router.navigate(['/cart']);
      return;
    }

    const price = product.discountPrice || product.price;
    this.cartService.addItem({
      productId: product.id,
      quantity: 1,
      price: price
    }).subscribe({
      next: () => this.toastService.success('Товар добавлен в корзину'),
      error: () => this.toastService.error('Ошибка при добавлении в корзину')
    });
  }

  isInCart(productId: number): boolean {
    return this.cartService.isInCart(productId);
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
