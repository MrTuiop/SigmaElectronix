import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Импортируем сервисы и модели
import { InventoryService } from '../../../services/inventory-service';
import { ProductService } from '../../../services/product-service';
import { StoreService } from '../../../services/store-service';
import { StoreDto } from '../../../models/store-models';

import {
  LucideTruck, LucideArrowDownToLine, LucideArrowRightLeft,
  LucideCheck, LucideSearch, LucideChevronDown, LucidePackage, LucideStore
} from '@lucide/angular';

@Component({
  selector: 'app-manager-transfers',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideTruck, LucideArrowDownToLine, LucideArrowRightLeft,
    LucideCheck, LucideSearch, LucideChevronDown, LucidePackage, LucideStore
  ],
  templateUrl: './manager-transfers.html',
  styleUrl: './manager-transfers.css'
})
export class ManagerTransfersComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  private storeService = inject(StoreService); // <-- Включили StoreService
  private fb = inject(FormBuilder);

  // Состояния UI
  activeTab = signal<'receive' | 'transfer'>('receive');
  loading = signal(false);

  // Списки для выпадающих меню
  stores = signal<StoreDto[]>([]); // <-- Строгая типизация
  products = signal<any[]>([]);

  // Формы
  receiveForm!: FormGroup;
  transferForm!: FormGroup;

  // --- Состояния умного поиска товаров ---
  productSearch = signal('');
  isProductDropdownOpen = signal(false);
  selectedProductDisplay = signal('');

  filteredProducts = computed(() => {
    const search = this.productSearch().toLowerCase().trim();
    if (!search) return this.products();
    return this.products().filter(p =>
      p.name.toLowerCase().includes(search) ||
      (p.sku && p.sku.toLowerCase().includes(search))
    );
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
  }

  loadData(): void {
    // 1. Загружаем товары для выбора
    this.productService.getAdminProducts({ pageNumber: 1, pageSize: 500 }).subscribe({
      next: (res: any) => this.products.set(res.items || res),
      error: (err) => console.error('Ошибка загрузки товаров', err)
    });

    // 2. Загружаем РЕАЛЬНЫЕ магазины
    // Передаем true, чтобы можно было оформить вывоз товара даже из закрытой точки
    this.storeService.getAllStores(true).subscribe({
      next: (res) => this.stores.set(res),
      error: (err) => console.error('Ошибка загрузки магазинов', err)
    });
  }

  setTab(tab: 'receive' | 'transfer'): void {
    this.activeTab.set(tab);
    this.selectedProductDisplay.set('');
    this.receiveForm.reset({ quantity: 1 });
    this.transferForm.reset({ quantity: 1 });
  }

  // --- Умный поиск товаров ---
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
    } else {
      this.transferForm.patchValue({ productId: id });
    }
    this.selectedProductDisplay.set(name);
    this.isProductDropdownOpen.set(false);
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
        alert('Поступление успешно оформлено!');
        this.receiveForm.reset({ quantity: 1 });
        this.selectedProductDisplay.set('');
        this.loading.set(false);
      },
      error: () => {
        alert('Ошибка при оформлении поступления');
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
      alert('Магазин-отправитель и магазин-получатель не могут совпадать!');
      return;
    }

    this.loading.set(true);
    this.inventoryService.transferStock(val).subscribe({
      next: () => {
        alert('Перемещение успешно оформлено!');
        this.transferForm.reset({ quantity: 1 });
        this.selectedProductDisplay.set('');
        this.loading.set(false);
      },
      error: () => {
        alert('Ошибка при оформлении перемещения');
        this.loading.set(false);
      }
    });
  }
}
