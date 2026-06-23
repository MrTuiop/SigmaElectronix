// src/app/services/ui-translation.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UiTranslationDto, CreateUpdateUiTranslationDto } from '../models/ui-translation-models';

@Injectable({ providedIn: 'root' })
export class UiTranslationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/uitranslations';

  // ==========================================
  // 🟢 ОТКРЫТЫЙ ЭНДПОИНТ (Для клиента / ngx-translate)
  // ==========================================

  /**
   * Получает словарь переводов (Key -> Value) для конкретного языка.
   * Идеально подходит для кастомного TranslateHttpLoader.
   */
  getClientTranslations(lang: string): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.baseUrl}/${lang}`);
  }

  // ==========================================
  // 🔴 ЗАКРЫТЫЕ ЭНДПОИНТЫ ДЛЯ АДМИНКИ (CRUD)
  // ==========================================

  /**
   * Получить список всех переводов интерфейса (все языки и ключи)
   */
  getAll(): Observable<UiTranslationDto[]> {
    return this.http.get<UiTranslationDto[]>(this.baseUrl);
  }

  /**
   * Добавить новый перевод
   */
  create(dto: CreateUpdateUiTranslationDto): Observable<UiTranslationDto> {
    return this.http.post<UiTranslationDto>(this.baseUrl, dto);
  }

  /**
   * Обновить существующий перевод
   */
  update(id: number, dto: CreateUpdateUiTranslationDto): Observable<UiTranslationDto> {
    return this.http.put<UiTranslationDto>(`${this.baseUrl}/${id}`, dto);
  }

  /**
   * Удалить перевод
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
