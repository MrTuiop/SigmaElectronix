import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  ProductFilterDto,
  ProductListDto,
  ProductDetailDto,
  CreateProductDto,
  UpdateProductDto,
  PaginatedResponse,
  CategoryFilterDto
} from '../models/product-models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = '/api/products';

  // Кэш подборок для главной (сигналы — zoneless-friendly)
  readonly featuredProducts = signal<ProductListDto[]>([]);
  readonly newArrivals = signal<ProductListDto[]>([]);
  readonly discountedProducts = signal<ProductListDto[]>([]);

  // ============ Публичные методы (чтение) ============

  getProducts(filter: ProductFilterDto): Observable<PaginatedResponse<ProductListDto>> {
    return this.http.get<PaginatedResponse<ProductListDto>>(this.baseUrl, {
      params: this.buildFilterParams(filter)
    }).pipe(catchError(this.handleError));
  }

  getProductById(id: number): Observable<ProductDetailDto> {
    return this.http.get<ProductDetailDto>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getProductBySlug(slug: string): Observable<ProductDetailDto> {
    return this.http.get<ProductDetailDto>(`${this.baseUrl}/slug/${slug}`)
      .pipe(catchError(this.handleError));
  }

  loadFeatured(count = 8): Observable<ProductListDto[]> {
    return this.http.get<ProductListDto[]>(`${this.baseUrl}/featured`, {
      params: new HttpParams().set('count', count.toString())
    }).pipe(
      tap(list => this.featuredProducts.set(list)),
      catchError(this.handleError)
    );
  }

  loadNewArrivals(count = 8): Observable<ProductListDto[]> {
    return this.http.get<ProductListDto[]>(`${this.baseUrl}/new`, {
      params: new HttpParams().set('count', count.toString())
    }).pipe(
      tap(list => this.newArrivals.set(list)),
      catchError(this.handleError)
    );
  }

  loadDiscounted(count = 8): Observable<ProductListDto[]> {
    return this.http.get<ProductListDto[]>(`${this.baseUrl}/discounted`, {
      params: new HttpParams().set('count', count.toString())
    }).pipe(
      tap(list => this.discountedProducts.set(list)),
      catchError(this.handleError)
    );
  }

  getRelatedProducts(productId: number, count = 4): Observable<ProductListDto[]> {
    return this.http.get<ProductListDto[]>(`${this.baseUrl}/${productId}/related`, {
      params: new HttpParams().set('count', count.toString())
    }).pipe(catchError(this.handleError));
  }

  getFilters(categoryId?: number): Observable<CategoryFilterDto> {
    const params = categoryId
      ? new HttpParams().set('categoryId', categoryId.toString())
      : undefined;
    return this.http.get<CategoryFilterDto>(`${this.baseUrl}/filters`, { params })
      .pipe(catchError(this.handleError));
  }

  // ============ Админка (CRUD) ============

  getAdminProducts(filter: ProductFilterDto): Observable<PaginatedResponse<ProductListDto>> {
    return this.http.get<PaginatedResponse<ProductListDto>>(`${this.baseUrl}/admin`, {
      params: this.buildFilterParams(filter)
    }).pipe(catchError(this.handleError));
  }

  // Теперь dto — это CreateProductDto с массивом translations
  createProduct(dto: CreateProductDto): Observable<ProductDetailDto> {
    return this.http.post<ProductDetailDto>(this.baseUrl, dto)
      .pipe(catchError(this.handleError));
  }

  // 👈 ВАЖНО: dto теперь UpdateProductDto = CreateProductDto (с translations[])
  updateProduct(id: number, dto: UpdateProductDto): Observable<ProductDetailDto> {
    return this.http.put<ProductDetailDto>(`${this.baseUrl}/${id}`, dto)
      .pipe(catchError(this.handleError));
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  restoreProduct(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/restore`, null)
      .pipe(catchError(this.handleError));
  }

  togglePublishStatus(id: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${id}/toggle-status`, {})
      .pipe(catchError(this.handleError));
  }

  clearCache(): void {
    this.featuredProducts.set([]);
    this.newArrivals.set([]);
    this.discountedProducts.set([]);
  }

  // ============ Приватные хелперы ============

  private buildFilterParams(filter: ProductFilterDto): HttpParams {
    let params = new HttpParams();

    if (filter.categoryId != null) {
      params = params.set('categoryId', filter.categoryId.toString());
    }
    if (filter.brandIds?.length) {
      filter.brandIds.forEach(id => {
        params = params.append('brandIds', id.toString());
      });
    }
    if (filter.minPrice != null) {
      params = params.set('minPrice', filter.minPrice.toString());
    }
    if (filter.maxPrice != null) {
      params = params.set('maxPrice', filter.maxPrice.toString());
    }
    if (filter.searchQuery) {
      params = params.set('searchQuery', filter.searchQuery);
    }

    // 🚀 Характеристики: ASP.NET Core биндит dictionary как specifications[Key]=value
    if (filter.specifications) {
      for (const [key, values] of Object.entries(filter.specifications)) {
        if (values && values.length > 0) {
          values.forEach(val => {
            params = params.append(`specifications[${key}]`, val);
          });
        }
      }
    }

    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }
    params = params.set('pageNumber', (filter.pageNumber ?? 1).toString());
    params = params.set('pageSize', (filter.pageSize ?? 20).toString());

    return params;
  }

  private handleError(error: any): Observable<never> {
    console.error('ProductService error:', error);
    return throwError(() => error);
  }
}
