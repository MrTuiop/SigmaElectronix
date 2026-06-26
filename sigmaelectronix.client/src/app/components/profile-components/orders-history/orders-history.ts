import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast';
import {
  LucidePackage,
  LucideChevronDown,
  LucideChevronUp,
  LucideMapPin,
  LucideCreditCard,
  LucideReceipt,
  LucideLoader2,
  LucideSearch,
  LucideX
} from '@lucide/angular';
import { OrderService } from '../../../services/order-service';
import { OrderDto, OrderItemDto } from '../../../models/order-models';
import { ProfileService } from '../../../services/profile-service';
import { TranslateDirective, TranslatePipe, TranslateService } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ ИМПОРТ

@Component({
  selector: 'app-orders-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    LucidePackage,
    LucideChevronDown,
    LucideChevronUp,
    LucideMapPin,
    LucideCreditCard,
    LucideReceipt,
    LucideLoader2,
    LucideSearch,
    LucideX,
    TranslateDirective,
    TranslatePipe
  ],
  templateUrl: './orders-history.html',
  styleUrl: './orders-history.css',
})
export class OrdersHistoryComponent implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private profileService = inject(ProfileService);
  private translate = inject(TranslateService); // 👈 ДОБАВИЛИ ИНЖЕКТ

  ordersList = signal<any[]>([]);
  isLoadingOrders = signal(true);
  expandedOrderId = signal<string | null>(null);
  orderDetails = signal<Map<string, OrderDto>>(new Map());
  isLoadingDetails = signal(false);

  // 🔹 Сигналы для модального окна поиска заказа
  showLinkModal = signal(false);
  linkMode = signal<'number' | 'phone'>('number');
  linkOrderNumber = signal('');
  linkPhone = signal('');
  isLinking = signal(false);

  currentOrderDetails = computed(() => {
    const id = this.expandedOrderId();
    return id ? this.orderDetails().get(id) : null;
  });

  ngOnInit(): void {
    this.loadMyOrders();
  }

  loadMyOrders() {
    this.isLoadingOrders.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        const mappedOrders = orders.map(o => ({
          ...o,
          date: new Date(o.createdAt).toLocaleDateString('ru-RU'),
          statusColor: this.getStatusColor(o.status),
          statusName: this.getStatusName(o.status),
          itemsCount: o.items ? o.items.reduce((sum: number, i: OrderItemDto) => sum + i.quantity, 0) : 0
        }));

        this.ordersList.set(mappedOrders);
        this.isLoadingOrders.set(false);
      },
      error: (err) => {
        console.error('Ошибка при загрузке списка заказов', err);
        this.isLoadingOrders.set(false);
      }
    });
  }

  toggleOrder(id: string | number) {
    const orderIdStr = String(id);
    if (this.expandedOrderId() === orderIdStr) {
      this.expandedOrderId.set(null);
      return;
    }
    this.expandedOrderId.set(orderIdStr);

    if (!this.orderDetails().has(orderIdStr)) {
      this.isLoadingDetails.set(true);
      this.orderService.getOrderById(Number(id)).subscribe({
        next: (detail) => {
          this.orderDetails.update(map => {
            const newMap = new Map(map);
            newMap.set(orderIdStr, detail);
            return newMap;
          });
          this.isLoadingDetails.set(false);
        },
        error: (err) => {
          console.error('Ошибка при загрузке деталей заказа', err);
          this.isLoadingDetails.set(false);
        }
      });
    }
  }

  openLinkModal() {
    this.showLinkModal.set(true);
    this.linkOrderNumber.set('');

    const currentUser = this.profileService.user();
    this.linkPhone.set(currentUser?.phoneNumber || '');

    this.linkMode.set('number');
  }

  closeLinkModal() {
    this.showLinkModal.set(false);
  }

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeLinkModal();
    }
  }

  linkOrder() {
    const orderNum = this.linkOrderNumber().trim();
    if (!orderNum) return;

    this.isLinking.set(true);
    this.orderService.linkGuestOrder(orderNum).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('PROFILE.ORDERS.TOAST.LINK_SUCCESS')); // 👈
        this.closeLinkModal();
        this.loadMyOrders();
        this.isLinking.set(false);
      },
      error: (err) => {
        this.toastService.error(this.translate.instant('PROFILE.ORDERS.TOAST.LINK_ERROR_NUMBER')); // 👈
        this.isLinking.set(false);
      }
    });
  }

  submitLink() {
    if (this.linkMode() === 'number') {
      const orderNum = this.linkOrderNumber().trim();
      if (!orderNum) return;

      this.isLinking.set(true);
      this.orderService.linkGuestOrder(orderNum).subscribe({
        next: () => {
          this.toastService.success(this.translate.instant('PROFILE.ORDERS.TOAST.LINK_SUCCESS')); // 👈
          this.finalizeLinking();
        },
        error: (err) => {
          this.toastService.error(this.translate.instant('PROFILE.ORDERS.TOAST.LINK_ERROR_NUMBER')); // 👈
          this.isLinking.set(false);
        }
      });
    } else {
      const phone = this.linkPhone().trim();
      if (!phone) return;

      this.isLinking.set(true);
      this.orderService.linkGuestOrdersByPhone(phone).subscribe({
        next: (res) => {
          if (res.count > 0) {
            this.toastService.success(this.translate.instant('PROFILE.ORDERS.TOAST.LINK_SUCCESS_PHONE', { count: res.count })); // 👈
            this.finalizeLinking();
          } else {
            this.toastService.info(this.translate.instant('PROFILE.ORDERS.TOAST.LINK_INFO_PHONE')); // 👈
            this.isLinking.set(false);
          }
        },
        error: (err) => {
          this.toastService.error(this.translate.instant('PROFILE.ORDERS.TOAST.LINK_ERROR_PHONE')); // 👈
          this.isLinking.set(false);
        }
      });
    }
  }

  private finalizeLinking() {
    this.closeLinkModal();
    this.loadMyOrders();
    this.isLinking.set(false);
  }

  getPaymentMethodName(method: string): string {
    const methods: Record<string, string> = {
      'Online': this.translate.instant('PROFILE.ORDERS.PAYMENT_METHODS.ONLINE'),
      'InStore': this.translate.instant('PROFILE.ORDERS.PAYMENT_METHODS.IN_STORE'),
      'CashOnDelivery': this.translate.instant('PROFILE.ORDERS.PAYMENT_METHODS.COD'),
      'Card': this.translate.instant('PROFILE.ORDERS.PAYMENT_METHODS.CARD'),
      'Cash': this.translate.instant('PROFILE.ORDERS.PAYMENT_METHODS.CASH'),
      'Wallet': this.translate.instant('PROFILE.ORDERS.PAYMENT_METHODS.WALLET')
    };
    return methods[method] || method;
  }

  getPaymentStatusName(status: string): string {
    const map: Record<string, string> = {
      'Pending': this.translate.instant('PROFILE.ORDERS.PAYMENT_STATUS.PENDING'),
      'Paid': this.translate.instant('PROFILE.ORDERS.PAYMENT_STATUS.PAID'),
      'Failed': this.translate.instant('PROFILE.ORDERS.PAYMENT_STATUS.FAILED'),
      'Refunded': this.translate.instant('PROFILE.ORDERS.PAYMENT_STATUS.REFUNDED'),
      'Expired': this.translate.instant('PROFILE.ORDERS.PAYMENT_STATUS.EXPIRED')
    };
    return map[status] || status;
  }

  getStatusColor(status: string): string {
    // Цвета не переводим :)
    const colors: Record<string, string> = {
      'Pending': '#f59e0b', 'Paid': '#10b981', 'Confirmed': '#0ea5e9',
      'Processing': '#8b5cf6', 'Shipped': '#6366f1', 'Delivered': '#10b981',
      'Cancelled': '#ef4444', 'Refunded': '#6b7280'
    };
    return colors[status] ?? '#6b7280';
  }

  getStatusName(status: string): string {
    const names: Record<string, string> = {
      'Pending': this.translate.instant('PROFILE.ORDERS.STATUS.PENDING'),
      'Paid': this.translate.instant('PROFILE.ORDERS.STATUS.PAID'),
      'Confirmed': this.translate.instant('PROFILE.ORDERS.STATUS.CONFIRMED'),
      'Processing': this.translate.instant('PROFILE.ORDERS.STATUS.PROCESSING'),
      'Shipped': this.translate.instant('PROFILE.ORDERS.STATUS.SHIPPED'),
      'Delivered': this.translate.instant('PROFILE.ORDERS.STATUS.DELIVERED'),
      'Cancelled': this.translate.instant('PROFILE.ORDERS.STATUS.CANCELLED'),
      'Refunded': this.translate.instant('PROFILE.ORDERS.STATUS.REFUNDED')
    };
    return names[status] ?? status;
  }

  canPayOnline(method: string, paymentStatus: string, orderStatus: string): boolean {
    if (paymentStatus === 'Paid' || orderStatus === 'Cancelled' || orderStatus === 'Refunded') {
      return false;
    }
    const onlineMethods = ['Card', 'Wallet', 'Online'];
    return onlineMethods.includes(method);
  }
}
