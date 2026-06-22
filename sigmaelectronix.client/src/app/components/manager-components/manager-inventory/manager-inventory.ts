import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Сервисы
import { StoreInventoryService } from '../../../services/store-inventory-service';
import { StoreService } from '../../../services/store-service';
import { ProductService } from '../../../services/product-service';
import { CityService } from '../../../services/city-service';
import { ToastService } from '../../../services/toast';

// Модели
import { StoreInventoryDto, TransactionHistoryDto } from '../../../models/store-inventory-models';
import { StoreDto } from '../../../models/store-models';
import { ProductListDto } from '../../../models/product-models';
import { CityDto } from '../../../models/location-models';

import {
  LucideBoxes, LucideStore, LucidePackage, LucideSearch,
  LucideHistory, LucideX, LucideArrowRight, LucideCheckCircle2, LucideAlertCircle,
  LucideShoppingBag, LucideTruck, LucideArrowDownToLine, LucideChevronDown
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';

@Component({
  selector: 'app-manager-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideBoxes, LucideStore, LucidePackage, LucideSearch,
    LucideHistory, LucideX, LucideArrowRight, LucideCheckCircle2,
    LucideAlertCircle, LucideShoppingBag, LucideTruck, LucideArrowDownToLine,
    LucideChevronDown,
    SpinnerComponent
  ],
  templateUrl: './manager-inventory.html',
  styleUrl: './manager-inventory.css'
})
export class ManagerInventoryComponent implements OnInit {
  private inventoryService = inject(StoreInventoryService);
  private storeService = inject(StoreService);
  private productService = inject(ProductService);
  private cityService = inject(CityService);
  private toastService = inject(ToastService);

  viewMode = signal<'store' | 'product'>('store');

  selectedStoreId = signal<number | null>(null);
  selectedProductId = signal<number | null>(null);

  inventory = signal<StoreInventoryDto[]>([]);
  loading = signal(false);

  availableStores = signal<StoreDto[]>([]);
  availableProducts = signal<readonly ProductListDto[]>([]); // ✅ Добавлен readonly
  cities = signal<CityDto[]>([]);

  // --- Состояния умных списков ---
  storeSearch = signal('');
  isStoreDropdownOpen = signal(false);
  selectedStoreDisplay = signal('');

  productSearch = signal('');
  isProductDropdownOpen = signal(false);
  selectedProductDisplay = signal('');

  // --- История ---
  historyData = signal<TransactionHistoryDto[]>([]);
  isHistoryLoading = signal(false);
  selectedHistoryItem = signal<StoreInventoryDto | null>(null);

  // 🎯 1. Умная группировка МАГАЗИНОВ (Регион -> Город)
  filteredGroupedStores = computed(() => {
    const search = this.storeSearch().toLowerCase().trim();
    const allStores = this.availableStores();
    const allCities = this.cities();

    const cityMap = new Map<number, CityDto>();
    allCities.forEach(c => cityMap.set(c.id, c));

    // Фильтруем
    const matchedStores = allStores.filter(s => {
      const city = cityMap.get(s.cityId);
      const regionName = city?.regionName || 'Другие регионы';
      return s.name.toLowerCase().includes(search) ||
        s.cityName.toLowerCase().includes(search) ||
        regionName.toLowerCase().includes(search) ||
        s.code.toLowerCase().includes(search);
    });

    // Группируем
    const regionMap = new Map<string, Map<string, StoreDto[]>>();
    matchedStores.forEach(s => {
      const city = cityMap.get(s.cityId);
      const regionName = city?.regionName || 'Другие регионы';
      const cityName = s.cityName || 'Неизвестный город';

      if (!regionMap.has(regionName)) {
        regionMap.set(regionName, new Map<string, StoreDto[]>());
      }
      const cityMapGroup = regionMap.get(regionName)!;

      if (!cityMapGroup.has(cityName)) {
        cityMapGroup.set(cityName, []);
      }
      cityMapGroup.get(cityName)!.push(s);
    });

    return Array.from(regionMap.entries()).map(([regionName, cityMapGroup]) => ({
      regionName,
      cities: Array.from(cityMapGroup.entries()).map(([cityName, storeList]) => ({
        cityName,
        stores: storeList.sort((a, b) => a.name.localeCompare(b.name))
      })).sort((a, b) => a.cityName.localeCompare(b.cityName))
    })).sort((a, b) => a.regionName.localeCompare(b.regionName));
  });

