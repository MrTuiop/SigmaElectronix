import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  LucideUser, LucideMail, LucidePhone,
  LucideTruck, LucideStore, LucidePackage,
  LucideCreditCard, LucideBanknote, LucideWallet,
  LucideTag, LucidePercent, LucideGift,
  LucideShieldCheck, LucideChevronDown, LucideCalendar,
  LucideMapPin
} from '@lucide/angular';

import { AuthService } from '../../services/auth-service';
import { ProfileService } from '../../services/profile-service';
import { CartService } from '../../services/cart-service';
import { OrderService } from '../../services/order-service';
import { CouponService } from '../../services/coupon-service';
import { CurrentLocationService } from '../../services/current-location-service';
import { StoreService } from '../../services/store-service';
import { StoreInventoryService } from '../../services/store-inventory-service';

import { CreateOrderDto, PaymentMethod } from '../../models/order-model';
import { StoreDto } from '../../models/store-models';
import { StoreInventoryDto } from '../../models/store-inventory-models';
import { AuthModalComponent } from '../../components/auth-components/auth-modal/auth-modal';
import { ToastService } from '../../services/toast';

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
    LucideShieldCheck, LucideChevronDown, LucideCalendar, LucideMapPin, AuthModalComponent
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutPage implements OnInit {
  // Инъекция сервисов
  authService = inject(AuthService);
  profileService = inject(ProfileService);
  cartService = inject(CartService);
  orderService = inject(OrderService);
  couponService = inject(CouponService);
  currentLocationService = inject(CurrentLocationService);
  storeService = inject(StoreService);
  storeInventoryService = inject(StoreInventoryService);
  private router = inject(Router);
  toastService = inject(ToastService);

  showAuthModal = signal(false);

  // ======= ШАГ 1: КОНТАКТНЫЕ ДАННЫЕ =======
  contact = signal({ name: '', email: '', phone: '' });

  // ======= ШАГ 2: ДОСТАВКА =======
  deliveryMethod = signal<'courier' | 'pickup' | 'delivery_service'>('courier');
  deliveryAddress = signal('');

  selectedSavedAddressId = signal<number | null>(null);
  isCustomAddress = signal(true);

  deliveryCompany = signal<'cdek' | 'pochta' | 'pek' | 'boxberry'>('cdek');

  // Для самовывоза
  storesInCity = signal<StoreDto[]>([]);
  isLoadingStores = signal(false);
  selectedStoreId = signal<number | null>(null);

  // Инвентарь товаров: productId -> StoreInventoryDto[]
  productInventories = signal<Record<number, StoreInventoryDto[]>>({});

  readonly FREE_DELIVERY_THRESHOLD = 5000;
  deliveryCost = computed(() => {
    if (this.deliveryMethod() === 'pickup') return 0;
    if (this.deliveryMethod() === 'delivery_service') return 400;
    return this.subtotal() >= this.FREE_DELIVERY_THRESHOLD ? 0 : 300;
  });

  // ======= ДАТА И НАЛИЧИЕ =======
  estimatedDeliveryDate = computed(() => {
    const method = this.deliveryMethod();
    const today = new Date();

    if (method === 'pickup') {
      const storeId = this.selectedStoreId();
      if (storeId && this.isStoreAvailableToday(storeId)) {
        return `Сегодня, ${today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
      } else {
        return this.getNextWeekDate();
      }
    } else if (method === 'courier') {
      today.setDate(today.getDate() + 2);
      return `${today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} (±1 день)`;
    } else {
      today.setDate(today.getDate() + 4);
      return `${today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} (±2 дня)`;
    }
  });

  getItemStockInfo(item: any): { status: 'success' | 'warning', text: string } | null {
    if (this.deliveryMethod() !== 'pickup' || !this.selectedStoreId()) return null;

    const inventories = this.productInventories()[item.productId];
    if (!inventories) return { status: 'warning', text: 'Проверка наличия...' };

    const storeInv = inventories.find(i => i.storeId === this.selectedStoreId());
    const stock = storeInv ? storeInv.quantity : 0;

    if (stock >= item.quantity) {
      return { status: 'success', text: `В магазине: ${stock} шт.` };
    } else {
      return { status: 'warning', text: `Под заказ (будет ${this.getNextWeekDate()})` };
    }
  }

  // ======= ШАГ 3: ОПЛАТА =======
  paymentMethod = signal<'card' | 'cash' | 'wallet'>('card');

  // ======= ПРОМОКОД =======
  promoCode = signal('');
  appliedPromo = signal<{ code: string; discountPercent: number; discountValue: number; isPercentage: boolean } | null>(null);
  promoError = signal('');

  // ======= БОНУСНЫЕ БАЛЛЫ =======
  availableBonuses = computed(() => this.profileService.user()?.bonusBalance ?? 0);
  useBonuses = signal(false);
  bonusesToSpend = signal(0);

  maxBonusesForOrder = computed(() => {
    // 30% от стоимости товаров с учётом промокода
    const baseForBonuses = Math.max(0, this.subtotal() - this.promoDiscountAmount());
    const maxByOrder = Math.floor(baseForBonuses * 0.3);
    return Math.min(maxByOrder, this.availableBonuses());
  });

  earnedBonuses = computed(() => {
    // Обычно, если баллы тратятся, новые за этот заказ не начисляются
    if (this.useBonuses() && this.bonusesToSpend() > 0) return 0;

    const baseForCashback = Math.max(0, this.subtotal() - this.promoDiscountAmount());
    return Math.floor(baseForCashback * 0.05); // 5% кэшбек
  });

  // ======= ВЫЧИСЛЕНИЯ ИТОГА =======
  subtotal = computed(() => this.cartService.totalPrice());

  promoDiscountAmount = computed(() => {
    const promo = this.appliedPromo();
    if (!promo) return 0;
    if (promo.isPercentage) {
      return Math.round(this.subtotal() * promo.discountValue / 100);
    } else {
      return Math.min(this.subtotal(), promo.discountValue);
    }
  });

  bonusesDiscount = computed(() => this.useBonuses() ? this.bonusesToSpend() : 0);
  totalDiscount = computed(() => this.promoDiscountAmount() + this.bonusesDiscount());
  total = computed(() => this.subtotal() - this.totalDiscount() + this.deliveryCost());

  // ======= ВАЛИДАЦИЯ ФОРМЫ =======
  // ======= ВАЛИДАЦИЯ ФОРМЫ =======
  isFormValid = computed(() => {
    const phone = this.contact().phone;

    // 1. Проверяем телефон (он обязателен)
    if (!phone || phone.trim() === '') {
      return false;
    }

    const method = this.deliveryMethod();

    // 2. Проверяем курьерскую доставку
    if (method === 'courier') {
      if (this.isCustomAddress()) {
        const addr = this.deliveryAddress();
        if (!addr || addr.trim() === '') return false;
      } else {
        if (!this.selectedSavedAddressId()) return false;
      }
    }
    // 3. Проверяем службы доставки (СДЭК и т.д.)
    else if (method === 'delivery_service') {
      const addr = this.deliveryAddress();
      if (!addr || addr.trim() === '') return false;
    }
    // 4. Проверяем самовывоз
    else if (method === 'pickup') {
      if (!this.selectedStoreId()) return false;
    }

    return true; // Форма валидна!
  });

  // ======= ИНИЦИАЛИЗАЦИЯ =======
  constructor() {
    effect(() => {
      const user = this.profileService.user();
      if (user) {
        untracked(() => {
          if (!this.contact().name) {
            this.contact.set({
              name: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
              email: user.email || '',
              phone: user.phoneNumber || ''
            });
          }
        });
      }
    });

    effect(() => {
      const cityId = this.currentLocationService.currentCityId();
      untracked(() => {
        this.loadStoresAndInventory();
      });
    });

    effect(() => {
      const addresses = this.profileService.addresses();
      untracked(() => {
        if (addresses && addresses.length > 0) {
          // Выбираем дефолтный или первый
          if (this.selectedSavedAddressId() === null) {
            const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
            this.selectedSavedAddressId.set(defaultAddr.id);
            this.isCustomAddress.set(false); // Прячем ручной ввод
          }
        } else {
          this.isCustomAddress.set(true); // Показываем ручной ввод
        }
      });
    });
  }

  ngOnInit() {
    this.loadStoresAndInventory();

    if (this.authService.isAuthenticated()) {
      this.profileService.loadAddresses().subscribe();
    }
  }

  // ======= ЛОГИКА МАГАЗИНОВ И ОСТАТКОВ =======
  loadStoresAndInventory(): void {
    const cityId = this.currentLocationService.currentCityId();
    const cart = this.cartService.cart();

    if (!cart || cart.items.length === 0) return;

    this.isLoadingStores.set(true);

    this.storeService.getAllStores(false).subscribe({
      next: (stores) => {
        const cityStores = stores.filter(s => s.cityId === cityId);
        this.storesInCity.set(cityStores);
        if (cityStores.length > 0) {
          this.selectedStoreId.set(cityStores[0].id);
        }

        const inventoryRequests = cart.items.map(item =>
          this.storeInventoryService.getInventoryByProduct(item.productId)
        );

        if (inventoryRequests.length > 0) {
          forkJoin(inventoryRequests).subscribe({
            next: (responses) => {
              const invMap: Record<number, StoreInventoryDto[]> = {};
              cart.items.forEach((item, index) => {
                invMap[item.productId] = responses[index];
              });
              this.productInventories.set(invMap);
              this.isLoadingStores.set(false);
            },
            error: () => this.isLoadingStores.set(false)
          });
        } else {
          this.isLoadingStores.set(false);
        }
      },
      error: () => this.isLoadingStores.set(false)
    });
  }

  isStoreAvailableToday(storeId: number): boolean {
    const cart = this.cartService.cart();
    if (!cart || cart.items.length === 0) return false;

    const invMap = this.productInventories();

    for (const item of cart.items) {
      const itemInventories = invMap[item.productId];
      if (!itemInventories) return false;
      const storeInv = itemInventories.find(i => i.storeId === storeId);
      if (!storeInv || storeInv.quantity < item.quantity) return false;
    }
    return true;
  }

  getNextWeekDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }

  // ======= МЕТОДЫ ПРОМОКОДОВ / БОНУСОВ =======
  applyPromo(): void {
    const code = this.promoCode().trim().toUpperCase();
    if (!code) return;

    this.promoError.set('');
    this.couponService.validateCoupon(code, this.subtotal()).subscribe({
      next: (res) => {
        if (res.coupon) {
          this.appliedPromo.set({
            code: res.coupon.code,
            discountValue: res.coupon.discountValue,
            isPercentage: res.coupon.isPercentage,
            discountPercent: res.coupon.isPercentage ? res.coupon.discountValue : 0
          });
        } else {
          this.promoError.set(res.message || 'Неверный промокод');
        }
      },
      error: (err) => {
        this.promoError.set(err.error?.message || 'Ошибка применения промокода');
      }
    });
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
    } else {
      this.bonusesToSpend.set(this.maxBonusesForOrder());
    }
  }

  // ======= ОФОРМЛЕНИЕ ЗАКАЗА =======
  placeOrder(): void {
    const currentCart = this.cartService.cart();
    if (!currentCart || currentCart.items.length === 0) {
      this.toastService.error('Корзина пуста!'); // 👈 ИСПОЛЬЗУЕМ TOAST
      return;
    }

    // 👈 ПРОВЕРЯЕМ ФОРМУ И ВЫВОДИМ ОШИБКУ ПРИ КЛИКЕ
    if (!this.isFormValid()) {
      this.toastService.error('Пожалуйста, заполните обязательные поля (Телефон и Адрес/Магазин)');
      return;
    }

    let finalAddress = this.deliveryAddress();

    if (this.deliveryMethod() === 'pickup') {
      const store = this.storesInCity().find(s => s.id === this.selectedStoreId());
      finalAddress = `Самовывоз: ${store?.name} (${store?.fullAddress})`;
    } else if (this.deliveryMethod() === 'delivery_service') {
      finalAddress = `Доставка ${this.deliveryCompany().toUpperCase()}: ${this.deliveryAddress()}`;
    } else if (this.deliveryMethod() === 'courier') {
      if (!this.isCustomAddress() && this.selectedSavedAddressId()) {
        const savedAddr = this.profileService.addresses().find(a => a.id === this.selectedSavedAddressId());
        if (savedAddr) {
          finalAddress = `${savedAddr.city}, ${savedAddr.street}, Индекс: ${savedAddr.zip}`;
        }
      }
    }

    const dto: CreateOrderDto = {
      shippingFullName: this.contact().name, // Имя уйдет пустым, если не введено - это нормально
      shippingPhone: this.contact().phone,
      shippingEmail: this.contact().email,
      shippingAddress: finalAddress,
      shippingCost: this.deliveryCost(),
      promoCode: this.appliedPromo()?.code,
      storeId: this.deliveryMethod() === 'pickup' ? this.selectedStoreId() : null,
      paymentMethod: this.mapPaymentMethod(this.paymentMethod()),
      bonusesToSpend: this.useBonuses() ? this.bonusesToSpend() : 0,
      items: currentCart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    this.orderService.createOrder(dto).subscribe({
      next: (order) => {
        this.cartService.clearCart().subscribe();

        if (this.paymentMethod() === 'cash') {
          this.toastService.success(`Заказ №${order.orderNumber} успешно оформлен!`); // 👈 ИСПОЛЬЗУЕМ TOAST
          this.router.navigate(['/profile']);
        } else {
          this.router.navigate(['/payment', order.id]);
        }
      },
      error: (err) => this.toastService.error('Не удалось оформить заказ: ' + err.message) // 👈 ИСПОЛЬЗУЕМ TOAST
    });
  }

  private mapPaymentMethod(method: string): PaymentMethod {
    switch (method) {
      case 'cash': return PaymentMethod.Cash;
      case 'wallet': return PaymentMethod.Wallet;
      case 'card': default: return PaymentMethod.Card;
    }
  }
}
