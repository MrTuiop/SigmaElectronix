import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../services/user-service';
import { ProductService } from '../../../services/product-service';
import { OrderService } from '../../../services/order-service';
import { StoreService } from '../../../services/store-service';
import {
  LucideUsers, LucidePackage, LucideShoppingBag, LucideTrendingUp,
  LucideCreditCard, LucideAlertCircle, LucideArrowUpRight, LucideArrowDownRight,
  LucideActivity, LucideDownload, LucideStore
} from '@lucide/angular';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LucideUsers, LucidePackage, LucideShoppingBag, LucideTrendingUp,
    LucideCreditCard, LucideAlertCircle, LucideArrowUpRight, LucideArrowDownRight,
    LucideActivity, LucideDownload, LucideStore
  ],
  templateUrl: './manager-dashboard.html',
  styleUrl: './manager-dashboard.css'
})
export class ManagerDashboardComponent implements OnInit {
  private userService = inject(UserService);
  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private storeService = inject(StoreService);

  usersCount = signal<number>(0);
  productsCount = signal<number>(0);
  ordersCount = signal<number>(0);
  storesCount = signal<number>(0);

  loading = signal(true);

  // Индекс текущего дня недели (0 = Пн, 6 = Вс)
  currentDayIndex = signal<number>(0);

  ngOnInit(): void {
    // Вычисляем текущий день недели. 
    // В JS getDay() возвращает 0 для Воскресенья, 1 для Пн и т.д.
    // Смещаем, чтобы Пн = 0, Вс = 6.
    const today = new Date().getDay();
    this.currentDayIndex.set((today + 6) % 7);

    // Параллельно загружаем основные метрики
    forkJoin({
      users: this.userService.getAllUsers(),
      products: this.productService.getAdminProducts({ pageNumber: 1, pageSize: 1, searchQuery: '', sortBy: 'date_desc' }),
      orders: this.orderService.getAllOrders(),
      stores: this.storeService.getAllStores(true) // true, чтобы видеть все, включая скрытые
    }).subscribe({
      next: (data) => {
        this.usersCount.set(data.users.length);
        this.productsCount.set(data.products.totalCount);
        this.ordersCount.set(data.orders.length);
        this.storesCount.set(data.stores.length);

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Ошибка загрузки данных дашборда', err);
        this.loading.set(false);
      }
    });
  }
}
