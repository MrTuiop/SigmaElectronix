import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreService } from '../../../services/store-service';
import { StoreDto, CreateStoreDto, StoreType } from '../../../models/store-models';
import { CityService } from '../../../services/city-service';
import { CityDto } from '../../../models/location-models';
import {
  LucideMapPin, LucidePlus, LucideEdit2, LucideEye, LucideEyeOff,
  LucideCheck, LucideSearch, LucidePhone, LucideMail, LucideChevronDown
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';

@Component({
  selector: 'app-manager-stores',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideMapPin, LucidePlus, LucideEdit2, LucideEye, LucideEyeOff,
    LucideCheck, LucideSearch, LucidePhone, LucideMail, LucideChevronDown,
    SpinnerComponent
  ],
  templateUrl: './manager-stores.html',
  styleUrl: './manager-stores.css'
})
export class ManagerStoresComponent implements OnInit {
  private storeService = inject(StoreService);
  private cityService = inject(CityService);
  private fb = inject(FormBuilder);

  stores = signal<StoreDto[]>([]);
  loading = signal(false);
  viewMode = signal<'list' | 'form'>('list');
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  searchQuery = signal('');

  storeForm!: FormGroup;

  storeTypes = [
    { value: StoreType.Retail, label: 'Розничный магазин' },
    { value: StoreType.PickupPoint, label: 'Пункт выдачи' },
    { value: StoreType.Warehouse, label: 'Склад' },
    { value: StoreType.ServiceCenter, label: 'Сервисный центр' }
  ];

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

  allCities = signal<CityDto[]>([]);
  citySearch = signal('');
  isCityDropdownOpen = signal(false);
  selectedCityDisplay = signal('');

  groupedCities = computed(() => {
    const query = this.citySearch().toLowerCase().trim();
    const cities = this.allCities();

    const filtered = query
      ? cities.filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.regionName || 'Другие регионы').toLowerCase().includes(query)
      )
      : cities;

    const groups = new Map<string, CityDto[]>();

    filtered.forEach(city => {
      const region = city.regionName || 'Другие регионы';
      if (!groups.has(region)) {
        groups.set(region, []);
      }
      groups.get(region)!.push(city);
    });

    return Array.from(groups.entries())
      .map(([groupName, citiesList]) => ({
        groupName,
        cities: citiesList.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName));
  });

  ngOnInit(): void {
    this.initForm();
    this.loadStores();
    this.loadCities();
  }

  initForm(): void {
    this.storeForm = this.fb.group({
      name: ['', Validators.required],
      cityId: [null, Validators.required],
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
    this.storeService.getAllStores(true).subscribe({
      next: (data) => {
        this.stores.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadCities(): void {
    this.cityService.getAll().subscribe({
      next: (cities) => this.allCities.set(cities),
      error: (err) => console.error('Ошибка загрузки городов', err)
    });
  }

  onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  openCitySearch(): void {
    this.isCityDropdownOpen.set(true);
    this.citySearch.set('');
  }

  closeCitySearch(): void {
    setTimeout(() => this.isCityDropdownOpen.set(false), 200);
  }

  onCitySearch(event: Event): void {
    this.citySearch.set((event.target as HTMLInputElement).value);
    this.isCityDropdownOpen.set(true);
  }

  selectCity(id: number, name: string, regionName: string): void {
    this.storeForm.patchValue({ cityId: id });
    this.selectedCityDisplay.set(`${name} (${regionName})`);
    this.isCityDropdownOpen.set(false);
    this.storeForm.get('cityId')?.markAsTouched();
    this.storeForm.get('cityId')?.updateValueAndValidity();
  }

  openCreateMode(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.storeForm.reset({ isActive: true, type: StoreType.Retail, latitude: 0, longitude: 0 });
    this.selectedCityDisplay.set('');
    this.viewMode.set('form');
  }

  closeForm(): void {
    this.viewMode.set('list');
  }

  // ✅ ИСПРАВЛЕН: используем вспомогательный метод для маппинга строки в enum
  editStore(store: StoreDto): void {
    this.isEditing.set(true);
    this.editingId.set(store.id);

    const typeEnum = this.mapStringToStoreType(store.type);

    this.storeForm.patchValue({
      name: store.name,
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

    const city = this.allCities().find(c => c.id === store.cityId);
    if (city) {
      this.selectedCityDisplay.set(`${city.name} (${city.regionName || 'Другие регионы'})`);
    } else {
      this.selectedCityDisplay.set(store.cityName || 'Выбрать...');
    }

    this.viewMode.set('form');
  }

  // ✅ НОВЫЙ ВСПОМОГАТЕЛЬНЫЙ МЕТОД
  private mapStringToStoreType(typeStr: string): StoreType {
    switch (typeStr) {
      case 'PickupPoint': return StoreType.PickupPoint;
      case 'Warehouse': return StoreType.Warehouse;
      case 'ServiceCenter': return StoreType.ServiceCenter;
      case 'Retail':
      default: return StoreType.Retail;
    }
  }

  saveStore(): void {
    if (this.storeForm.invalid) {
      this.storeForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    let storeCode = `STORE-${Date.now()}`;
    if (this.isEditing() && this.editingId()) {
      const existingStore = this.stores().find(s => s.id === this.editingId());
      if (existingStore && existingStore.code) {
        storeCode = existingStore.code;
      }
    }

    const payload: CreateStoreDto = {
      ...this.storeForm.value,
      code: storeCode,
      type: Number(this.storeForm.value.type)
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

  // ✅ Иммутабельный подход
  toggleStatus(store: StoreDto): void {
    const originalStatus = store.isActive;
    const newStatus = !originalStatus;

    this.stores.update(items =>
      items.map(s => s.id === store.id ? { ...s, isActive: newStatus } : s)
    );

    this.storeService.toggleStoreStatus(store.id).subscribe({
      next: () => {
        // Успех — UI уже обновлён
      },
      error: () => {
        this.stores.update(items =>
          items.map(s => s.id === store.id ? { ...s, isActive: originalStatus } : s)
        );
        alert('Не удалось изменить статус магазина');
      }
    });
  }

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
