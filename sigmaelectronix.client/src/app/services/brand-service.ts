import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BrandListDto, BrandShowcaseDto, CreateBrandDto, PagedResult, UpdateBrandDto } from '../models/brand-models';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private baseUrl = '/api/brands';

  constructor(private http: HttpClient) { }

  // ====== Публичные методы ======

  /** GET: api/brands?pageNumber=1&pageSize=20 */
  getBrands(pageNumber = 1, pageSize = 20, searchQuery?: string, sortBy?: string): Observable<PagedResult<BrandListDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (searchQuery) params = params.set('searchQuery', searchQuery);
    if (sortBy) params = params.set('sortBy', sortBy);

    return this.http.get<PagedResult<BrandListDto>>(this.baseUrl, { params });
  }

  /** GET: api/brands/featured?count=6 */
  getFeaturedBrands(count = 6): Observable<BrandListDto[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<BrandListDto[]>(`${this.baseUrl}/featured`, { params });
  }

  /** GET: api/brands/slug/{slug} */
  getBrandBySlug(slug: string): Observable<BrandShowcaseDto> {
    return this.http.get<BrandShowcaseDto>(`${this.baseUrl}/slug/${encodeURIComponent(slug)}`);
  }

  // ====== Административные методы ======

  /** POST: api/brands */
  createBrand(dto: CreateBrandDto): Observable<BrandShowcaseDto> {
    return this.http.post<BrandShowcaseDto>(this.baseUrl, dto);
  }

  /** PUT: api/brands/{id} */
  updateBrand(id: number, dto: UpdateBrandDto): Observable<BrandShowcaseDto> {
    return this.http.put<BrandShowcaseDto>(`${this.baseUrl}/${id}`, dto);
  }

  /** DELETE: api/brands/{id} (возвращает void, сервер отдаёт 204) */
  deleteBrand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ====== Быстрые переключатели (Тумблеры) ======

  /** PATCH: api/brands/{id}/toggle-active */
  toggleActiveStatus(id: number): Observable<void> {
    // Отправляем пустой объект {}, так как ID передается в URL
    return this.http.patch<void>(`${this.baseUrl}/${id}/toggle-active`, {});
  }

  /** PATCH: api/brands/{id}/toggle-featured */
  toggleFeaturedStatus(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/toggle-featured`, {});
  }
}
