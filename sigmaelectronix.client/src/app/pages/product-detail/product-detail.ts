import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2,
  LucideStar, LucideShoppingCart, LucideHeart, LucideShieldCheck, LucideTruck, LucideRefreshCw,
  LucideBell, LucideCheck, LucidePackage,
  LucideChevronLeft, LucideChevronRight
} from '@lucide/angular';
import { ProductService } from '../../services/product-service';
import { CartService } from '../../services/cart-service';
import { WishlistService } from '../../services/wishlist-service';
import { ProductDetailDto } from '../../models/product-models';
import { ProductListDto } from '../../models/brand-models';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    KeyValuePipe,
    LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2,
    LucideStar, LucideShoppingCart, LucideHeart, LucideShieldCheck, LucideTruck, LucideRefreshCw,
    LucideBell, LucideCheck, LucidePackage,
    LucideChevronLeft, LucideChevronRight
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailPage implements OnInit {
  protected readonly Math = Math;

  // 🔹 1. Инжектим сервисы
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  public cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private toastService = inject(ToastService);

  // 🔹 2. Сигналы с реальными DTO
  product = signal<ProductDetailDto | null>(null);
  relatedProducts = signal<ProductListDto[]>([]);

  isLoading = signal(true);
  error = signal<string | null>(null);

  activeImageIndex = signal(0);
  quantity = signal(1);
  priceAlertRequested = signal(false);

  // 🔹 3. Вычисляем статус избранного через сервис
  inWishlist = computed(() => {
    const p = this.product();
    return p ? this.wishlistService.isInWishlist(p.id) : false;
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadProduct(slug);
      }
    });
  }

  private loadProduct(slug: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.productService.getProductBySlug(slug).subscribe({
      next: (data) => {
        this.product.set(data);
        this.isLoading.set(false);
        this.activeImageIndex.set(0);
        this.quantity.set(1);

        this.productService.getRelatedProducts(data.id, 4).subscribe({
          next: (related) => this.relatedProducts.set(related)
        });
      },
      error: (err) => {
        console.error('Ошибка загрузки товара:', err);
        this.error.set('Товар не найден или удален');
        this.isLoading.set(false);
      }
    });
  }

  // 🔹 4. Реальное добавление в корзину (с тостом)
  addToCart(): void {
    const p = this.product();
    if (!p) return;

    const price = p.discountPrice || p.price;
    this.cartService.addItem({
      productId: p.id,
      quantity: this.quantity(),
      price: price
    }).subscribe({
      next: () => this.toastService.success('Товар добавлен в корзину'),
      error: () => this.toastService.error('Ошибка при добавлении в корзину')
    });
  }

  // 🔹 5. Реальное добавление в избранное с уведомлением
  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;

    this.wishlistService.toggleItem(p.id).subscribe({
      next: () => {
        const isNowInWishlist = this.wishlistService.isInWishlist(p.id);
        if (isNowInWishlist) {
          this.toastService.success('Добавлено в избранное');
        } else {
          this.toastService.info('Удалено из избранного');
        }
      },
      error: () => this.toastService.error('Не удалось обновить избранное')
    });
  }

  // Навигация по картинкам
  nextImage(): void {
    const images = this.product()?.images;
    if (!images || images.length === 0) return;
    this.activeImageIndex.update(i => (i + 1) % images.length);
  }

  prevImage(): void {
    const images = this.product()?.images;
    if (!images || images.length === 0) return;
    this.activeImageIndex.update(i => (i - 1 + images.length) % images.length);
  }

  setImageIndex(index: number): void {
    this.activeImageIndex.set(index);
  }

  requestPriceAlert(): void {
    this.priceAlertRequested.set(true);
  }
}
