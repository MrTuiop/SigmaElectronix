import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from '../services/language-service';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const languageService = inject(LanguageService);

  // Берем текущий язык из нашего сервиса
  const currentLang = languageService.currentLanguage();

  // Клонируем запрос и добавляем стандартный заголовок Accept-Language
  const modifiedReq = req.clone({
    headers: req.headers.set('Accept-Language', currentLang)
  });

  // Отправляем измененный запрос дальше
  return next(modifiedReq);
};
