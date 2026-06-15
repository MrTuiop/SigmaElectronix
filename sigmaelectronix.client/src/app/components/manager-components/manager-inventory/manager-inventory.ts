import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Сервисы
import { StoreInventoryService } from '../../../services/store-inventory-service';
import { StoreService } from '../../../services/store-service';
import { ProductService } from '../../../services/product-service'; // <-- Добавляем сервис товаров

// Модели
import { StoreInventoryDto, TransactionHistoryDto } from '../../../models/store-inventory-models';
import { StoreDto } from '../../../models/store-models';
import { ProductListDto } from '../../../models/product-models'; // <-- Добавляем DTO товаров

import {
  LucideBoxes, LucideStore, LucidePackage, LucideSearch,
  LucideHistory, LucideX, LucideArrowRight, LucideCheckCircle2, LucideAlertCircle
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';

@Component({
  selector: 'app-manager-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideBoxes, LucideStore, LucidePackage, LucideSearch,
    LucideHistory, LucideX, LucideArrowRight, LucideCheckCircle2, LucideAlertCircle,
    SpinnerComponent
  ],
  templateUrl: './manager-inventory.html',
  styleUrl: './manager-inventory.css'
})
export class ManagerInventoryComponent implements OnInit {
  private inventoryService = inject(StoreInventoryService);
  private storeService = inject(StoreService);
  private productService = inject(ProductService); // <-- Инжектируем сервис товаров

  viewMode = signal<'store' | 'product'>('store');

  selectedStoreId = signal<number | null>(null);
  selectedProductId = signal<number | null>(null);

  inventory = signal<StoreInventoryDto[]>([]);
  loading = signal(false);

  // Сигналы для выпадающих списков
  availableStores = signal<StoreDto[]>([]);
  availableProducts = signal<ProductListDto[]>([]); // <-- Теперь здесь реальные товары!

  historyData = signal<TransactionHistoryDto[]>([]);
  isHistoryLoading = signal(false);
  selectedHistoryItem = signal<StoreInventoryDto | null>(null);

  ngOnInit(): void {
    this.loadStores();
    this.loadProducts(); // <-- Вызываем загрузку товаров при старте
  }

  loadStores(): void {
    this.storeService.getAllStores(false).subscribe({
      next: (stores) => {
        this.availableStores.set(stores);
        if (stores.length > 0) {
          this.selectedStoreId.set(stores[0].id);
          this.loadData();
        }
      },
      error: (err) => console.error('Ошибка при загрузке магазинов:', err)
    });
  }

  // 🔹 Метод для загрузки списка товаров
  loadProducts(): void {
    // Берем первые 100 товаров для выпадающего списка (чтобы не перегрузить селект)
    this.productService.getAdminProducts({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (res) => {
        this.availableProducts.set(res.items);
      },
      error: (err) => console.error('Ошибка при загрузке товаров:', err)
    });
  }

  setMode(mode: 'store' | 'product'): void {
    this.viewMode.set(mode);
    this.inventory.set([]);
  }

  loadData(): void {
    this.loading.set(true);

    if (this.viewMode() === 'store' && this.selectedStoreId()) {
      this.inventoryService.getInventoryByStore(this.selectedStoreId()!).subscribe({
        next: (data) => {
          this.inventory.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else if (this.viewMode() === 'product' && this.selectedProductId()) {
      this.inventoryService.getInventoryByProduct(this.selectedProductId()!).subscribe({
        next: (data) => {
          this.inventory.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.loading.set(false);
    }
  }

  toggleReservable(item: StoreInventoryDto): void {
    const originalStatus = item.isReservable;
    item.isReservable = !item.isReservable;

    this.inventoryService.updateReservableStatus(item.storeId, item.productId, item.isReservable)
      .subscribe({
        next: () => { },
        error: () => {
          item.isReservable = originalStatus;
          alert('Не удалось изменить статус резервирования');
        }
      });
  }

  openHistory(item: StoreInventoryDto): void {
    this.selectedHistoryItem.set(item);
    this.isHistoryLoading.set(true);

    this.inventoryService.getProductHistory(item.storeId, item.productId).subscribe({
      next: (history) => {
        this.historyData.set(history);
        this.isHistoryLoading.set(false);
      },
      error: () => {
        alert('Не удалось загрузить историю');
        this.isHistoryLoading.set(false);
        this.closeHistory();
      }
    });
  }

  closeHistory(): void {
    this.selectedHistoryItem.set(null);
    this.historyData.set([]);
  }

  formatTransactionType(type: string): { label: string, color: string } {
    const t = type.toUpperCase();
    if (t.includes('IN') || t === 'ПРИХОД') return { label: 'Поступление', color: '#10b981' };
    if (t.includes('OUT') || t.includes('SALE') || t === 'РАСХОД') return { label: 'Списание/Продажа', color: '#ef4444' };
    if (t.includes('RESERVE')) return { label: 'Резерв', color: '#f59e0b' };
    return { label: type, color: '#6b7280' };
  }
}
