import { ApplicationConfig, provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { routes } from './app-routing';
import { authInterceptor } from './interceptors/auth-interceptor';
import { languageInterceptor } from './interceptors/language-interceptor';

// 🚀 Новые импорты для ngx-translate (v18+)
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

// 🎯 Обязательно регистрируем русскую локаль в системе Angular (для DatePipe, CurrencyPipe и т.д.)
registerLocaleData(localeRu);

export const appConfig: ApplicationConfig = {
  providers: [
    // 🎯 Глобальный идентификатор локали 'ru-RU'
    { provide: LOCALE_ID, useValue: 'ru-RU' },

    // Включает оптимизацию отслеживания изменений (Zoneless)
    provideZonelessChangeDetection(),

    // Подключает маршрутизацию
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
    ),

    // Подключает HTTP-клиент и перехватчики
    provideHttpClient(
      withInterceptors([authInterceptor, languageInterceptor])
    ),

    // 🚀 Подключаем ядро переводов и загрузчик
    provideTranslateService({
      lang: 'ru', // Язык по умолчанию при старте
      fallbackLang: 'ru', // Язык, если перевод не найден
      loader: provideTranslateHttpLoader({
        prefix: '/api/uitranslations/', // Твой роут на ASP.NET Core
        suffix: '' // Оставляем пустым, если бэк отдает ответ просто по языку (например, /api/uitranslations/ru)
      })
    })
  ]
};
