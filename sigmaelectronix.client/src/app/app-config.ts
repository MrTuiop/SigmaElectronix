import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app-routing';
import { authInterceptor } from './interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Включает оптимизацию отслеживания изменений (стандарт для Angular)
    provideZonelessChangeDetection(),

    // Подключает маршрутизацию страниц вашего магазина
    provideRouter(routes),

    // Подключает HTTP-клиент для отправки запросов на ASP.NET Core бэкенд
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
