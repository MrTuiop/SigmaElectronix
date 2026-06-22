import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  CategoryDto,
  CategoryTreeDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  SlugCheckResponse,
} from '../models/category-models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private baseUrl = '/api/category';

  // Кэшируемые данные (сигналы — zoneless-friendly)
  readonly allCategories = signal<CategoryDto[]>([]);
  readonly categoryTree = signal<CategoryTreeDto[]>([]);

  // ============ Чтение ============

  loadAll(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(this.baseUrl).pipe(
      tap(categories => this.allCategories.set(categories)),
      catchError(this.handleError)
    );
  }

  loadTree(): Observable<CategoryTreeDto[]> {
    return this.http.get<CategoryTreeDto[]>(`${this.baseUrl}/tree`).pipe(
      tap(tree => this.categoryTree.set(tree)),
      catchError(this.handleError)
    );
  }

  getById(id: number): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getBySlug(slug: string): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.baseUrl}/slug/${slug}`).pipe(
      catchError(this.handleError)
    );
  }

  checkSlug(slug: string, excludeId?: number): Observable<SlugCheckResponse> {
    let params = new HttpParams().set('slug', slug);
    if (excludeId != null) {
      params = params.set('excludeId', excludeId.toString());
    }
    return this.http.get<SlugCheckResponse>(`${this.baseUrl}/check-slug`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // ============ Мутации (админка) ============

  create(dto: CreateCategoryDto): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.baseUrl, dto).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  update(id: number, dto: UpdateCategoryDto): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  // ============ Управление кэшем ============

  clearCache(): void {
    this.allCategories.set([]);
    this.categoryTree.set([]);
  }

  private invalidateCache(): void {
    this.clearCache();
  }

  private handleError(error: any): Observable<never> {
    console.error('CategoryService error:', error);
    return throwError(() => error);
  }
}
