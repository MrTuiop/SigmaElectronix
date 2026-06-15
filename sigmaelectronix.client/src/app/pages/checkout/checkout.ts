import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  LucideUser, LucideMail, LucidePhone,
  LucideTruck, LucideStore, LucidePackage,
  LucideCreditCard, LucideBanknote, LucideWallet,
  LucideTag, LucidePercent, LucideGift,
  LucideShieldCheck, LucideChevronDown
} from '@lucide/angular';
import { AuthService } from '../../services/auth-service';
import { ProfileService } from '../../services/profile-service';
import { CartService } from '../../services/cart-service';
import { OrderService } from '../../services/order-service';
import { CreateOrderDto, PaymentMethod } from '../../models/order-model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
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
  // Инъекция реальных сервисов
  authService = inject(AuthService);
  profileService = inject(ProfileService);
  cartService = inject(CartService);
  orderService = inject(OrderService);
  private router = inject(Router);

  // ======= ШАГ 1: КОНТАКТНЫЕ ДАННЫЕ =======
  contact = signal({ name: '', email: '', phone: '' });

  // ======= ШАГ 2: ДОСТАВКА =======
  deliveryMethod = signal<'courier' | 'pickup' | 'post'>('courier');
  deliveryAddress = signal('');

  readonly FREE_DELIVERY_THRESHOLD = 5000;
  deliveryCost = computed(() => {
    if (this.deliveryMethod() === 'pickup') return 0;
    if (this.deliveryMethod() === 'post') return 400;
    return this.subtotal() >= this.FREE_DELIVERY_THRESHOLD ? 0 : 300;
  });

  // ======= ШАГ 3: ОПЛАТА =======
  paymentMethod = signal<'card' | 'cash' | 'wallet'>('card');

  // ======= ПРОМОКОД =======
  promoCode = signal('');
  appliedPromo = signal<{ code: string; discountPercent: number } | null>(null);
  promoError = signal('');

  // ======= БОНУСНЫЕ БАЛЛЫ =======
  // Берем бонусы из профиля, если они там есть, иначе 0
  availableBonuses = computed(() => {
    // В ProfileService пока нет поля TotalBonuses, но для примера оставим заглушку. 
    // Если добавишь в ProfileModels, можно будет брать так: this.profileService.user()?.bonuses ?? 0
    return 2500;
  });
  useBonuses = signal(false);
  bonusesToSpend = signal(0);
  maxBonusesForOrder = computed(() => {
    const maxByOrder = Math.floor(this.subtotal() * 0.3);
    return Math.min(maxByOrder, this.availableBonuses());
  });

  // ======= ВЫЧИСЛЕНИЯ ИТОГА =======
  // Сумма берется напрямую из сервиса корзины!
  subtotal = computed(() => this.cartService.totalPrice());

  promoDiscountAmount = computed(() => {
    const promo = this.appliedPromo();
    return promo ? Math.round(this.subtotal() * promo.discountPercent / 100) : 0;
  });

  bonusesDiscount = computed(() => this.useBonuses() ? this.bonusesToSpend() : 0);
  totalDiscount = computed(() => this.promoDiscountAmount() + this.bonusesDiscount());

  total = computed(() => this.subtotal() - this.totalDiscount() + this.deliveryCost());

  // ======= ИНИЦИАЛИЗАЦИЯ =======
  constructor() {
    // Effect следит за изменением профиля. Как только данные пользователя загрузятся (или изменятся), 
    // форма контактов заполнится автоматически.
    effect(() => {
      const user = this.profileService.user();
      if (user) {
        this.contact.set({
          name: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
          email: user.email || '',
          phone: user.phoneNumber || ''
        });
      }
    });
  }

  // ======= МЕТОДЫ ПРОМОКОДОВ / БОНУСОВ =======
  applyPromo(): void {
    const code = this.promoCode().trim().toUpperCase();
    this.promoError.set('');
    // TODO: Здесь должен быть вызов сервиса CouponService, пока оставляем локальную логику
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

  // ======= ОФОРМЛЕНИЕ ЗАКАЗА =======
  placeOrder(): void {
    const currentCart = this.cartService.cart();
    if (!currentCart || currentCart.items.length === 0) {
      alert('Корзина пуста!');
      return;
    }

    // Собираем данные в DTO для бэкенда
    const dto: CreateOrderDto = {
      shippingFullName: this.contact().name,
      shippingPhone: this.contact().phone,
      shippingEmail: this.contact().email,
      shippingAddress: this.deliveryMethod() === 'pickup' ? 'Самовывоз из магазина' : this.deliveryAddress(),
      shippingCost: this.deliveryCost(),
      promoCode: this.appliedPromo()?.code,
      storeId: this.deliveryMethod() === 'pickup' ? 1 : null, // ID магазина для самовывоза (пока хардкод)
      paymentMethod: this.mapPaymentMethod(this.paymentMethod()),
      items: currentCart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    // Отправляем запрос на сервер
    this.orderService.createOrder(dto).subscribe({
      next: (order) => {
        // Заказ успешно создан
        alert(`Заказ №${order.orderNumber} успешно оформлен!`);

        // Очищаем корзину на клиенте (и на сервере, если он сам этого не делает)
        this.cartService.clearCart().subscribe();

        // Перенаправляем пользователя на страницу заказов (или профиль)
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        alert('Не удалось оформить заказ: ' + err.message);
      }
    });
  }

  // Маппинг строкового метода в Enum для бэкенда
  private mapPaymentMethod(method: string): PaymentMethod {
    switch (method) {
      case 'cash': return PaymentMethod.Cash;
      case 'wallet': return PaymentMethod.Wallet;
      case 'card':
      default:
        return PaymentMethod.Card;
    }
  }
}
