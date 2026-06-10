import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { WishlistDto } from '../models/wishlist-models';
import { WishlistItemDto } from '../models/wishlist-models';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/wishlist';

  // 🔹 Главный сигнал: хранит всё состояние избранного
  readonly wishlist = signal<WishlistDto | null>(null);

  // 🔹 Вычисляемый сигнал: идеально для счетчика в шапке сайта
  readonly totalItems = computed(() => this.wishlist()?.totalItems ?? 0);

  // 1. Загрузить избранное (вызывать при старте приложения)
  loadWishlist(): Observable<WishlistDto> {
    return this.http.get<WishlistDto>(this.baseUrl).pipe(
      tap(data => this.wishlist.set(data)),
      catchError(this.handleError)
    );
  }

  // 2. Метод Toggle: добавить/удалить по клику на сердечко
  toggleItem(productId: number): Observable<WishlistDto> {
    return this.http.post<WishlistDto>(`${this.baseUrl}/toggle/${productId}`, {}).pipe(
      tap(data => this.wishlist.set(data)), // Сервер возвращает обновленный список
      catchError(this.handleError)
    );
  }

  // 3. Очистить всё избранное
  clearWishlist(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/clear`).pipe(
      tap(() => {
        // Обновляем сигнал локально, чтобы UI отреагировал мгновенно
        const current = this.wishlist();
        if (current) {
          this.wishlist.set({ ...current, items: [], totalItems: 0 });
        }
      }),
      catchError(this.handleError)
    );
  }

  // 4. Слияние избранного (вызывать после успешного логина)
  mergeGuestWishlist(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/merge`, {}).pipe(
      tap(() => {
        // После успешного слияния на сервере, запрашиваем актуальный список
        this.loadWishlist().subscribe();
      }),
      catchError(this.handleError)
    );
  }

  // 🔹 Супер-полезный метод для UI: проверяет, закрашивать сердечко или нет
  isInWishlist(productId: number): boolean {
    const items = this.wishlist()?.items;
    if (!items) return false;

    // Добавляем типизацию (item: WishlistItemDto)
    return items.some((item: WishlistItemDto) => item.productId === productId);
  }

  private handleError(error: any) {
    console.error('Ошибка в WishlistService:', error);
    return throwError(() => new Error('Произошла ошибка при работе с избранным'));
  }
}
