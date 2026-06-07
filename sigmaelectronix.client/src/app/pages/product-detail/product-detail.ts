import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2,
  LucideStar, LucideShoppingCart, LucideHeart, LucideShieldCheck, LucideTruck, LucideRefreshCw,
  LucideBell, LucideCheck, LucidePackage,
  LucideChevronLeft, LucideChevronRight
} from '@lucide/angular';

interface ProductDetail {
  id: number;
  name: string;
  brand: string;
  description: string;
  rating: number;
  reviewsCount: number;
  basePrice: number;
  baseOldPrice?: number;
  images: { gradient: string; icon: string }[];
  specifications: { name: string; value: string }[];
  variants?: { label: string; priceModifier: number; oldPriceModifier?: number }[]; // опционально
  categorySlug: string;
  icon: string;
}

interface Review {
  user: string;
  rating: number;
  date: string;
  text: string;
}

interface RelatedProduct {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  gradient: string;
  icon: string;
  slug: string;
}

@Component({
  selector: 'app-product-detail',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
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
  private route = inject(ActivatedRoute);
  product = signal<ProductDetail | null>(null);
  activeImageIndex = signal(0);
  selectedVariantIndex = signal(0); // если есть варианты
  quantity = signal(1);
  inWishlist = signal(false);
  priceAlertRequested = signal(false);

  // Отзывы (заглушка)
  reviews = signal<Review[]>([]);
  reviewFilterRating = signal<number | null>(null);
  filteredReviews = computed(() => {
    const filter = this.reviewFilterRating();
    return filter ? this.reviews().filter(r => r.rating === filter) : this.reviews();
  });

  // Похожие товары
  relatedProducts = signal<RelatedProduct[]>([]);

  // Текущая цена с учётом варианта
  currentPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    const variant = p.variants?.[this.selectedVariantIndex()];
    return p.basePrice + (variant?.priceModifier ?? 0);
  });

  currentOldPrice = computed(() => {
    const p = this.product();
    if (!p) return undefined;
    const variant = p.variants?.[this.selectedVariantIndex()];
    if (p.baseOldPrice != null) {
      return p.baseOldPrice + (variant?.oldPriceModifier ?? 0);
    }
    return undefined;
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      const slug = params['slug'];
      this.loadProduct(id, slug);
    });
  }

  private loadProduct(id: number, slug: string): void {
    // Заглушка данных
    this.product.set({
      id: 1,
      name: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      description: 'Флагманский смартфон с лучшей камерой, мощным процессором и стилусом S Pen. Наслаждайтесь невероятной производительностью и безграничными возможностями.',
      rating: 4.7,
      reviewsCount: 1240,
      basePrice: 129990,
      baseOldPrice: 139990,
      icon: 'smartphone',
      categorySlug: 'smartphones',
      images: [
        { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: 'smartphone' },
        { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: 'smartphone' },
        { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: 'smartphone' }
      ],
      specifications: [
        { name: 'Экран', value: '6.8" Dynamic AMOLED 2X, 120 Гц' },
        { name: 'Процессор', value: 'Snapdragon 8 Gen 3' },
        { name: 'Память', value: '12 ГБ ОЗУ / 512 ГБ ПЗУ' },
        { name: 'Камера', value: '200 Мп + 50 Мп + 12 Мп + 10 Мп' },
        { name: 'Аккумулятор', value: '5000 мАч, быстрая зарядка 45 Вт' },
        { name: 'ОС', value: 'Android 14, One UI 6.1' }
      ],
      variants: [
        { label: '256 ГБ', priceModifier: 0, oldPriceModifier: 0 },
        { label: '512 ГБ', priceModifier: 20000, oldPriceModifier: 20000 }
      ]
    });

    // Заглушка отзывов
    this.reviews.set([
      { user: 'Алексей', rating: 5, date: '15.05.2024', text: 'Отличный телефон! Камера просто бомба, очень доволен.' },
      { user: 'Марина', rating: 4, date: '10.05.2024', text: 'Хороший девайс, но дороговат. Стилус удобный.' },
      { user: 'Иван', rating: 5, date: '05.05.2024', text: 'Лучший смартфон на рынке, ничего лучше не видел.' },
      { user: 'Ольга', rating: 3, date: '01.05.2024', text: 'Неплохо, но аккумулятор мог бы держать дольше.' }
    ]);

    // Похожие товары
    this.relatedProducts.set([
      { id: 2, name: 'iPhone 15 Pro Max', price: 134990, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: 'smartphone', slug: 'iphone-15-pro-max' },
      { id: 3, name: 'Samsung Galaxy Z Fold 5', price: 179990, oldPrice: 199990, gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: 'smartphone', slug: 'galaxy-z-fold-5' },
      { id: 4, name: 'Google Pixel 8 Pro', price: 99990, gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', icon: 'smartphone', slug: 'pixel-8-pro' }
    ]);
  }

  nextImage(): void {
    const images = this.product()?.images;
    if (!images) return;
    this.activeImageIndex.update(i => (i + 1) % images.length);
  }

  prevImage(): void {
    const images = this.product()?.images;
    if (!images) return;
    this.activeImageIndex.update(i => (i - 1 + images.length) % images.length);
  }

  setImageIndex(index: number): void {
    this.activeImageIndex.set(index);
  }

  selectVariant(index: number): void {
    this.selectedVariantIndex.set(index);
  }

  addToCart(): void {
    alert(`Добавлено в корзину: ${this.product()?.name}, количество: ${this.quantity()}`);
    // здесь реальная логика
  }

  toggleWishlist(): void {
    this.inWishlist.update(v => !v);
  }

  requestPriceAlert(): void {
    this.priceAlertRequested.set(true);
    // запрос на бэкенд
  }
}
