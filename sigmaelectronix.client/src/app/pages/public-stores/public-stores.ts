import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideBuilding, LucideMapPin, LucidePhone, LucideMail,
  LucideClock, LucideSearch, LucideCompass
} from '@lucide/angular';
import { StoreService } from '../../services/store-service';
import { StoreDto } from '../../models/store-models';
import { CurrentLocationService } from '../../services/current-location-service';
import { SpinnerComponent } from '../../components/ui-components/spinner/spinner';

@Component({
  selector: 'app-public-stores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideBuilding,
    LucideMapPin,
    LucidePhone,
    LucideMail,
    LucideClock,
    LucideSearch,
    LucideCompass,
    SpinnerComponent
  ],
  templateUrl: './public-stores.html',
  styleUrl: './public-stores.css'
})
export class PublicStoresComponent implements OnInit {
  private storeService = inject(StoreService);

  // 🔥 Внедряем глобальный сервис
  private currentLocationService = inject(CurrentLocationService);

  allStores = signal<StoreDto[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');

  // 🎯 Теперь мы читаем реактивный Сигнал! Angular сам будет отслеживать изменения.
  currentCityName = computed(() => this.currentLocationService.currentCityName());

  filteredStores = computed(() => {
    const city = this.currentCityName().toLowerCase().trim();
    const query = this.searchQuery().toLowerCase().trim();

    // 1. Мгновенная реактивная фильтрация по городу
    let storesInCity = this.allStores().filter(
      s => s.cityName.toLowerCase() === city && s.isActive
    );

    // 2. Фильтрация по поисковой строке
    if (query) {
      storesInCity = storesInCity.filter(
        s => s.name.toLowerCase().includes(query) ||
          s.fullAddress.toLowerCase().includes(query)
      );
    }

    return storesInCity;
  });

  constructor() {
    effect(() => {
      // Сбрасываем строку поиска при изменении города
      this.currentCityName();
      this.searchQuery.set('');
    });
  }

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.storeService.getAllStores(false).subscribe({
      next: (stores) => {
        this.allStores.set(stores);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Ошибка при загрузке магазинов:', err);
        this.error.set('Не удалось загрузить список магазинов. Пожалуйста, попробуйте позже.');
        this.isLoading.set(false);
      }
    });
  }

  translateType(type: string): string {
    switch (type) {
      case 'Retail': return 'Розничный магазин';
      case 'PickupPoint': return 'Пункт выдачи';
      case 'Warehouse': return 'Магазин-склад';
      case 'ServiceCenter': return 'Сервисный центр';
      default: return 'Точка продаж';
    }
  }
}
