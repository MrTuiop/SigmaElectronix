import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app-routing';

export const appConfig: ApplicationConfig = {
  providers: [
    // Включает оптимизацию отслеживания изменений (стандарт для Angular)
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Подключает маршрутизацию страниц вашего магазина
    provideRouter(routes),

    // Подключает HTTP-клиент для отправки запросов на ASP.NET Core бэкенд
    provideHttpClient()
  ]
};