  // 🎯 2. Умная группировка ТОВАРОВ (по Категории)
  filteredGroupedProducts = computed(() => {
    const search = this.productSearch().toLowerCase().trim();
    const allProducts = this.availableProducts();

    const matchedProducts = allProducts.filter(p =>
      p.name.toLowerCase().includes(search) ||
      (p.slug && p.slug.toLowerCase().includes(search)) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(search))
    );

    const groupMap = new Map<string, ProductListDto[]>();
    matchedProducts.forEach(p => {
      const catName = p.categoryName || 'Без категории';
      if (!groupMap.has(catName)) {
        groupMap.set(catName, []);
      }
      groupMap.get(catName)!.push(p);
    });

    return Array.from(groupMap.entries()).map(([categoryName, products]) => ({
      categoryName,
      products: products.sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  });


  ngOnInit(): void {
    this.loadCitiesAndStores();
    this.loadProducts();
  }

  loadCitiesAndStores(): void {
    this.cityService.getAll().subscribe(cities => {
      this.cities.set(cities);

      this.storeService.getAllStores(false).subscribe({
        next: (stores) => {
          this.availableStores.set(stores);
          if (stores.length > 0) {
            const defaultStore = stores[0];
            this.selectedStoreId.set(defaultStore.id);
            this.selectedStoreDisplay.set(`${defaultStore.name} (${defaultStore.cityName})`);
            this.loadData();
          }
        },
        error: (err) => {
          console.error('Ошибка при загрузке магазинов:', err);
          this.toastService.error('Не удалось загрузить список магазинов');
        }
      });
    });
  }

  loadProducts(): void {
    this.productService.getAdminProducts({ pageNumber: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        this.availableProducts.set(res.items);
      },
      error: (err) => {
        console.error('Ошибка при загрузке товаров:', err);
        this.toastService.error('Не удалось загрузить список товаров');
      }
    });
  }

  setMode(mode: 'store' | 'product'): void {
    this.viewMode.set(mode);
    this.inventory.set([]);
  }

  // --- Управление селектом Магазинов ---
  openStoreSearch(): void {
    this.isStoreDropdownOpen.set(true);
    this.storeSearch.set('');
  }
  closeStoreSearch(): void {
    setTimeout(() => this.isStoreDropdownOpen.set(false), 200);
  }
  selectStore(store: StoreDto): void {
    this.selectedStoreId.set(store.id);
    this.selectedStoreDisplay.set(`${store.name} (${store.cityName})`);
    this.isStoreDropdownOpen.set(false);
    this.loadData();
  }

  // --- Управление селектом Товаров ---
  openProductSearch(): void {
    this.isProductDropdownOpen.set(true);
    this.productSearch.set('');
  }
  closeProductSearch(): void {
    setTimeout(() => this.isProductDropdownOpen.set(false), 200);
  }
  selectProduct(product: ProductListDto): void {
    this.selectedProductId.set(product.id);
    this.selectedProductDisplay.set(product.name);
    this.isProductDropdownOpen.set(false);
    this.loadData();
  }


  loadData(): void {
    this.loading.set(true);

    if (this.viewMode() === 'store' && this.selectedStoreId()) {
      this.inventoryService.getInventoryByStore(this.selectedStoreId()!).subscribe({
        next: (data) => {
          this.inventory.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toastService.error('Ошибка при загрузке остатков');
        }
      });
    } else if (this.viewMode() === 'product' && this.selectedProductId()) {
      this.inventoryService.getInventoryByProduct(this.selectedProductId()!).subscribe({
        next: (data) => {
          this.inventory.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toastService.error('Ошибка при загрузке остатков');
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  // ✅ ИСПРАВЛЕННЫЙ МЕТОД (иммутабельный подход)
  toggleReservable(item: StoreInventoryDto): void {
    const originalStatus = item.isReservable;
    const newStatus = !originalStatus;

    // Оптимистичный UI: создаём НОВЫЙ массив с обновлённым элементом
    this.inventory.update(items =>
      items.map(i => i.id === item.id ? { ...i, isReservable: newStatus } : i)
    );

    this.inventoryService.updateReservableStatus(item.storeId, item.productId, newStatus)
      .subscribe({
        next: () => {
          const statusText = newStatus ? 'разрешен' : 'запрещен';
          this.toastService.success(`Резерв для товара ${statusText}`);
        },
        error: () => {
          // Откат: создаём новый массив с исходным статусом
          this.inventory.update(items =>
            items.map(i => i.id === item.id ? { ...i, isReservable: originalStatus } : i)
          );
          this.toastService.error('Не удалось изменить статус резервирования');
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
        this.toastService.error('Не удалось загрузить историю движения товара');
        this.isHistoryLoading.set(false);
        this.closeHistory();
      }
    });
  }

  closeHistory(): void {
    this.selectedHistoryItem.set(null);
    this.historyData.set([]);
  }

  formatTransactionType(type: string): { label: string; color: string } {
    switch (type) {
      case 'Receipt':
        return { label: 'Поступление от поставщика', color: '#10b981' };
      case 'Sale':
        return { label: 'Продажа (Заказ)', color: '#3b82f6' };
      case 'Return':
        return { label: 'Возврат от покупателя', color: '#8b5cf6' };
      case 'TransferOut':
        return { label: 'Перемещение (Отправлено)', color: '#f59e0b' };
      case 'TransferIn':
        return { label: 'Перемещение (Принято)', color: '#0ea5e9' };
      case 'Adjustment':
        return { label: 'Корректировка остатков', color: '#6b7280' };
      case 'WriteOff':
        return { label: 'Списание (Брак/Утеря)', color: '#ef4444' };
      default:
        return { label: type || 'Неизвестная операция', color: '#9ca3af' };
    }
  }
}
