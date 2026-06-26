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
import { TranslateService, TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ

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
    SpinnerComponent,
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
  ],
  templateUrl: './public-stores.html',
  styleUrl: './public-stores.css'
})
export class PublicStoresComponent implements OnInit {
  private storeService = inject(StoreService);
  private currentLocationService = inject(CurrentLocationService);
  private translate = inject(TranslateService); // 👈 ИНЖЕКТ СЕРВИСА

  allStores = signal<StoreDto[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');

  currentCityName = computed(() => this.currentLocationService.currentCityName());

  filteredStores = computed(() => {
    const city = this.currentCityName().toLowerCase().trim();
    const query = this.searchQuery().toLowerCase().trim();

    let storesInCity = this.allStores().filter(
      s => s.cityName.toLowerCase() === city && s.isActive
    );

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
        // 👈 ПЕРЕВОДИМ ТЕКСТ ОШИБКИ
        this.error.set(this.translate.instant('STORES.LOAD_ERROR'));
        this.isLoading.set(false);
      }
    });
  }

  // 👈 ПЕРЕВОДИМ ТИПЫ МАГАЗИНОВ
  translateType(type: string): string {
    switch (type) {
      case 'Retail': return this.translate.instant('STORES.TYPE.RETAIL');
      case 'PickupPoint': return this.translate.instant('STORES.TYPE.PICKUP');
      case 'Warehouse': return this.translate.instant('STORES.TYPE.WAREHOUSE');
      case 'ServiceCenter': return this.translate.instant('STORES.TYPE.SERVICE');
      default: return this.translate.instant('STORES.TYPE.DEFAULT');
    }
  }
}
