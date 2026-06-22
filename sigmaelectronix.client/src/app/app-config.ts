import { ApplicationConfig, provideZonelessChangeDetection, LOCALE_ID } from '@angular/core'; // <-- Добавили LOCALE_ID
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common'; // <-- Добавили утилиту регистрации
import localeRu from '@angular/common/locales/ru'; // <-- Импортировали пакет русской локали

import { routes } from './app-routing';
import { authInterceptor } from './interceptors/auth-interceptor';
import { languageInterceptor } from './interceptors/language-interceptor';

// 🎯 Обязательно регистрируем русскую локаль в системе Angular перед объявлением конфига
registerLocaleData(localeRu);

export const appConfig: ApplicationConfig = {
  providers: [
    // 🎯 Задаем глобальный идентификатор локали 'ru-RU' для всего приложения
    { provide: LOCALE_ID, useValue: 'ru-RU' },

    // Включает оптимизацию отслеживания изменений (стандарт для Angular)
    provideZonelessChangeDetection(),

    // Подключает маршрутизацию страниц вашего магазина
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
    ),

    // Подключает HTTP-клиент для отправки запросов на ASP.NET Core бэкенд
    provideHttpClient(withInterceptors([authInterceptor, languageInterceptor]))
  ]
};
