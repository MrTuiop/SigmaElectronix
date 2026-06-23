import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideZap, LucideSmartphone, LucideLaptop,
  LucideHeadphones, LucideChevronLeft, LucideChevronRight
} from '@lucide/angular';
import { ProductService } from '../../../services/product-service';
import { LanguageService } from '../../../services/language-service'; // 👈 Импортируем LanguageService
import { ProductListDto } from '../../../models/product-models';

interface HeroSlide {
  badgeText: string;
  titlePart1: string;
  titleHighlight: string;
  subtitle: string;
  btnPrimaryText: string;
  btnPrimaryLink: string;
  btnSecondaryText: string;
  btnSecondaryLink: string;
  iconName: 'smartphone' | 'laptop' | 'headphones';
  product?: ProductListDto;
  bgGradient: string;
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideZap,
    LucideSmartphone,
    LucideLaptop,
    LucideHeadphones,
    LucideChevronLeft,
    LucideChevronRight
  ],
  templateUrl: './hero-banner.html',
  styleUrls: ['./hero-banner.css']
})
export class HeroBannerComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private languageService = inject(LanguageService); // 👈 Инжектим сервис

  private previousLanguage = signal<string>(this.languageService.currentLanguage()); // 👈 Отслеживаем прошлый язык

  currentSlide = signal(0);
  private autoSlideInterval: any;

  // Заготовки слайдов (хардкод)
  slides = signal<HeroSlide[]>([
    {
      badgeText: 'Специальное предложение',
      titlePart1: 'Техника, которая ',
      titleHighlight: 'вдохновляет',
      subtitle: 'Скидки до 30% на новинки сезона. Бесплатная доставка по всей России при заказе от 5 000 ₽.',
      btnPrimaryText: 'Смотреть новинки',
      btnPrimaryLink: '/catalog?sort=newest',
      btnSecondaryText: 'Все товары',
      btnSecondaryLink: '/catalog',
      iconName: 'smartphone',
      bgGradient: 'var(--purple-gradient, linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%))'
    },
    {
      badgeText: 'Гейминг без границ',
      titlePart1: 'Новая реальность ',
      titleHighlight: 'в играх',
      subtitle: 'Мощные ноутбуки и периферия для профессиональных геймеров. Побеждай с нами!',
      btnPrimaryText: 'Выбрать ноутбук',
      btnPrimaryLink: '/catalog/laptops',
      btnSecondaryText: 'Смотреть хиты',
      btnSecondaryLink: '/catalog/best-sellers',
      iconName: 'laptop',
      bgGradient: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)'
    },
    {
      badgeText: 'Звук вокруг',
      titlePart1: 'Почувствуй каждый ',
      titleHighlight: 'бит',
      subtitle: 'Премиальные наушники с активным шумоподавлением. Полное погружение в музыку.',
      btnPrimaryText: 'Купить аудио',
      btnPrimaryLink: '/catalog/audio',
      btnSecondaryText: 'Новинки',
      btnSecondaryLink: '/catalog/new-arrivals',
      iconName: 'headphones',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)'
    }
  ]);

  // 👇 Магия effect: срабатывает только когда меняется currentLanguage
  private readonly languageEffect = effect(() => {
    const currentLang = this.languageService.currentLanguage();
    if (this.previousLanguage() !== currentLang) {
      this.previousLanguage.set(currentLang);
      this.loadFeaturedProducts(); // Перезагружаем только товары из БД
    }
  });

  ngOnInit() {
    this.startAutoSlide();
    this.loadFeaturedProducts(); // Вынесли в отдельный метод для переиспользования
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  // 👇 Отдельный метод для загрузки товаров (используется и в ngOnInit и в effect)
  private loadFeaturedProducts(): void {
    this.productService.loadFeatured(3).subscribe(products => {
      if (products && products.length > 0) {
        this.slides.update(s => {
          const newSlides = [...s];
          if (products[0]) newSlides[0].product = products[0];
          if (products[1]) newSlides[1].product = products[1];
          if (products[2]) newSlides[2].product = products[2];
          return newSlides;
        });
      }
    });
  }

  startAutoSlide() {
    this.stopAutoSlide();
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 6000);
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
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

  onMouseEnter() {
    this.stopAutoSlide();
  }

  onMouseLeave() {
    this.startAutoSlide();
  }
}
