import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { LanguageDto, CreateUpdateLanguageDto } from '../models/language-models';
import { ToastService } from './toast';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService); // 👈 2. Инжектируем сервис уведомлений
  private translate = inject(TranslateService);

  private baseUrl = '/api/languages';

  // ==========================================
  // 1. УПРАВЛЕНИЕ СОСТОЯНИЕМ ЯЗЫКА НА КЛИЕНТЕ
  // ==========================================

  // Читаем сохраненный язык из кэша браузера. Если его нет — ставим 'ru' по умолчанию.
  readonly currentLanguage = signal<string>(localStorage.getItem('app_language') || 'ru');

  private languageChangedSubject = new Subject<string>();
  readonly languageChanged$ = this.languageChangedSubject.asObservable();

  constructor() {
    // 2. Сразу применяем язык из Сигнала при загрузке сайта
    this.translate.use(this.currentLanguage());
  }

  /**
   * Метод смены языка пользователем (вызывается из шапки сайта)
   */
  changeLanguage(code: string): void {
    if (this.currentLanguage() === code) return; // Если язык тот же, ничего не делаем

    localStorage.setItem('app_language', code);
    this.currentLanguage.set(code);
    this.languageChangedSubject.next(code);

    // 🚀 3. Определяем красивое название языка для вывода
    const languageNames: Record<string, string> = {
      'ru': 'Русский',
      'en': 'English',
      'uz': 'Oʻzbekcha'
    };
    // Берем название из словаря. Если вдруг придет неизвестный код, просто делаем его большими буквами (напр. "FR")
    const displayName = languageNames[code] || code.toUpperCase();

    this.translate.use(code);

    // 🚀 4. Выводим уведомление об успешной смене языка
    this.toastService.success(`Язык интерфейса изменён на «${displayName}»`);
  }

  // ==========================================
  // 2. API МЕТОДЫ (В основном для Админки)
  // ==========================================

  getAllLanguages(includeInactive = false): Observable<LanguageDto[]> {
    const params = new HttpParams().set('includeInactive', includeInactive.toString());
    return this.http.get<LanguageDto[]>(this.baseUrl, { params });
  }

  getLanguageByCode(code: string): Observable<LanguageDto> {
    return this.http.get<LanguageDto>(`${this.baseUrl}/${code}`);
  }

  createLanguage(dto: CreateUpdateLanguageDto): Observable<LanguageDto> {
    return this.http.post<LanguageDto>(this.baseUrl, dto);
  }

  updateLanguage(code: string, dto: CreateUpdateLanguageDto): Observable<LanguageDto> {
    return this.http.put<LanguageDto>(`${this.baseUrl}/${code}`, dto);
  }

  toggleLanguageStatus(code: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${code}/toggle-status`, {});
  }

  setLanguageAsDefault(code: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${code}/set-default`, {});
  }
}
