// src/app/services/region.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegionDto, CreateUpdateRegionDto } from '../models/location-models';

@Injectable({ providedIn: 'root' })
export class RegionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/regions';

  // Получить список всех регионов
  getAll(): Observable<RegionDto[]> {
    return this.http.get<RegionDto[]>(this.baseUrl);
  }

  // Получить один регион по ID
  getById(id: number): Observable<RegionDto> {
    return this.http.get<RegionDto>(`${this.baseUrl}/${id}`);
  }

  // Создать новый регион (для менеджера/админа)
  create(dto: CreateUpdateRegionDto): Observable<RegionDto> {
    return this.http.post<RegionDto>(this.baseUrl, dto);
  }

  // Обновить регион (для менеджера/админа)
  update(id: number, dto: CreateUpdateRegionDto): Observable<RegionDto> {
    return this.http.put<RegionDto>(`${this.baseUrl}/${id}`, dto);
  }

  // Удалить регион (только для админа)
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
