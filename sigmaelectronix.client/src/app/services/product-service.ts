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

  // Кэшируемые подборки для главной страницы (по аналогии с ProfileService)
  readonly featuredProducts = signal<ProductListDto[]>([]);
  readonly newArrivals = signal<ProductListDto[]>([]);
  readonly discountedProducts = signal<ProductListDto[]>([]);

  // ---------- Публичные методы без состояния ----------

  // Получение товаров с фильтрацией и пагинацией (каталог)
  getProducts(filter: ProductFilterDto): Observable<PaginatedResponse<ProductListDto>> {
    return this.http.get<PaginatedResponse<ProductListDto>>(this.baseUrl, {
      params: this.buildFilterParams(filter)
    }).pipe(catchError(this.handleError));
  }

  // Товар по ID
  getProductById(id: number): Observable<ProductDetailDto> {
    return this.http.get<ProductDetailDto>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Товар по slug
  getProductBySlug(slug: string): Observable<ProductDetailDto> {
    return this.http.get<ProductDetailDto>(`${this.baseUrl}/slug/${slug}`)
      .pipe(catchError(this.handleError));
  }

  // Featured / Новинки / Уценённые (с кэшированием в сигналах)
  loadFeatured(count: number = 8): Observable<ProductListDto[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<ProductListDto[]>(`${this.baseUrl}/featured`, { params })
      .pipe(
        tap(products => this.featuredProducts.set(products)),
        catchError(this.handleError)
      );
  }

  loadNewArrivals(count: number = 8): Observable<ProductListDto[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<ProductListDto[]>(`${this.baseUrl}/new`, { params })
      .pipe(
        tap(products => this.newArrivals.set(products)),
        catchError(this.handleError)
      );
  }

  loadDiscounted(count: number = 8): Observable<ProductListDto[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<ProductListDto[]>(`${this.baseUrl}/discounted`, { params })
      .pipe(
        tap(products => this.discountedProducts.set(products)),
        catchError(this.handleError)
      );
  }

  // Связанные товары
  getRelatedProducts(productId: number, count: number = 4): Observable<ProductListDto[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<ProductListDto[]>(`${this.baseUrl}/${productId}/related`, { params })
      .pipe(catchError(this.handleError));
  }

  // ---------- Административные методы ----------

  // Админка: все товары (с фильтром)
  getAdminProducts(filter: ProductFilterDto): Observable<PaginatedResponse<ProductListDto>> {
    return this.http.get<PaginatedResponse<ProductListDto>>(`${this.baseUrl}/admin`, {
      params: this.buildFilterParams(filter)
    }).pipe(catchError(this.handleError));
  }

  // Создать
  createProduct(dto: CreateProductDto): Observable<ProductDetailDto> {
    return this.http.post<ProductDetailDto>(this.baseUrl, dto)
      .pipe(catchError(this.handleError));
  }

  // Обновить
  updateProduct(id: number, dto: UpdateProductDto): Observable<ProductDetailDto> {
    return this.http.put<ProductDetailDto>(`${this.baseUrl}/${id}`, dto)
      .pipe(catchError(this.handleError));
  }

  // Удалить (soft delete)
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Восстановить
  restoreProduct(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/restore`, null)
      .pipe(catchError(this.handleError));
  }

  // Сброс кэшированных списков (например, при выходе)
  clearCache(): void {
    this.featuredProducts.set([]);
    this.newArrivals.set([]);
    this.discountedProducts.set([]);
  }

  // ---------- Приватные хелперы ----------

  private buildFilterParams(filter: ProductFilterDto): HttpParams {
    let params = new HttpParams();

    if (filter.categoryId != null) {
      params = params.set('categoryId', filter.categoryId.toString());
    }
    if (filter.brandIds?.length) {
      filter.brandIds.forEach(id => params = params.append('brandIds', id.toString()));
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

    // 🚀 НОВАЯ СЕРИАЛИЗАЦИЯ ХАРАКТЕРИСТИК (Массивы)
    if (filter.specifications) {
      Object.entries(filter.specifications).forEach(([key, values]) => {
        if (values && values.length > 0) {
          // ASP.NET Core поймет формат: specifications[Память]=128 ГБ&specifications[Память]=256 ГБ
          values.forEach(val => {
            params = params.append(`specifications[${key}]`, val);
          });
        }
      });
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

  getFilters(categoryId?: number): Observable<CategoryFilterDto> {
    let params = new HttpParams();
    if (categoryId) params = params.set('categoryId', categoryId.toString());
    return this.http.get<CategoryFilterDto>(`${this.baseUrl}/filters`, { params })
      .pipe(catchError(this.handleError));
  }
}
