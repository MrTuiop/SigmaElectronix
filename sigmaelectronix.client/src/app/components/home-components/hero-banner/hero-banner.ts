import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideZap, LucideSmartphone, LucideLaptop,
  LucideHeadphones, LucideChevronLeft, LucideChevronRight
} from '@lucide/angular';
import { ProductService } from '../../../services/product-service';
import { LanguageService } from '../../../services/language-service';
import { ProductListDto } from '../../../models/product-models';
import { HERO_I18N } from './hero-banner.i18n';

// Интерфейс без переводимых текстов (только статичные данные)
interface HeroSlideBase {
  btnPrimaryLink: string;
  btnSecondaryLink: string;
  iconName: 'smartphone' | 'laptop' | 'headphones';
  bgGradient: string;
}

// Полный интерфейс слайда
interface HeroSlide extends HeroSlideBase {
  badgeText: string;
  titlePart1: string;
  titleHighlight: string;
  subtitle: string;
  btnPrimaryText: string;
  btnSecondaryText: string;
  product?: ProductListDto;
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideZap, LucideSmartphone, LucideLaptop,
    LucideHeadphones, LucideChevronLeft, LucideChevronRight
  ],
  templateUrl: './hero-banner.html',
  styleUrls: ['./hero-banner.css']
})
export class HeroBannerComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private languageService = inject(LanguageService);

  currentSlide = signal(0);
  private autoSlideInterval: any;

  // 🛒 Отдельный сигнал для товаров из БД
  private loadedProducts = signal<(ProductListDto | undefined)[]>([]);

  // 📋 Статическая часть слайдов (без переводимых текстов)
  private readonly baseSlides: HeroSlideBase[] = [
    {
      btnPrimaryLink: '/catalog?sort=newest',
      btnSecondaryLink: '/catalog',
      iconName: 'smartphone',
      bgGradient: 'var(--purple-gradient)' // Оставляем ссылку на главную переменную
    },
    {
      btnPrimaryLink: '/catalog/laptops',
      btnSecondaryLink: '/catalog/best-sellers',
      iconName: 'laptop',
      bgGradient: 'var(--hero-gradient-2)' // 👈 Вынесли в переменную
    },
    {
      btnPrimaryLink: '/catalog/audio',
      btnSecondaryLink: '/catalog/new-arrivals',
      iconName: 'headphones',
      bgGradient: 'var(--hero-gradient-3)' // 👈 Вынесли в переменную
    }
  ];

  // 🚀 ГЛАВНОЕ: computed signal автоматически пересчитывается при:
  //    1) Смене языка (через languageService.currentLanguage())
  //    2) Загрузке новых товаров (через loadedProducts())
  readonly slides = computed<HeroSlide[]>(() => {
    const lang = this.languageService.currentLanguage() as keyof typeof HERO_I18N;
    const translations = HERO_I18N[lang] ?? HERO_I18N.ru; // Фолбэк на русский
    const products = this.loadedProducts();

    return this.baseSlides.map((base, index) => {
      const slideKey = `slide${index + 1}` as keyof typeof translations;
      const t = translations[slideKey];
      return {
        ...base,
        badgeText: t.badgeText,
        titlePart1: t.titlePart1,
        titleHighlight: t.titleHighlight,
        subtitle: t.subtitle,
        btnPrimaryText: t.btnPrimaryText,
        btnSecondaryText: t.btnSecondaryText,
        product: products[index] // 👈 Товары из БД попадают сюда
      };
    });
  });

  ngOnInit() {
    this.startAutoSlide();
    this.loadFeaturedProducts();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  private loadFeaturedProducts(): void {
    this.productService.loadFeatured(3).subscribe(products => {
      if (products && products.length > 0) {
        // Обновляем только сигнал товаров — slides пересчитается автоматически
        this.loadedProducts.set([products[0], products[1], products[2]]);
      }
    });
  }

  startAutoSlide() {
    this.stopAutoSlide();
    this.autoSlideInterval = setInterval(() => this.nextSlide(), 6000);
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) clearInterval(this.autoSlideInterval);
  }

  nextSlide() {
    this.currentSlide.update(c => (c + 1) % this.slides().length);
  }

  prevSlide() {
    this.currentSlide.update(c => (c - 1 + this.slides().length) % this.slides().length);
  }

  goToSlide(index: number) {
    this.currentSlide.set(index);
    this.startAutoSlide();
  }

  onMouseEnter() { this.stopAutoSlide(); }
  onMouseLeave() { this.startAutoSlide(); }
}
