import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StoreDto, CreateStoreDto, UpdateStoreDto } from '../models/store-models';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/stores';

  /**
   * Получить список всех магазинов
   * @param includeInactive Показывать ли закрытые/неактивные магазины (только для админов)
   */
  getAllStores(includeInactive: boolean = false): Observable<StoreDto[]> {
    const params = new HttpParams().set('includeInactive', includeInactive.toString());
    return this.http.get<StoreDto[]>(this.baseUrl, { params });
  }

  /**
   * Получить магазин по ID
   */
  getStoreById(id: number): Observable<StoreDto> {
    return this.http.get<StoreDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * Создать новый магазин (Admin/Manager)
   */
  createStore(dto: CreateStoreDto): Observable<StoreDto> {
    return this.http.post<StoreDto>(this.baseUrl, dto);
  }

  /**
   * Обновить данные магазина (Admin/Manager)
   */
  updateStore(id: number, dto: UpdateStoreDto): Observable<StoreDto> {
    return this.http.put<StoreDto>(`${this.baseUrl}/${id}`, dto);
  }

  /**
   * Включить / Выключить магазин (Мягкое удаление - Admin)
   */
  toggleStoreStatus(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/toggle-status`, {});
  }
}
