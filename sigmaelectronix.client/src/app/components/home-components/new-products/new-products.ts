import { Component, inject, signal, computed, OnInit, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideArrowRight } from '@lucide/angular';
import { ProductListDto } from '../../../models/product-models';
import { ProductService } from '../../../services/product-service';
import { WishlistService } from '../../../services/wishlist-service';
import { ProductCardComponent, UiProduct } from '../../product-components/product-card/product-card';
import { LanguageService } from '../../../services/language-service'; // 👈 Импортируем LanguageService

@Component({
  selector: 'app-new-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideArrowRight,
    ProductCardComponent
  ],
  templateUrl: './new-products.html',
  styleUrl: './new-products.css',
})
export class NewProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);
  private wishlistService = inject(WishlistService);
  private languageService = inject(LanguageService); // 👈 Инжектим сервис

  private previousLanguage = signal<string>(this.languageService.currentLanguage()); // 👈 Сигнал для отслеживания прошлого языка

  loading = signal(true);
  error = signal<string | null>(null);
  skeletonArray = Array(4).fill(0);

  private gradientCache = new Map<number, string>();

  products = computed<UiProduct[]>(() =>
    this.productService.newArrivals().slice(0, 4).map(p => ({
      ...p,
      inWishlist: this.wishlistService.isInWishlist(p.id),
      isNew: true,
      discount: this.calcDiscount(p),
      gradient: this.getGradient(p.id)
    }))
  );

  // 👇 Магия effect: срабатывает только когда меняется currentLanguage
  private readonly languageEffect = effect(() => {
    const currentLang = this.languageService.currentLanguage();
    if (this.previousLanguage() !== currentLang) {
      this.previousLanguage.set(currentLang);
      this.productService.loadNewArrivals(4).subscribe({
        error: () => console.error('Ошибка перезагрузки новинок при смене языка')
      });
    }
  });

  ngOnInit(): void {
    if (this.productService.newArrivals().length > 0) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.productService.loadNewArrivals(4).subscribe({
      next: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка загрузки новинок', err);
        this.error.set('Не удалось загрузить новинки');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
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
