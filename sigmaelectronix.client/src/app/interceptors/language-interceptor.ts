import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from '../services/language-service';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const isInternalRequest = req.url.startsWith('/');

  // Если это внешний API — пропускаем запрос без изменений
  if (!isInternalRequest) {
    return next(req);
  }

  if (req.url.includes('/api/uitranslations/')) {
    return next(req);
  }

  // ✅ Если Accept-Language уже установлен вручную (например, 'ru' для админки) — пропускаем без изменений
  if (req.headers.has('Accept-Language')) {
    return next(req);
  }

  // Инжектим сервис только для остальных запросов (разрываем цикл зависимости)
  const languageService = inject(LanguageService);
  const currentLang = languageService.currentLanguage();

  // Клонируем запрос и добавляем стандартный заголовок Accept-Language
  const modifiedReq = req.clone({
    headers: req.headers.set('Accept-Language', currentLang)
  });

  // Отправляем измененный запрос дальше
  return next(modifiedReq);
};
