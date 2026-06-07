import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  LucideUser, LucideMail, LucidePhone,
  LucideTruck, LucideStore, LucidePackage,
  LucideCreditCard, LucideBanknote, LucideWallet,
  LucideTag, LucidePercent, LucideGift,
  LucideShieldCheck, LucideChevronDown
} from '@lucide/angular';

interface CartItem {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  gradient: string;
  icon: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideUser, LucideMail, LucidePhone,
    LucideTruck, LucideStore, LucidePackage,
    LucideCreditCard, LucideBanknote, LucideWallet,
    LucideTag, LucidePercent, LucideGift,
    LucideShieldCheck, LucideChevronDown
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutPage {
  // ======= СОСТОЯНИЕ АВТОРИЗАЦИИ (заглушка) =======
  isLoggedIn = signal(true); // поменяйте на false, чтобы увидеть вариант с входом
  userData = signal({
    name: 'Иван Иванов',
    email: 'ivan@example.com',
    phone: '+7 (999) 123-45-67'
  });

  // ======= ШАГ 1: КОНТАКТНЫЕ ДАННЫЕ =======
  contact = signal({
    name: this.isLoggedIn() ? this.userData().name : '',
    email: this.isLoggedIn() ? this.userData().email : '',
    phone: this.isLoggedIn() ? this.userData().phone : ''
  });

  // ======= ШАГ 2: ДОСТАВКА =======
  deliveryMethod = signal<'courier' | 'pickup' | 'post'>('courier');
  deliveryAddress = signal('ул. Тверская, д. 15, кв. 22');
  deliveryCost = computed(() => {
    if (this.deliveryMethod() === 'pickup') return 0;
    if (this.deliveryMethod() === 'post') return 400;
    // курьер: порог бесплатной доставки 5000 руб
    return this.subtotal() >= 5000 ? 0 : 300;
  });
  readonly FREE_DELIVERY_THRESHOLD = 5000;

  // ======= ШАГ 3: ОПЛАТА =======
  paymentMethod = signal<'card' | 'cash' | 'wallet'>('card');

  // ======= ПРОМОКОД =======
  promoCode = signal('');
  appliedPromo = signal<{ code: string; discountPercent: number } | null>(null);
  promoError = signal('');

  // ======= БОНУСНЫЕ БАЛЛЫ =======
  availableBonuses = signal(2500); // из профиля
  useBonuses = signal(false);
  bonusesToSpend = signal(0);
  maxBonusesForOrder = computed(() => {
    // не более 30% от суммы и не более доступных баллов
    const maxByOrder = Math.floor(this.subtotal() * 0.3);
    return Math.min(maxByOrder, this.availableBonuses());
  });

  // ======= ТОВАРЫ (заглушка, обычно передаётся через сервис) =======
  items = signal<CartItem[]>([
    { id: 1, name: 'Samsung Galaxy S24 Ultra', price: 129990, oldPrice: 139990, quantity: 1, gradient: 'linear-gradient(135deg, #667eea, #764ba2)', icon: 'smartphone' },
    { id: 2, name: 'Sony WH-1000XM5', price: 34990, oldPrice: 39990, quantity: 2, gradient: 'linear-gradient(135deg, #f093fb, #f5576c)', icon: 'headphones' },
    { id: 3, name: 'Apple MacBook Air M3', price: 149990, quantity: 1, gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', icon: 'laptop' }
  ]);

  // ======= ВЫЧИСЛЕНИЯ ИТОГА =======
  subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  promoDiscountAmount = computed(() => {
    const promo = this.appliedPromo();
    return promo ? Math.round(this.subtotal() * promo.discountPercent / 100) : 0;
  });

  bonusesDiscount = computed(() => {
    return this.useBonuses() ? this.bonusesToSpend() : 0;
  });

  totalDiscount = computed(() => this.promoDiscountAmount() + this.bonusesDiscount());

  total = computed(() =>
    this.subtotal() - this.totalDiscount() + this.deliveryCost()
  );

  // ======= МЕТОДЫ =======
  applyPromo(): void {
    const code = this.promoCode().trim().toUpperCase();
    this.promoError.set('');
    if (code === 'SIGMA20') {
      this.appliedPromo.set({ code, discountPercent: 20 });
    } else if (code === 'WELCOME10') {
      this.appliedPromo.set({ code, discountPercent: 10 });
    } else {
      this.promoError.set('Неверный промокод');
    }
  }

  removePromo(): void {
    this.appliedPromo.set(null);
    this.promoCode.set('');
    this.promoError.set('');
  }

  onBonusesChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10) || 0;
    this.bonusesToSpend.set(Math.min(value, this.maxBonusesForOrder()));
  }

  toggleBonuses(): void {
    this.useBonuses.update(v => !v);
    if (!this.useBonuses()) {
      this.bonusesToSpend.set(0);
    }
  }

  placeOrder(): void {
    alert('Заказ оформлен! (заглушка)');
    // сброс корзины и т.д.
  }
}
