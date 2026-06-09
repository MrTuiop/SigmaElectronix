import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, signal } from '@angular/core';

import {
  LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch,
  LucideTv, LucideGamepad2, LucideArrowRight, LucideHeart,
  LucideShoppingCart, LucideStar, LucideTruck, LucideShieldCheck,
  LucideRefreshCw, LucideHeadset, LucideMail, LucideSend, LucideZap
} from '@lucide/angular';
import { FeaturedBrandsComponent } from '../../components/brand-components/featured-brands/featured-brands';
import { BestSellersComponent } from '../../components/home-components/best-sellers/best-sellers';
import { NewProductsComponent } from '../../components/home-components/new-products/new-products';

interface Category {
  icon: string;
  name: string;
  count: number;
}

interface Product {
  id: number;
  icon: string;
  gradient: string;
  brand: string;
  name: string;
  rating: number;
  reviews: number;
  price: number;
  oldPrice?: number;
  discount?: number;
  isNew?: boolean;
  inWishlist: boolean;
}

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
    LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch,
    LucideTv, LucideGamepad2, LucideArrowRight, LucideHeart,
    LucideShoppingCart, LucideStar, LucideTruck, LucideShieldCheck,
    LucideRefreshCw, LucideHeadset, LucideMail, LucideSend, LucideZap
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomePage {
  // ---- КАТЕГОРИИ ----
  categories = signal<Category[]>([
    { icon: 'smartphone', name: 'Смартфоны', count: 142 },
    { icon: 'laptop', name: 'Ноутбуки', count: 89 },
    { icon: 'headphones', name: 'Наушники', count: 67 },
    { icon: 'watch', name: 'Умные часы', count: 45 },
    { icon: 'tv', name: 'Телевизоры', count: 38 },
    { icon: 'gamepad-2', name: 'Игры', count: 112 },
  ]);

  // ---- ПРЕИМУЩЕСТВА ----
  advantages = signal<Advantage[]>([
    {
      icon: 'truck',
      title: 'Быстрая доставка',
      description: 'Доставляем по всей России за 1–5 дней. Бесплатно при заказе от 5 000 ₽.',
    },
    {
      icon: 'shield-check',
      title: 'Гарантия до 3 лет',
      description: 'Официальная гарантия производителя и расширенная сервисная поддержка.',
    },
    {
      icon: 'refresh-cw',
      title: 'Возврат за 30 дней',
      description: 'Если товар не подошёл, верните его в течение 30 дней без лишних вопросов.',
    },
    {
      icon: 'headset',
      title: 'Поддержка 24/7',
      description: 'Наша служба заботы всегда на связи: по телефону, в чате и по email.',
    },
  ]);

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
