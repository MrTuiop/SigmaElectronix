import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, signal } from '@angular/core';

import {
  LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch,
  LucideTv, LucideGamepad2, LucideArrowRight, LucideHeart,
  LucideShoppingCart, LucideStar, LucideTruck, LucideShieldCheck,
  LucideRefreshCw, LucideHeadset, LucideMail, LucideSend, LucideZap
} from '@lucide/angular';

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

interface Brand { icon: string; name: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
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

  // ---- ХИТЫ ПРОДАЖ ----
  bestsellers = signal<Product[]>([
    {
      id: 1,
      icon: 'smartphone',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      brand: 'Apple',
      name: 'iPhone 15 Pro Max 256 ГБ',
      rating: 5,
      reviews: 284,
      price: 149990,
      oldPrice: 164990,
      discount: 9,
      inWishlist: false,
    },
    {
      id: 2,
      icon: 'laptop',
      gradient: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)',
      brand: 'ASUS',
      name: 'ROG Zephyrus G16 RTX 4070',
      rating: 5,
      reviews: 156,
      price: 189990,
      oldPrice: 219990,
      discount: 14,
      inWishlist: true,
    },
    {
      id: 3,
      icon: 'headphones',
      gradient: 'linear-gradient(135deg, #1e293b 0%, #64748b 100%)',
      brand: 'Apple',
      name: 'AirPods Pro 2 (USB-C)',
      rating: 5,
      reviews: 512,
      price: 24990,
      oldPrice: 29990,
      discount: 17,
      inWishlist: false,
    },
    {
      id: 4,
      icon: 'watch',
      gradient: 'linear-gradient(135deg, #1c1c1e 0%, #3a3a3c 100%)',
      brand: 'Samsung',
      name: 'Galaxy Watch 6 Classic 47 мм',
      rating: 4,
      reviews: 198,
      price: 45990,
      inWishlist: false,
    },
  ]);

  // ---- НОВИНКИ ----
  newProducts = signal<Product[]>([
    {
      id: 5,
      icon: 'tv',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
      brand: 'LG',
      name: 'OLED C4 65" 4K Smart TV',
      rating: 5,
      reviews: 47,
      price: 219990,
      oldPrice: 249990,
      discount: 12,
      isNew: true,
      inWishlist: false,
    },
    {
      id: 6,
      icon: 'gamepad-2',
      gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      brand: 'Sony',
      name: 'PlayStation 5 Slim Digital',
      rating: 5,
      reviews: 89,
      price: 54990,
      isNew: true,
      inWishlist: false,
    },
    {
      id: 7,
      icon: 'smartphone',
      gradient: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
      brand: 'Samsung',
      name: 'Galaxy S24 Ultra 512 ГБ',
      rating: 5,
      reviews: 312,
      price: 139990,
      oldPrice: 154990,
      discount: 10,
      isNew: true,
      inWishlist: true,
    },
    {
      id: 8,
      icon: 'headphones',
      gradient: 'linear-gradient(135deg, #3b0764 0%, #8b5cf6 100%)',
      brand: 'Sony',
      name: 'WH-1000XM6 Wireless',
      rating: 4,
      reviews: 26,
      price: 42990,
      isNew: true,
      inWishlist: false,
    },
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

  // НОВАЯ ВИТРИНА БРЕНДОВ
  brands = signal<Brand[]>([
    { icon: 'apple', name: 'Apple' },
    { icon: 'samsung', name: 'Samsung' },
    { icon: 'sony', name: 'Sony' },
    { icon: 'lg', name: 'LG' },
    { icon: 'asus', name: 'ASUS' },
    { icon: 'xiaomi', name: 'Xiaomi' },
  ]);

  // ---- МЕТОДЫ ----
  toggleWishlist(product: Product): void {
    // Заглушка: переключаем состояние избранного
    const updateList = (list: Product[]) =>
      list.map(p => p.id === product.id ? { ...p, inWishlist: !p.inWishlist } : p);

    this.bestsellers.update(updateList);
    this.newProducts.update(updateList);

    console.log(
      product.inWishlist
        ? `Удалено из избранного: ${product.name}`
        : `Добавлено в избранное: ${product.name}`
    );
  }

  addToCart(product: Product): void {
    // Заглушка: добавляем в корзину
    console.log(`Товар добавлен в корзину: ${product.name} — ${product.price} ₽`);
    // Здесь позже будет вызов сервиса корзины
  }

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
