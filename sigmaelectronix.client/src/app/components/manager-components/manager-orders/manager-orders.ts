import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order-service';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';
import { ConfirmModalComponent } from '../../shared-components/confirm-modal/confirm-modal';
import { ToastService } from '../../../services/toast';
import {
  LucideShoppingBag, LucideEye, LucideChevronLeft, LucideChevronDown,
  LucideSearch, LucideUser, LucideMapPin, LucideCreditCard, LucideTruck, LucideCalendarClock,
  LucideBanknote
} from '@lucide/angular';
import { OrderDto } from '../../../models/order-models';

@Component({
  selector: 'app-manager-orders',
  standalone: true,
  imports: [
    CommonModule, FormsModule, SpinnerComponent, ConfirmModalComponent,
    LucideShoppingBag, LucideEye, LucideChevronLeft, LucideChevronDown,
    LucideSearch, LucideUser, LucideMapPin, LucideCreditCard, LucideTruck, LucideCalendarClock, LucideBanknote
  ],
  templateUrl: './manager-orders.html',
  styleUrl: './manager-orders.css'
})
export class ManagerOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  // --- Состояния ---
  orders = signal<OrderDto[]>([]);
  loading = signal(false);

  // Режимы экрана: 'list' - таблица, 'detail' - просмотр конкретного заказа
  viewMode = signal<'list' | 'detail'>('list');
  selectedOrder = signal<OrderDto | null>(null);

  searchQuery = signal('');

  // --- Состояния для модальных окон подтверждения ---
  showPaymentModal = signal(false);
  showStatusModal = signal(false);
  pendingStatusChange = signal<string | null>(null);

  // Полный список статусов, как в C#
  availableStatuses = ['Pending', 'Paid', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

  // --- Умная фильтрация (только по поиску) ---
  filteredOrders = computed(() => {
    let result = this.orders();
    const query = this.searchQuery().toLowerCase().trim();

    if (query) {
      result = result.filter(o =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(query)) ||
        (o.shippingFullName && o.shippingFullName.toLowerCase().includes(query)) ||
        (o.shippingPhone && o.shippingPhone.includes(query))
      );
    }
    return result;
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService.getAllOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Ошибка при загрузке заказов');
      }
    });
  }

  // --- Навигация ---
  openOrderDetails(order: OrderDto): void {
    this.selectedOrder.set(order);
    this.viewMode.set('detail');
  }

  closeDetails(): void {
    this.viewMode.set('list');
    this.selectedOrder.set(null);
  }

  // === ИЗМЕНЕНИЕ СТАТУСА ЗАКАЗА ===
  changeOrderStatus(newStatus: string): void {
    if (!this.selectedOrder()) return;

    // Открываем модалку вместо confirm()
    this.pendingStatusChange.set(newStatus);
    this.showStatusModal.set(true);
  }

  confirmStatusChange(): void {
    const order = this.selectedOrder();
    const newStatus = this.pendingStatusChange();
    if (!order || !newStatus) return;

    this.showStatusModal.set(false);
    this.loading.set(true);

    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (updatedOrder) => {
        this.selectedOrder.set(updatedOrder);
        this.orders.update(list => list.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        this.loading.set(false);
        this.pendingStatusChange.set(null);
        this.toastService.success('Статус заказа успешно обновлен!');
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Не удалось обновить статус заказа');
        this.cancelStatusChange(); // Возвращаем UI в исходное состояние
      }
    });
  }

  cancelStatusChange(): void {
    this.showStatusModal.set(false);
    this.pendingStatusChange.set(null);

    // Трюк для возврата <select> в исходное визуальное состояние, если пользователь нажал Отмена
    const order = this.selectedOrder();
    if (order) {
      this.selectedOrder.set({ ...order });
    }
  }

  // === ПОДТВЕРЖДЕНИЕ ОПЛАТЫ НА КАССЕ ===
  confirmInStorePayment(): void {
    if (!this.selectedOrder()) return;
    this.showPaymentModal.set(true); // Только открываем окно
  }

  processPayment(): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.showPaymentModal.set(false);
    this.loading.set(true);

    this.orderService.markAsPaidInStore(order.id).subscribe({
      next: (updatedOrder) => {
        this.selectedOrder.set(updatedOrder);
        this.orders.update(list => list.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        this.loading.set(false);
        this.toastService.success('Оплата успешно подтверждена!');
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error('Не удалось подтвердить оплату. Возможно, она уже проведена.');
      }
    });
  }

  cancelPayment(): void {
    this.showPaymentModal.set(false);
  }

  // --- Хелперы для красивого UI ---
  translateStatus(status: string): string {
    const map: Record<string, string> = {
      'Pending': 'Ожидает',
      'Paid': 'Оплачен',
      'Confirmed': 'Подтвержден',
      'Processing': 'В сборке',
      'Shipped': 'Отправлен',
      'Delivered': 'Доставлен',
      'Cancelled': 'Отменен',
      'Refunded': 'Возврат средств'
    };
    return map[status] || status;
  }

  translatePaymentStatus(status: string): string {
    const map: Record<string, string> = {
      'Pending': 'Не оплачен',
      'Paid': 'Оплачен',
      'Failed': 'Ошибка оплаты',
      'Refunded': 'Возврат',
      'Expired': 'Истёк резерв'
    };
    return map[status] || status;
  }

  translatePaymentMethod(method: string): string {
    const map: Record<string, string> = {
      'Online': 'Картой онлайн',
      'InStore': 'В магазине при получении',
      'CashOnDelivery': 'Курьеру при получении'
    };
    return map[method] || method;
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'Pending': 'badge-warning',
      'Confirmed': 'badge-info',
      'Paid': 'badge-success',
      'Processing': 'badge-info',
      'Shipped': 'badge-primary',
      'Delivered': 'badge-success',
      'Cancelled': 'badge-danger',
      'Refunded': 'badge-gray'
    };
    return map[status] || 'badge-gray';
  }
}
