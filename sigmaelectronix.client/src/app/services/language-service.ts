import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LanguageDto, CreateUpdateLanguageDto } from '../models/language-models';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private http = inject(HttpClient);
  private baseUrl = '/api/languages';

  // ==========================================
  // 1. УПРАВЛЕНИЕ СОСТОЯНИЕМ ЯЗЫКА НА КЛИЕНТЕ
  // ==========================================

  // Читаем сохраненный язык из кэша браузера. Если его нет — ставим 'ru' по умолчанию.
  readonly currentLanguage = signal<string>(localStorage.getItem('app_language') || 'ru');

  /**
   * Метод смены языка пользователем (вызывается из шапки сайта)
   */
  changeLanguage(code: string): void {
    if (this.currentLanguage() === code) return; // Если язык тот же, ничего не делаем

    localStorage.setItem('app_language', code);
    this.currentLanguage.set(code);

    // Перезагружаем страницу, чтобы бэкенд отдал все товары/меню на новом языке
    // (Это самый надежный способ сбросить старый кэш товаров)
    window.location.reload();
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
