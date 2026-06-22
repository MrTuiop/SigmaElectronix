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

@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideMapPin, LucideX, LucideCheck, LucideSearch, LucideBuilding],
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
        // 🛑 ВТОРОЙ ПРЕДОХРАНИТЕЛЬ:
        // Используем untracked, чтобы эффект не перезапускался при изменении currentCityId
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
        this.fallbackToDetection();
      } else {
        const guestCityName = localStorage.getItem('guest_preferred_city_name');
        if (guestCityName) {
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
    // 🛑 Читаем список городов через untracked, чтобы effect не перезапускался при их загрузке!
    const cities = untracked(this.allCities);

    if (cities.length === 0) {
      this.cityService.getAll().subscribe({
        next: (loadedCities) => {
          this.allCities.set(loadedCities);
          this.detectCityFromIp(loadedCities); // Переходим к определению по IP
        },
        error: () => this.applyDefaultCity() // Если бэкенд недоступен
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
          // Не вызываем updateCity(который триггерит БД), а просто локально меняем название для плашки!
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

  confirmDetectedCity(): void {
    this.showConfirmPrompt.set(false);

    this.cityService.getAll().subscribe(cities => {
      const defaultCity = cities.find(c => c.name.toLowerCase() === this.selectedCityName().toLowerCase());
      if (defaultCity) {
        this.currentLocationService.updateCity(defaultCity.id, defaultCity.name);
      } else {
        this.currentLocationService.updateCity(1, this.selectedCityName());
      }
    });
  }

  selectCity(city: CityDto): void {
    this.currentLocationService.updateCity(city.id, city.name);
    this.showModal.set(false);
    this.searchQuery.set('');
  }
}
