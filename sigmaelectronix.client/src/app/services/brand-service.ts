import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  BrandListDto,
  BrandShowcaseDto,
  BrandSummaryDto,
  CreateBrandDto,
  UpdateBrandDto,
  PaginatedResponse
} from '../models/brand-models';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private http = inject(HttpClient);
  private baseUrl = '/api/brands';

  // Кэш популярных брендов для главной (сигнал — zoneless-friendly)
  readonly featuredBrands = signal<BrandListDto[]>([]);

  // ============ Публичные методы ============

  /** GET: api/brands?pageNumber=1&pageSize=20&searchQuery=...&sortBy=... */
  getBrands(
    pageNumber = 1,
    pageSize = 20,
    searchQuery?: string,
    sortBy?: string
  ): Observable<PaginatedResponse<BrandListDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (searchQuery) params = params.set('searchQuery', searchQuery);
    if (sortBy) params = params.set('sortBy', sortBy);

    return this.http.get<PaginatedResponse<BrandListDto>>(this.baseUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /** GET: api/brands/featured?count=6 (с кэшированием в сигнал) */
  loadFeaturedBrands(count = 6): Observable<BrandListDto[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<BrandListDto[]>(`${this.baseUrl}/featured`, { params })
      .pipe(
        tap(brands => this.featuredBrands.set(brands)),
        catchError(this.handleError)
      );
  }

  /** GET: api/brands/slug/{slug} — полная витрина бренда */
  getBrandBySlug(slug: string): Observable<BrandShowcaseDto> {
    return this.http.get<BrandShowcaseDto>(`${this.baseUrl}/slug/${encodeURIComponent(slug)}`)
      .pipe(catchError(this.handleError));
  }

  // ============ Административные методы ============

  /** POST: api/brands */
  createBrand(dto: CreateBrandDto): Observable<BrandSummaryDto> {
    return this.http.post<BrandSummaryDto>(this.baseUrl, dto)
      .pipe(catchError(this.handleError));
  }

  /** PUT: api/brands/{id} */
  updateBrand(id: number, dto: UpdateBrandDto): Observable<BrandSummaryDto> {
    return this.http.put<BrandSummaryDto>(`${this.baseUrl}/${id}`, dto)
      .pipe(catchError(this.handleError));
  }

  /** DELETE: api/brands/{id} */
  deleteBrand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // ============ Тумблеры (PATCH) ============

  /** PATCH: api/brands/{id}/toggle-active */
  toggleActiveStatus(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/toggle-active`, {})
      .pipe(catchError(this.handleError));
  }

  /** PATCH: api/brands/{id}/toggle-featured */
  toggleFeaturedStatus(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/toggle-featured`, {})
      .pipe(catchError(this.handleError));
  }

  // ============ Кэш ============

  clearCache(): void {
    this.featuredBrands.set([]);
  }

  private handleError(error: any): Observable<never> {
    console.error('BrandService error:', error);
    return throwError(() => error);
  }

  // ============ Административные методы — всегда на русском ============

  getBrandsForAdmin(
    pageNumber = 1,
    pageSize = 20,
    searchQuery?: string,
    sortBy?: string
  ): Observable<PaginatedResponse<BrandListDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (searchQuery) params = params.set('searchQuery', searchQuery);
    if (sortBy) params = params.set('sortBy', sortBy);

    return this.http.get<PaginatedResponse<BrandListDto>>(this.baseUrl, {
      params,
      headers: { 'Accept-Language': 'ru' } // 👈 Жёстко русский
    }).pipe(catchError(this.handleError));
  }

  getBrandBySlugForAdmin(slug: string): Observable<BrandShowcaseDto> {
    return this.http.get<BrandShowcaseDto>(`${this.baseUrl}/slug/${encodeURIComponent(slug)}`, {
      headers: { 'Accept-Language': 'ru' } // 👈 Жёстко русский
    }).pipe(catchError(this.handleError));
  }
}
