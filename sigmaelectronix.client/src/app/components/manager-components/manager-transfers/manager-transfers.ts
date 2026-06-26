import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService } from '../../../services/inventory-service';
import { ProductService } from '../../../services/product-service';
import { StoreService } from '../../../services/store-service';
import { StoreInventoryService } from '../../../services/store-inventory-service';
import { CityService } from '../../../services/city-service';
import { StoreDto } from '../../../models/store-models';
import { StoreInventoryDto } from '../../../models/store-inventory-models';
import { CityDto } from '../../../models/location-models';
import {
  LucideTruck, LucideArrowDownToLine, LucideArrowRightLeft,
  LucideCheck, LucideSearch, LucideChevronDown, LucidePackage, LucideStore, LucideTrash2
} from '@lucide/angular';
import { ToastService } from '../../../services/toast';

@Component({
  selector: 'app-manager-transfers',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideTruck, LucideArrowDownToLine, LucideArrowRightLeft,
    LucideCheck, LucideSearch, LucideChevronDown, LucidePackage, LucideStore, LucideTrash2
  ],
  templateUrl: './manager-transfers.html',
  styleUrl: './manager-transfers.css'
})
export class ManagerTransfersComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  private storeService = inject(StoreService);
  private storeInvService = inject(StoreInventoryService);
  private cityService = inject(CityService);
  private toastService = inject(ToastService); // <-- Инжектим тост-сервис
  private fb = inject(FormBuilder);

  // Состояния UI
  activeTab = signal<'receive' | 'transfer' | 'writeoff'>('receive');
  loading = signal(false);

  // Данные
  stores = signal<StoreDto[]>([]);
  products = signal<any[]>([]);
  cities = signal<CityDto[]>([]);
  productStocks = signal<StoreInventoryDto[]>([]);

  // Формы
  receiveForm!: FormGroup;
  transferForm!: FormGroup;
  writeoffForm!: FormGroup;

  // --- Состояния поиска товаров ---
  productSearch = signal('');
  isProductDropdownOpen = signal(false);
  selectedProductDisplay = signal('');

  filteredProducts = computed(() => {
    const search = this.productSearch().toLowerCase().trim();
    if (!search) return this.products();
    return this.products().filter(p =>
      p.name.toLowerCase().includes(search) ||
      (p.slug && p.slug.toLowerCase().includes(search))
    );
  });

  // --- Состояния поиска магазинов ---
  storeSearch = signal('');
  activeStoreField = signal<'receiveStore' | 'fromStore' | 'toStore' | 'writeoffStore' | null>(null);

  filteredGroupedStores = computed(() => {
    const search = this.storeSearch().toLowerCase().trim();
    const allStores = this.stores();
    const allCities = this.cities();

    const cityMap = new Map<number, CityDto>();
    allCities.forEach(c => cityMap.set(c.id, c));

    const matchedStores = allStores.filter(s => {
      const city = cityMap.get(s.cityId);
      const regionName = city?.regionName || 'Другие регионы';
      return s.name.toLowerCase().includes(search) ||
        s.cityName.toLowerCase().includes(search) ||
        regionName.toLowerCase().includes(search) ||
        s.code.toLowerCase().includes(search);
    });

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


  ngOnInit(): void {
    this.initForms();
    this.loadData();
  }

  initForms(): void {
    this.receiveForm = this.fb.group({
      storeId: [null, Validators.required],
      productId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      referenceId: ['']
    });

    this.transferForm = this.fb.group({
      fromStoreId: [null, Validators.required],
      toStoreId: [null, Validators.required],
      productId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      referenceId: ['']
    });

    this.writeoffForm = this.fb.group({
      storeId: [null, Validators.required],
      productId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      referenceId: ['']
    });
  }

  loadData(): void {
    this.productService.getAdminProducts({ pageNumber: 1, pageSize: 500 }).subscribe({
      next: (res: any) => this.products.set(res.items || res),
      error: (err) => {
        console.error('Ошибка загрузки товаров', err);
        this.toastService.error('Не удалось загрузить список товаров');
      }
    });

    this.storeService.getAllStores(true).subscribe({
      next: (res) => this.stores.set(res),
      error: (err) => {
        console.error('Ошибка загрузки магазинов', err);
        this.toastService.error('Не удалось загрузить список магазинов');
      }
    });

    this.cityService.getAll().subscribe({
      next: (res) => this.cities.set(res),
      error: (err) => {
        console.error('Ошибка загрузки городов', err);
        this.toastService.error('Не удалось загрузить города');
      }
    });
  }

  setTab(tab: 'receive' | 'transfer' | 'writeoff'): void {
    this.activeTab.set(tab);
    this.selectedProductDisplay.set('');
    this.productStocks.set([]);
    this.receiveForm.reset({ quantity: 1 });
    this.transferForm.reset({ quantity: 1 });
    this.writeoffForm.reset({ quantity: 1 });
  }

  // --- Методы для поиска ТОВАРОВ ---
  openProductSearch(): void {
    this.isProductDropdownOpen.set(true);
    this.productSearch.set('');
  }

  closeProductSearch(): void {
    setTimeout(() => this.isProductDropdownOpen.set(false), 200);
  }

  onProductSearch(event: Event): void {
    this.productSearch.set((event.target as HTMLInputElement).value);
    this.isProductDropdownOpen.set(true);
  }

  selectProduct(id: number, name: string): void {
    if (this.activeTab() === 'receive') {
      this.receiveForm.patchValue({ productId: id });
    } else if (this.activeTab() === 'transfer') {
      this.transferForm.patchValue({ productId: id });
    } else {
      this.writeoffForm.patchValue({ productId: id });
    }
    this.selectedProductDisplay.set(name);
    this.isProductDropdownOpen.set(false);

    this.storeInvService.getInventoryByProduct(id).subscribe({
      next: (stocks) => this.productStocks.set(stocks),
      error: () => {
        this.productStocks.set([]);
        this.toastService.error('Не удалось загрузить остатки по товару');
      }
    });
  }

  // --- Методы для поиска МАГАЗИНОВ ---
  openStoreSearch(field: 'receiveStore' | 'fromStore' | 'toStore' | 'writeoffStore'): void {
    this.activeStoreField.set(field);
    this.storeSearch.set('');
  }

  closeStoreSearch(): void {
    setTimeout(() => this.activeStoreField.set(null), 200);
  }

  onStoreSearch(event: Event): void {
    this.storeSearch.set((event.target as HTMLInputElement).value);
  }

  selectStore(storeId: number): void {
    const field = this.activeStoreField();
    if (field === 'receiveStore') {
      this.receiveForm.patchValue({ storeId });
    } else if (field === 'fromStore') {
      this.transferForm.patchValue({ fromStoreId: storeId });
    } else if (field === 'toStore') {
      this.transferForm.patchValue({ toStoreId: storeId });
    } else if (field === 'writeoffStore') {
      this.writeoffForm.patchValue({ storeId });
    }
    this.activeStoreField.set(null);
  }

  getStoreName(storeId: number | null | undefined): string {
    if (!storeId) return '';
    const store = this.stores().find(s => s.id === storeId);
    return store ? `${store.name} (${store.cityName})` : '';
  }

  getStoreStock(storeId: number | string | null | undefined): number {
    if (!storeId) return 0;
    const sId = Number(storeId);
    const stock = this.productStocks().find(s => s.storeId === sId);
    return stock ? stock.quantity : 0;
  }

  // --- Отправка форм ---
  submitReceive(): void {
    if (this.receiveForm.invalid) {
      this.receiveForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.inventoryService.receiveStock(this.receiveForm.value).subscribe({
      next: () => {
        this.toastService.success('Поступление успешно оформлено!');
        this.setTab('receive');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Ошибка при поступлении', err);
        this.toastService.error('Ошибка при оформлении поступления');
        this.loading.set(false);
      }
    });
  }

  submitTransfer(): void {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }
    const val = this.transferForm.value;
    if (val.fromStoreId === val.toStoreId) {
      this.toastService.error('Магазин-отправитель и получатель не могут совпадать!');
      return;
    }
    this.loading.set(true);
    this.inventoryService.transferStock(val).subscribe({
      next: () => {
        this.toastService.success('Перемещение успешно оформлено!');
        this.setTab('transfer');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Ошибка при перемещении', err);
        this.toastService.error('Ошибка при оформлении перемещения');
        this.loading.set(false);
      }
    });
  }

  submitWriteoff(): void {
    if (this.writeoffForm.invalid) {
      this.writeoffForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.inventoryService.writeOffStock(this.writeoffForm.value).subscribe({
      next: () => {
        this.toastService.success('Списание успешно оформлено!');
        this.setTab('writeoff');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Ошибка при списании', err);
        this.toastService.error('Ошибка при списании');
        this.loading.set(false);
      }
    });
  }
}
