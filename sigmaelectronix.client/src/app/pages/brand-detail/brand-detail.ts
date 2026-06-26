import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import {
  LucideArrowLeft, LucidePackage, LucideFolder, LucideChevronRight,
  LucideLaptop, LucideSmartphone, LucideHeadphones, LucideWatch,
  LucideTv, LucideGamepad2, LucideMonitor, LucideCamera
} from '@lucide/angular';
import { BrandService } from '../../services/brand-service';
import { BrandShowcaseDto } from '../../models/brand-models';
import { WishlistService } from '../../services/wishlist-service';
import { ProductCardComponent, UiProduct } from '../../components/product-components/product-card/product-card';
import { TranslateDirective, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language-service';

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
    ProductCardComponent,
    TranslateDirective,
    TranslatePipe
  ],
  templateUrl: './brand-detail.html',
  styleUrl: './brand-detail.css'
})
export class BrandDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private brandService = inject(BrandService);
  private wishlistService = inject(WishlistService);
  private translate = inject(TranslateService);
  private languageService = inject(LanguageService);

  private currentSlug = signal<string>('');

  brand = signal<BrandShowcaseDto | null>(null);
  uiProducts = signal<UiProduct[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  private gradientCache = new Map<number, string>();

  ngOnInit(): void {
    // 1. Реагируем на изменение URL (если пользователь перейдет по другому бренду)
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.currentSlug.set(slug);
        this.loadBrand(slug);
      }
    });

    // 👇 2. Реагируем на смену языка (Аналогично ProductDetailPage и CatalogPage)
    this.languageService.languageChanged$.subscribe(() => {
      const slug = this.currentSlug();
      if (slug) {
        this.loadBrand(slug); // Перезагружаем бренд на новом языке
      }
    });
  }

  loadBrand(slug: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.brandService.getBrandBySlug(slug).subscribe({
      next: (data) => {
        this.brand.set(data);

        // 🚀 Если slug изменился при смене языка — бесшовно обновляем URL
        if (data.slug && data.slug !== slug) {
          this.currentSlug.set(data.slug);
          const newUrl = this.router.createUrlTree(['/brands', data.slug]).toString();
          this.location.replaceState(newUrl);
        }

        const products: UiProduct[] = (data.featuredProducts || []).slice(0, 8).map((p: any) => ({
          ...p,
          inWishlist: this.wishlistService.isInWishlist(p.id),
          isNew: p.isNew || false,
          discount: this.calcDiscount(p),
          gradient: this.getGradient(p.id)
        }));

        this.uiProducts.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Ошибка загрузки страницы бренда', err);
        this.error.set(this.translate.instant('BRAND_DETAIL.ERROR'));
        this.loading.set(false);
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
    if (!iconId) return LucideFolder;
    return this.iconMap[iconId] || LucideFolder;
  }
}
