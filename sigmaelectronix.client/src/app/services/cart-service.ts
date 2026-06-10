import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {
  CartDto,
  CartItemDto,
  AddToCartRequest,
  UpdateCartItemRequest,
} from '../models/cart-models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/cart';

  // 🔹 Главный сигнал: полное состояние корзины с сервера
  readonly cart = signal<CartDto | null>(null);

  // 🔹 Вычисляемые сигналы – идеальны для шапки и иконки корзины
  readonly totalItems = computed(() => {
    const items = this.cart()?.items;
    return items ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  });

  readonly totalPrice = computed(() => this.cart()?.total ?? 0);

  // 1. Загрузить корзину (вызывай при старте приложения)
  loadCart(): Observable<CartDto> {
    // ⚠️ ДОБАВЛЕНО: { withCredentials: true }
    return this.http.get<CartDto>(this.baseUrl, { withCredentials: true }).pipe(
      tap(data => this.cart.set(data)),
      catchError(this.handleError)
    );
  }

  // 2. Добавить товар в корзину
  addItem(request: AddToCartRequest): Observable<CartDto> {
    // ⚠️ ДОБАВЛЕНО: { withCredentials: true }
    return this.http.post<CartDto>(`${this.baseUrl}/items`, request, { withCredentials: true }).pipe(
      tap(data => this.cart.set(data)),
      catchError(this.handleError)
    );
  }

  // 3. Изменить количество товара (itemId – id элемента корзины, не продукта!)
  updateItemQuantity(itemId: number, quantity: number): Observable<CartDto> {
    const body: UpdateCartItemRequest = { quantity };
    // ⚠️ ДОБАВЛЕНО: { withCredentials: true }
    return this.http.put<CartDto>(`${this.baseUrl}/items/${itemId}`, body, { withCredentials: true }).pipe(
      tap(data => this.cart.set(data)),
      catchError(this.handleError)
    );
  }

  // 4. Удалить один товар из корзины
  removeItem(itemId: number): Observable<void> {
    // ⚠️ ДОБАВЛЕНО: { withCredentials: true }
    return this.http.delete<void>(`${this.baseUrl}/items/${itemId}`, { withCredentials: true }).pipe(
      tap(() => {
        // Мгновенное обновление UI без дополнительного запроса
        const current = this.cart();
        if (current) {
          const updatedItems = current.items.filter(i => i.id !== itemId);
          this.cart.set({ ...current, items: updatedItems });
        }
      }),
      catchError(this.handleError)
    );
  }

  // 5. Полностью очистить корзину
  clearCart(): Observable<void> {
    // ⚠️ ДОБАВЛЕНО: { withCredentials: true }
    return this.http.delete<void>(`${this.baseUrl}/clear`, { withCredentials: true }).pipe(
      tap(() => {
        const current = this.cart();
        if (current) {
          this.cart.set({ ...current, items: [] });
        }
      }),
      catchError(this.handleError)
    );
  }

  // 6. Слияние гостевой корзины с аккаунтом после логина
  mergeGuestCart(): Observable<void> {
    // ⚠️ ДОБАВЛЕНО: { withCredentials: true }
    return this.http.post<void>(`${this.baseUrl}/merge`, {}, { withCredentials: true }).pipe(
      tap(() => {
        // После слияния получаем актуальную корзину
        this.loadCart().subscribe();
      }),
      catchError(this.handleError)
    );
  }

  // 🔹 Удобный хелпер для карточки товара: сколько единиц уже в корзине
  getItemQuantity(productId: number): number {
    const items = this.cart()?.items;
    if (!items) return 0;
    const item = items.find(i => i.productId === productId);
    return item ? item.quantity : 0;
  }

  // Проверка, есть ли товар в корзине (хотя бы 1 шт)
  isInCart(productId: number): boolean {
    return this.getItemQuantity(productId) > 0;
  }

  private handleError(error: any) {
    console.error('Ошибка в CartService:', error);
    return throwError(() => new Error('Произошла ошибка при работе с корзиной'));
  }
}
