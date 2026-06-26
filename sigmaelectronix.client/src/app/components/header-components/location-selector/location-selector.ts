import { Component, OnInit, signal, computed, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  LucideMapPin, LucideX, LucideCheck, LucideSearch, LucideBuilding
} from '@lucide/angular';
import { ProfileService } from '../../../services/profile-service';
import { CityDto } from '../../../models/location-models';
import { CityService } from '../../../services/city-service';
import { CurrentLocationService } from '../../../services/current-location-service';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideMapPin, LucideX, LucideCheck, LucideSearch, LucideBuilding, TranslateDirective, TranslatePipe],
  templateUrl: './location-selector.html',
  styleUrl: './location-selector.css'
})
export class LocationSelectorComponent implements OnInit {
  private cityService = inject(CityService);
  private profileService = inject(ProfileService);
  private http = inject(HttpClient);
  private currentLocationService = inject(CurrentLocationService);

  isDetecting = signal(true);
  showConfirmPrompt = signal(false);
  showModal = signal(false);
  searchQuery = signal('');

  // Связываем отображаемое имя напрямую с глобальным стейтом
  selectedCityName = this.currentLocationService.currentCityName;
  allCities = signal<CityDto[]>([]);

  filteredCities = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.allCities();

    return this.allCities().filter(c => {
      const matchCity = c.name.toLowerCase().includes(query);
      const matchRegion = (c.regionName || 'Другие регионы').toLowerCase().includes(query);
      return matchCity || matchRegion;
    });
  });

  groupedCities = computed(() => {
    const cities = this.filteredCities();
    const groups: Record<string, CityDto[]> = {};

    cities.forEach(city => {
      const region = city.regionName || 'Другие регионы';
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(city);
    });

    return groups;
  });

  regionNames = computed(() => Object.keys(this.groupedCities()));

  constructor() {
    effect(() => {
      const user = this.profileService.user();

      if (user && user.preferredCityId) {
        // 1. АВТОРИЗОВАННЫЙ ПОЛЬЗОВАТЕЛЬ С ВЫБРАННЫМ ГОРОДОМ
        const globalCityId = untracked(this.currentLocationService.currentCityId);

        // Если город в профиле УЖЕ совпадает с тем, что мы отображаем — обрываем цикл
        if (globalCityId === user.preferredCityId) {
          this.showConfirmPrompt.set(false);
          this.isDetecting.set(false);
          return;
        }

        this.cityService.getById(user.preferredCityId).subscribe({
          next: (city) => {
            this.currentLocationService.updateCity(city.id, city.name);
            this.showConfirmPrompt.set(false);
            this.isDetecting.set(false);
          },
          error: () => this.fallbackToDetection()
        });
      } else if (user) {
        // Авторизован, но город не выбран
        this.fallbackToDetection();
      } else {
        // 2. ГОСТЬ
        const guestCityName = localStorage.getItem('guest_preferred_city_name');
        const guestCityIdStr = localStorage.getItem('guest_preferred_city_id');

        if (guestCityName && guestCityIdStr) {
          // Восстанавливаем сохраненный город для гостя (без запросов)
          untracked(() => {
            this.currentLocationService.updateCity(parseInt(guestCityIdStr, 10), guestCityName);
          });
          this.showConfirmPrompt.set(false);
          this.isDetecting.set(false);
        } else {
          this.fallbackToDetection();
        }
      }
    });
  }

  ngOnInit(): void { }

  private fallbackToDetection(): void {
    const cities = untracked(this.allCities);

    if (cities.length === 0) {
      this.cityService.getAll().subscribe({
        next: (loadedCities) => {
          this.allCities.set(loadedCities);
          this.detectCityFromIp(loadedCities);
        },
        error: () => this.applyDefaultCity()
      });
    } else {
      this.detectCityFromIp(cities);
    }
  }

  private detectCityFromIp(availableCities: CityDto[]): void {
    this.http.get<any>('https://api.sypexgeo.net/json/').subscribe({
      next: (data) => {
        const detectedName = data?.city?.name_ru;
        const cityExistsInDb = availableCities.some(
          c => c.name.toLowerCase() === detectedName?.toLowerCase()
        );

        if (detectedName && cityExistsInDb) {
          this.selectedCityName.set(detectedName);
        } else {
          this.selectedCityName.set('Москва');
        }

        this.showConfirmPrompt.set(true);
        this.isDetecting.set(false);
      },
      error: () => this.applyDefaultCity()
    });
  }

  private applyDefaultCity(): void {
    this.selectedCityName.set('Москва');
    this.showConfirmPrompt.set(true);
    this.isDetecting.set(false);
  }

  openModal(): void {
    this.showConfirmPrompt.set(false);
    this.showModal.set(true);

    if (this.allCities().length === 0) {
      this.cityService.getAll().subscribe({
        next: (cities) => this.allCities.set(cities),
        error: (err) => console.error('Ошибка загрузки городов', err)
      });
    }
  }

  // Подтверждение города из плашки
  confirmDetectedCity(): void {
    this.showConfirmPrompt.set(false);

    this.cityService.getAll().subscribe(cities => {
      const defaultCity = cities.find(c => c.name.toLowerCase() === this.selectedCityName().toLowerCase());
      if (defaultCity) {
        this.saveCitySelection(defaultCity.id, defaultCity.name);
      } else {
        this.saveCitySelection(1, this.selectedCityName());
      }
    });
  }

  // Выбор города из модального окна
  selectCity(city: CityDto): void {
    this.saveCitySelection(city.id, city.name);
    this.showModal.set(false);
    this.searchQuery.set('');
  }

  // 🚀 ГЛАВНЫЙ МЕТОД СОХРАНЕНИЯ: обновляет глобальный стейт, БД и LocalStorage
  private saveCitySelection(cityId: number, cityName: string): void {
    // 1. Обновляем глобальное состояние для всего сайта
    this.currentLocationService.updateCity(cityId, cityName);

    // 2. Сохраняем в зависимости от статуса пользователя
    if (this.profileService.user()) {
      this.profileService.updatePreferredCity(cityId).subscribe();
    } else {
      localStorage.setItem('guest_preferred_city_id', cityId.toString());
      localStorage.setItem('guest_preferred_city_name', cityName);
    }

    // 3. Выстреливаем глобальное событие (чтобы страница магазинов отреагировала мгновенно)
    window.dispatchEvent(new Event('cityChanged'));
  }
}
