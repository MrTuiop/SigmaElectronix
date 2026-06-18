import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CityDto, CreateUpdateCityDto, RegionDto } from '../../../models/location-models';
import {
  LucideMap, LucidePlus, LucideEdit2, LucideTrash2,
  LucideCheck, LucideSearch, LucideGlobe, LucideChevronDown // <-- Добавили иконку стрелочки
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';
import { RegionService } from '../../../services/region-service';
import { CityService } from '../../../services/city-service';
import { ToastService } from '../../../services/toast'; // <-- Подключили сервис уведомлений

@Component({
  selector: 'app-manager-cities',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideMap, LucidePlus, LucideEdit2, LucideTrash2,
    LucideCheck, LucideSearch, LucideGlobe, LucideChevronDown, // <-- Не забываем провайдить
    SpinnerComponent
  ],
  templateUrl: './manager-cities.html',
  styleUrl: './manager-cities.css'
})
export class ManagerCitiesComponent implements OnInit {
  private cityService = inject(CityService);
  private regionService = inject(RegionService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService); // <-- Инжектим сервис

  // Состояния
  cities = signal<CityDto[]>([]);
  regions = signal<RegionDto[]>([]);

  loading = signal(false);
  viewMode = signal<'list' | 'form'>('list');
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  searchQuery = signal('');

  cityForm!: FormGroup;

  // --- Состояния для Умного поиска регионов ---
  regionSearch = signal('');
  isRegionDropdownOpen = signal(false);
  selectedRegionDisplay = signal('');

  // Умный локальный поиск городов в таблице
  filteredCities = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const all = this.cities();
    if (!query) return all;

    return all.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.regionName.toLowerCase().includes(query)
    );
  });

  // Умная фильтрация регионов в выпадающем списке
  filteredRegions = computed(() => {
    const search = this.regionSearch().toLowerCase().trim();
    if (!search) return this.regions();
    return this.regions().filter(r => r.name.toLowerCase().includes(search));
  });

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  initForm(): void {
    this.cityForm = this.fb.group({
      name: ['', Validators.required],
      regionId: [null, Validators.required],
      latitude: [0, Validators.required],
      longitude: [0, Validators.required],
      timeZone: ['Europe/Moscow'] // По умолчанию
    });
  }

  loadData(): void {
    this.loading.set(true);

    // Загружаем регионы для селекта
    this.regionService.getAll().subscribe(res => this.regions.set(res));

    this.cityService.getAll().subscribe({
      next: (data) => {
        this.cities.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Не удалось загрузить города');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  // --- Управление умным селектом Регионов ---
  openRegionSearch(): void {
    this.isRegionDropdownOpen.set(true);
    this.regionSearch.set('');
  }

  closeRegionSearch(): void {
    setTimeout(() => this.isRegionDropdownOpen.set(false), 200);
  }

  onRegionSearch(event: Event): void {
    this.regionSearch.set((event.target as HTMLInputElement).value);
    this.isRegionDropdownOpen.set(true);
  }

  selectRegion(id: number, name: string): void {
    this.cityForm.patchValue({ regionId: id });
    this.selectedRegionDisplay.set(name);
    this.isRegionDropdownOpen.set(false);
    this.cityForm.get('regionId')?.updateValueAndValidity();
  }

  // --- Навигация ---
  openCreateMode(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.cityForm.reset({ latitude: 0, longitude: 0, timeZone: 'Europe/Moscow' });
    this.selectedRegionDisplay.set(''); // Очищаем название региона
    this.viewMode.set('form');
  }

  closeForm(): void {
    this.viewMode.set('list');
  }

  // --- Редактирование ---
  editCity(city: CityDto): void {
    this.isEditing.set(true);
    this.editingId.set(city.id);

    this.cityForm.patchValue({
      name: city.name,
      regionId: city.regionId,
      latitude: city.latitude,
      longitude: city.longitude,
      timeZone: city.timeZone
    });

    this.selectedRegionDisplay.set(city.regionName || ''); // Восстанавливаем показ региона

    this.viewMode.set('form');
  }

  // --- Сохранение ---
  saveCity(): void {
    if (this.cityForm.invalid) {
      this.cityForm.markAllAsTouched();
      this.toastService.error('Пожалуйста, заполните все обязательные поля корректно.');
      return;
    }

    this.loading.set(true);
    const payload: CreateUpdateCityDto = {
      ...this.cityForm.value,
      regionId: Number(this.cityForm.value.regionId)
    };

    if (this.isEditing() && this.editingId()) {
      this.cityService.update(this.editingId()!, payload).subscribe({
        next: () => {
          this.toastService.success('Город успешно обновлен');
          this.onSaveSuccess();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Ошибка при обновлении города');
          this.loading.set(false);
        }
      });
    } else {
      this.cityService.create(payload).subscribe({
        next: () => {
          this.toastService.success('Город успешно добавлен');
          this.onSaveSuccess();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Ошибка при создании города');
          this.loading.set(false);
        }
      });
    }
  }

  private onSaveSuccess(): void {
    this.loadData();
    this.viewMode.set('list');
  }

  // --- Удаление ---
  deleteCity(id: number, name: string): void {
    if (confirm(`Удалить город "${name}"?\nЭто действие нельзя отменить.`)) {
      this.loading.set(true);
      this.cityService.delete(id).subscribe({
        next: () => {
          this.toastService.success(`Город "${name}" успешно удален`);
          this.loadData();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Невозможно удалить город. Возможно, к нему привязаны магазины или адреса.');
          this.loading.set(false);
        }
      });
    }
  }
}
