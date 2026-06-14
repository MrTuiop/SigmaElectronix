import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreService } from '../../../services/store-service'; // Проверь путь!
import { StoreDto, CreateStoreDto, StoreType } from '../../../models/store-models'; // Проверь путь!
import {
  LucideMapPin, LucidePlus, LucideEdit2, LucideEye, LucideEyeOff,
  LucideCheck, LucideSearch, LucidePhone, LucideMail
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner'; // Проверь путь!

@Component({
  selector: 'app-manager-stores',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideMapPin, LucidePlus, LucideEdit2, LucideEye, LucideEyeOff,
    LucideCheck, LucideSearch, LucidePhone, LucideMail,
    SpinnerComponent
  ],
  templateUrl: './manager-stores.html',
  styleUrl: './manager-stores.css'
})
export class ManagerStoresComponent implements OnInit {
  private storeService = inject(StoreService);
  private fb = inject(FormBuilder);

  // Состояния
  stores = signal<StoreDto[]>([]);
  loading = signal(false);
  viewMode = signal<'list' | 'form'>('list');
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  searchQuery = signal('');

  storeForm!: FormGroup;

  // Справочник типов магазинов для выпадающего списка
  storeTypes = [
    { value: StoreType.Retail, label: 'Розничный магазин' },
    { value: StoreType.PickupPoint, label: 'Пункт выдачи' },
    { value: StoreType.Warehouse, label: 'Склад' },
    { value: StoreType.ServiceCenter, label: 'Сервисный центр' }
  ];

  // Локальный поиск по загруженным магазинам
  filteredStores = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const all = this.stores();
    if (!query) return all;

    return all.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.cityName.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.initForm();
    this.loadStores();
  }

  initForm(): void {
    this.storeForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9\-_]+$/)]], // Только буквы, цифры и дефис
      cityId: [null, Validators.required], // Пока обычный инпут, позже можно привязать к CityService
      fullAddress: ['', Validators.required],
      latitude: [0, Validators.required],
      longitude: [0, Validators.required],
      phone: ['', Validators.required],
      email: [''],
      workingHours: ['', Validators.required],
      isActive: [true],
      type: [StoreType.Retail, Validators.required]
    });
  }

  loadStores(): void {
    this.loading.set(true);
    // Для админки запрашиваем ВСЕ магазины (includeInactive = true)
    this.storeService.getAllStores(true).subscribe({
      next: (data) => {
        this.stores.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  // --- Навигация ---
  openCreateMode(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.storeForm.reset({ isActive: true, type: StoreType.Retail, latitude: 0, longitude: 0 });
    this.viewMode.set('form');
  }

  closeForm(): void {
    this.viewMode.set('list');
  }

  // --- Редактирование ---
  editStore(store: StoreDto): void {
    this.isEditing.set(true);
    this.editingId.set(store.id);

    // Мапим строковый тип с бэкенда обратно в Enum для формы
    let typeEnum = StoreType.Retail;
    if (store.type === 'PickupPoint') typeEnum = StoreType.PickupPoint;
    if (store.type === 'Warehouse') typeEnum = StoreType.Warehouse;
    if (store.type === 'ServiceCenter') typeEnum = StoreType.ServiceCenter;

    this.storeForm.patchValue({
      name: store.name,
      code: store.code,
      cityId: store.cityId,
      fullAddress: store.fullAddress,
      latitude: store.latitude,
      longitude: store.longitude,
      phone: store.phone,
      email: store.email,
      workingHours: store.workingHours,
      isActive: store.isActive,
      type: typeEnum
    });

    this.viewMode.set('form');
  }

  // --- Сохранение ---
  saveStore(): void {
    if (this.storeForm.invalid) {
      this.storeForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload: CreateStoreDto = {
      ...this.storeForm.value,
      type: Number(this.storeForm.value.type) // Убеждаемся, что отправляем число (Enum)
    };

    if (this.isEditing() && this.editingId()) {
      this.storeService.updateStore(this.editingId()!, payload).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => {
          alert(err.error?.message || 'Ошибка при обновлении');
          this.loading.set(false);
        }
      });
    } else {
      this.storeService.createStore(payload).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => {
          alert(err.error?.message || 'Ошибка при создании');
          this.loading.set(false);
        }
      });
    }
  }

  private onSaveSuccess(): void {
    this.loadStores();
    this.viewMode.set('list');
  }

  // --- Изменение статуса (Мягкое удаление) ---
  toggleStatus(store: StoreDto): void {
    const originalStatus = store.isActive;
    store.isActive = !store.isActive; // Оптимистичный UI

    this.storeService.toggleStoreStatus(store.id).subscribe({
      next: () => { }, // Успешно
      error: () => {
        store.isActive = originalStatus; // Откат при ошибке
        alert('Не удалось изменить статус магазина');
      }
    });
  }

  // Вспомогательный метод для красивого вывода типа
  getTypeLabel(typeStr: string): string {
    switch (typeStr) {
      case 'Retail': return 'Розница';
      case 'PickupPoint': return 'Пункт выдачи';
      case 'Warehouse': return 'Склад';
      case 'ServiceCenter': return 'Сервис';
      default: return typeStr;
    }
  }
}
