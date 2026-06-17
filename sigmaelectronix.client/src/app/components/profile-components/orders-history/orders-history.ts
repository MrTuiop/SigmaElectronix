import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucidePackage,
  LucideChevronDown,
  LucideChevronUp,
  LucideMapPin,
  LucideCreditCard,
  LucideReceipt,
  LucideLoader2
} from '@lucide/angular';
import { OrderService } from '../../../services/order-service';
import { OrderDto } from '../../../models/order-model';

@Component({
  selector: 'app-orders-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucidePackage,
    LucideChevronDown,
    LucideChevronUp,
    LucideMapPin,
    LucideCreditCard,
    LucideReceipt,
    LucideLoader2
  ],
  templateUrl: './orders-history.html',
  styleUrl: './orders-history.css',
})
export class OrdersHistoryComponent implements OnInit {
  private orderService = inject(OrderService);

  // 🔹 Сигналы для списка заказов
  ordersList = signal<any[]>([]);
  isLoadingOrders = signal(true);

  // ID открытого заказа (аккордеон)
  expandedOrderId = signal<string | null>(null);

  // Кэш для деталей заказов
  orderDetails = signal<Map<string, OrderDto>>(new Map());
  isLoadingDetails = signal(false);

  // Вычисляем детали текущего открытого заказа
  currentOrderDetails = computed(() => {
    const id = this.expandedOrderId();
    return id ? this.orderDetails().get(id) : null;
  });

  ngOnInit(): void {
    this.loadMyOrders();
  }

  // 🔹 Загружаем список заказов пользователя
  loadMyOrders() {
    this.isLoadingOrders.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        // Преобразуем данные с бэкенда для красивого отображения в списке
        const mappedOrders = orders.map(o => ({
          ...o,
          date: new Date(o.createdAt).toLocaleDateString('ru-RU'),
          statusColor: this.getStatusColor(o.status),
          statusName: this.getStatusName(o.status),
          // Считаем общее количество товаров в заказе
          itemsCount: o.items ? o.items.reduce((sum, i) => sum + i.quantity, 0) : 0
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

  // 🔹 Перевод способа оплаты
  getPaymentMethodName(method: string): string {
    const methods: Record<string, string> = {
      'Online': 'Картой онлайн',
      'InStore': 'В магазине при получении',
      'CashOnDelivery': 'При получении',
      'Card': 'Банковская карта',
      'Cash': 'Наличными при получении',
      'Wallet': 'Кошелек'
    };
    return methods[method] || method;
  }

  // 🔹 НОВОЕ: Перевод статуса оплаты
  getPaymentStatusName(status: string): string {
    const map: Record<string, string> = {
      'Pending': 'Ожидает оплаты',
      'Paid': 'Оплачено',
      'Failed': 'Ошибка оплаты',
      'Refunded': 'Возврат средств',
      'Expired': 'Истёк резерв'
    };
    return map[status] || status;
  }

  // 🔹 Красивые цвета для статусов с C# Enum
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Pending': '#f59e0b',    // Желтый (Ожидает)
      'Paid': '#10b981',       // Зеленый (Оплачен)
      'Confirmed': '#0ea5e9',  // Голубой (Подтвержден)
      'Processing': '#8b5cf6', // Фиолетовый (В сборке)
      'Shipped': '#6366f1',    // Индиго (Отправлен)
      'Delivered': '#10b981',  // Зеленый (Доставлен)
      'Cancelled': '#ef4444',  // Красный (Отменен)
      'Refunded': '#6b7280'    // Серый (Возврат)
    };
    return colors[status] ?? '#6b7280';
  }

  // 🔹 Перевод статусов на русский (полный список)
  getStatusName(status: string): string {
    const names: Record<string, string> = {
      'Pending': 'Ожидает',
      'Paid': 'Оплачен',
      'Confirmed': 'Подтверждён',
      'Processing': 'В сборке',
      'Shipped': 'Отправлен',
      'Delivered': 'Доставлен',
      'Cancelled': 'Отменён',
      'Refunded': 'Возврат средств'
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
