import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { LucideArrowRight, LucideHeart, LucideShoppingCart, LucideStar, LucidePackage } from '@lucide/angular';

import { ProductListDto } from '../../../models/product-models';
import { ProductService } from '../../../services/product-service';

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

  loading = signal(true);
  error = signal<string | null>(null);
  skeletonArray = Array(4).fill(0);

  // Читаем из сигнала сервиса и маппим в UI-модель на лету
  products = computed<UiProduct[]>(() =>
    this.productService.newArrivals().slice(0, 4).map(p => this.toUiProduct(p))
  );

  ngOnInit(): void {
    // Если данные уже есть в кэше сервиса — сразу их используем
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
    // Поскольку products — computed от неизменяемого источника,
    // для wishlist нужен отдельный локальный сигнал (или WishlistService)
    console.log(`Переключено избранное: ${product.name}`);
  }

  addToCart(product: UiProduct): void {
    console.log(`Товар добавлен в корзину: ${product.name}`);
  }

  private toUiProduct(p: ProductListDto): UiProduct {
    let discount: number | undefined;
    if (p.discountPrice && p.discountPrice < p.price) {
      discount = Math.round(((p.price - p.discountPrice) / p.price) * 100);
    }

    return {
      ...p,
      inWishlist: false, // Позже подключим WishlistService
      discount,
      gradient: this.getRandomGradient()
    };
  }

  private getRandomGradient(): string {
    const gradients = [
      'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
      'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
      'linear-gradient(135deg, #3b0764 0%, #8b5cf6 100%)',
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  }
}
