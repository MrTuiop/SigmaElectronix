// src/app/services/city.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CityDto, CreateUpdateCityDto } from '../models/location-models';

@Injectable({ providedIn: 'root' })
export class CityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/cities';

  // Получить вообще все города
  getAll(): Observable<CityDto[]> {
    return this.http.get<CityDto[]>(this.baseUrl);
  }

  // 🚀 Самый важный метод для формы оформления заказа!
  // Получить города только конкретного региона
  getByRegionId(regionId: number): Observable<CityDto[]> {
    return this.http.get<CityDto[]>(`${this.baseUrl}/region/${regionId}`);
  }

  // Получить один город по ID
  getById(id: number): Observable<CityDto> {
    return this.http.get<CityDto>(`${this.baseUrl}/${id}`);
  }

  // Создать новый город
  create(dto: CreateUpdateCityDto): Observable<CityDto> {
    return this.http.post<CityDto>(this.baseUrl, dto);
  }

  // Обновить город
  update(id: number, dto: CreateUpdateCityDto): Observable<CityDto> {
    return this.http.put<CityDto>(`${this.baseUrl}/${id}`, dto);
  }

  // Удалить город
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
