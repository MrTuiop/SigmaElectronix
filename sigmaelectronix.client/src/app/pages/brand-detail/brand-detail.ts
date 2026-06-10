import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  LucideArrowLeft,
  LucidePackage,
  LucideShoppingCart,
  LucideFolder,
  LucideChevronRight,
  LucideHeart,
  LucideStar
} from '@lucide/angular';
import { BrandService } from '../../services/brand-service';
import { BrandShowcaseDto } from '../../models/brand-models';
import { WishlistService } from '../../services/wishlist-service';

// 🎯 Делаем гибкий интерфейс, чтобы он не конфликтовал с другими файлами
export interface UiProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  mainImageUrl?: string;
  averageRating?: number;
  reviewsCount?: number;
  inWishlist: boolean;
  isNew: boolean;
  discount?: number;
  gradient?: string;
  [key: string]: any; // <-- Эта магия позволяет принимать любые другие поля без ошибок
}

@Component({
  selector: 'app-brand-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CurrencyPipe, // <-- Обязательно добавляем для символа ₽
    LucideArrowLeft,
    LucidePackage,
    LucideShoppingCart,
    LucideFolder,
    LucideChevronRight,
    LucideHeart,
    LucideStar
  ],
  templateUrl: './brand-detail.html',
  styleUrl: './brand-detail.css'
})
export class BrandDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private brandService = inject(BrandService);
  private wishlistService = inject(WishlistService); // <-- Инжектим сервис
  private cdr = inject(ChangeDetectorRef);

  brand: BrandShowcaseDto | null = null;
  uiProducts: UiProduct[] = []; // <-- Массив обработанных товаров

  loading = true;
  error: string | null = null;

  private gradientCache = new Map<number, string>();

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadBrand(slug);
      }
    });
  }

  loadBrand(slug: string): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges(); // <-- Говорим Angular обновить экран (показать спиннер)

    this.brandService.getBrandBySlug(slug).subscribe({
      next: (data) => {
        this.brand = data;

        // Маппим товары
        this.uiProducts = (data.featuredProducts || []).map((p: any) => ({
          ...p,
          inWishlist: this.wishlistService.isInWishlist(p.id),
          isNew: p.isNew || false,
          discount: this.calcDiscount(p),
          gradient: this.getGradient(p.id)
        } as UiProduct));

        this.loading = false;
        this.cdr.detectChanges(); // <-- Говорим Angular, что данные пришли, можно рисовать витрину
      },
      error: (err) => {
        console.error('Ошибка загрузки страницы бренда', err);
        this.error = 'Не удалось загрузить информацию о бренде.';
        this.loading = false;
        this.cdr.detectChanges(); // <-- Говорим Angular нарисовать ошибку
      }
    });
  }

  // ===== МЕТОДЫ ДЛЯ КАРТОЧЕК ТОВАРОВ =====

  toggleWishlist(product: UiProduct): void {
    this.wishlistService.toggleItem(product.id).subscribe();
    product.inWishlist = !product.inWishlist; // локальное обновление для UI
  }

  addToCart(product: UiProduct): void {
    // Вызов сервиса корзины
    console.log('Добавлено в корзину:', product.name);
  }

  private calcDiscount(p: any): number | undefined {
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
