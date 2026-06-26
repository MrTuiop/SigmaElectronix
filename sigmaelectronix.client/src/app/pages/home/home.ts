import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, signal, computed, inject } from '@angular/core';

import {
  LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch,
  LucideTv, LucideGamepad2, LucideArrowRight, LucideHeart,
  LucideShoppingCart, LucideStar, LucideTruck, LucideShieldCheck,
  LucideRefreshCw, LucideHeadset, LucideMail, LucideSend, LucideZap
} from '@lucide/angular';
import { FeaturedBrandsComponent } from '../../components/home-components/featured-brands/featured-brands';
import { BestSellersComponent } from '../../components/home-components/best-sellers/best-sellers';
import { NewProductsComponent } from '../../components/home-components/new-products/new-products';
import { CategoriesComponent } from '../../components/home-components/categories/categories';
import { HeroBannerComponent } from '../../components/home-components/hero-banner/hero-banner';
import { TranslateService, TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ
import { LanguageService } from '../../services/language-service'; // 👈 ДОБАВИЛИ

interface Advantage {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    FeaturedBrandsComponent,
    BestSellersComponent,
    NewProductsComponent,
    CategoriesComponent,
    HeroBannerComponent,
    LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch,
    LucideTv, LucideGamepad2, LucideArrowRight, LucideHeart,
    LucideShoppingCart, LucideStar, LucideTruck, LucideShieldCheck,
    LucideRefreshCw, LucideHeadset, LucideMail, LucideSend, LucideZap,
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomePage {
  private translate = inject(TranslateService); // 👈 ИНЖЕКТ
  private languageService = inject(LanguageService); // 👈 ИНЖЕКТ

  // 👈 Превратили signal в computed для реактивности при смене языка
  advantages = computed<Advantage[]>(() => {
    this.languageService.currentLanguage(); // Зависимость для пересчета
    return [
      {
        icon: 'truck',
        title: this.translate.instant('HOME.ADVANTAGES.DELIVERY_TITLE'),
        description: this.translate.instant('HOME.ADVANTAGES.DELIVERY_DESC'),
      },
      {
        icon: 'shield-check',
        title: this.translate.instant('HOME.ADVANTAGES.WARRANTY_TITLE'),
        description: this.translate.instant('HOME.ADVANTAGES.WARRANTY_DESC'),
      },
      {
        icon: 'refresh-cw',
        title: this.translate.instant('HOME.ADVANTAGES.RETURN_TITLE'),
        description: this.translate.instant('HOME.ADVANTAGES.RETURN_DESC'),
      },
      {
        icon: 'headset',
        title: this.translate.instant('HOME.ADVANTAGES.SUPPORT_TITLE'),
        description: this.translate.instant('HOME.ADVANTAGES.SUPPORT_DESC'),
      },
    ];
  });

  onSubscribe(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.querySelector('input') as HTMLInputElement;
    if (input?.value) {
      console.log('Подписка на рассылку:', input.value);
      input.value = '';
      // Здесь позже будет вызов сервиса рассылки
    }
  }
}
