import { Injectable, signal, inject, untracked } from '@angular/core';
import { ProfileService } from './profile-service';

@Injectable({ providedIn: 'root' })
export class CurrentLocationService {
  private profileService = inject(ProfileService);

  // 🎯 Единые реактивные сигналы для всего приложения
  readonly currentCityName = signal<string>(localStorage.getItem('guest_preferred_city_name') || 'Москва');
  readonly currentCityId = signal<number>(Number(localStorage.getItem('guest_preferred_city_id')) || 1);

  // 🔥 Метод для изменения города из любой точки приложения
  updateCity(cityId: number, cityName: string): void {
    // 🛑 ГЛАВНЫЙ ПРЕДОХРАНИТЕЛЬ: Блокируем бесконечный цикл
    if (this.currentCityId() === cityId) {
      return;
    }

    this.currentCityId.set(cityId);
    this.currentCityName.set(cityName);

    // Сохраняем для гостей локально
    localStorage.setItem('guest_preferred_city_id', cityId.toString());
    localStorage.setItem('guest_preferred_city_name', cityName);

    // Если пользователь авторизован и у него в профиле другой город — обновляем на сервере
    const user = this.profileService.user();
    if (user && user.preferredCityId !== cityId) {
      this.profileService.updatePreferredCity(cityId).subscribe();
    }
  }
}
