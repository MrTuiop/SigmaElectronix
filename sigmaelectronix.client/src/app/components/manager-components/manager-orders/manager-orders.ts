import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order-service';
import { OrderDto, OrderItemDto } from '../../../models/order-model';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';
import {
  LucideShoppingBag, LucideEye, LucideChevronLeft, LucideChevronDown,
  LucideSearch, LucideUser, LucideMapPin, LucideCreditCard, LucideTruck, LucideCalendarClock
} from '@lucide/angular';

@Component({
  selector: 'app-manager-orders',
  standalone: true,
  imports: [
    CommonModule, FormsModule, SpinnerComponent,
    LucideShoppingBag, LucideEye, LucideChevronLeft, LucideChevronDown,
    LucideSearch, LucideUser, LucideMapPin, LucideCreditCard, LucideTruck, LucideCalendarClock
  ],
  templateUrl: './manager-orders.html',
  styleUrl: './manager-orders.css'
})
export class ManagerOrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  // --- Состояния ---
  orders = signal<OrderDto[]>([]);
  loading = signal(false);

  // Режимы экрана: 'list' - таблица, 'detail' - просмотр конкретного заказа
  viewMode = signal<'list' | 'detail'>('list');
  selectedOrder = signal<OrderDto | null>(null);

  searchQuery = signal('');
  statusFilter = signal<string>('All');

  // Доступные статусы (подстрой под свои OrderStatus из C#)
  availableStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  // --- Умная фильтрация ---
  filteredOrders = computed(() => {
    let result = this.orders();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    if (status !== 'All') {
      result = result.filter(o => o.status === status);
    }

    if (query) {
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.shippingFullName.toLowerCase().includes(query) ||
        o.shippingPhone.includes(query)
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
        alert('Ошибка при загрузке заказов');
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

  // --- Изменение статуса ---
  changeOrderStatus(newStatus: string): void {
    const order = this.selectedOrder();
    if (!order) return;

    if (confirm(`Изменить статус заказа на "${this.translateStatus(newStatus)}"?`)) {
      this.loading.set(true);
      this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
        next: (updatedOrder) => {
          // Обновляем заказ в детальном просмотре
          this.selectedOrder.set(updatedOrder);
          // Обновляем заказ в общем списке
          this.orders.update(list => list.map(o => o.id === updatedOrder.id ? updatedOrder : o));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          alert('Не удалось обновить статус заказа');
        }
      });
    }
  }

  // --- Хелперы для красивого UI ---
  translateStatus(status: string): string {
    const map: Record<string, string> = {
      'Pending': 'Ожидает',
      'Processing': 'В сборке',
      'Shipped': 'Отправлен',
      'Delivered': 'Доставлен',
      'Cancelled': 'Отменен'
    };
    return map[status] || status;
  }

  translatePaymentStatus(status: string): string {
    const map: Record<string, string> = {
      'Pending': 'Не оплачен',
      'Paid': 'Оплачен',
      'Refunded': 'Возврат'
    };
    return map[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'Pending': 'badge-warning',
      'Processing': 'badge-info',
      'Shipped': 'badge-primary',
      'Delivered': 'badge-success',
      'Cancelled': 'badge-danger'
    };
    return map[status] || 'badge-gray';
  }
}
