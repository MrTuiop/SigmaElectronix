import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
// Удалили кучу иконок корзины и звездочек, оставили только нужные странице бренда
import { LucideArrowLeft, LucidePackage, LucideFolder, LucideChevronRight, LucideLaptop, LucideSmartphone, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2, LucideMonitor, LucideCamera } from '@lucide/angular';
import { BrandService } from '../../services/brand-service';
import { BrandShowcaseDto } from '../../models/brand-models';
import { WishlistService } from '../../services/wishlist-service';
import { ProductCardComponent, UiProduct } from '../../components/product-components/product-card/product-card';
// Подключаем карточку (проверь путь!)

@Component({
  selector: 'app-brand-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideArrowLeft,
    LucidePackage,
    LucideFolder,
    LucideChevronRight,
    ProductCardComponent // <-- Добавили карточку
  ],
  templateUrl: './brand-detail.html',
  styleUrl: './brand-detail.css'
})
export class BrandDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private brandService = inject(BrandService);
  private wishlistService = inject(WishlistService);
  private cdr = inject(ChangeDetectorRef);

  brand: BrandShowcaseDto | null = null;
  uiProducts: UiProduct[] = [];

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
    this.cdr.detectChanges();

    this.brandService.getBrandBySlug(slug).subscribe({
      next: (data) => {
        this.brand = data;

        // 🚀 Добавили .slice(0, 8), чтобы оставить максимум 8 товаров (2 строки)
        this.uiProducts = (data.featuredProducts || []).slice(0, 8).map((p: any) => ({
          ...p,
          inWishlist: this.wishlistService.isInWishlist(p.id),
          isNew: p.isNew || false,
          discount: this.calcDiscount(p),
          gradient: this.getGradient(p.id)
        } as UiProduct));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка загрузки страницы бренда', err);
        this.error = 'Не удалось загрузить информацию о бренде.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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
        'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
        'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
        'linear-gradient(135deg, #3b0764 0%, #8b5cf6 100%)',
      ];
      this.gradientCache.set(productId, gradients[Math.floor(Math.random() * gradients.length)]);
    }
    return this.gradientCache.get(productId)!;
  }

  private iconMap: Record<string, any> = {
    'smartphone': LucideSmartphone,
    'laptop': LucideLaptop,
    'headphones': LucideHeadphones,
    'watch': LucideWatch,
    'tv': LucideTv,
    'gamepad-2': LucideGamepad2,
    'monitor': LucideMonitor,
    'camera': LucideCamera,
    'folder': LucideFolder
  };

  getIconComponent(iconId: string | undefined): any {
    if (!iconId) return LucideFolder; // По умолчанию папка
    return this.iconMap[iconId] || LucideFolder;
  }
}
