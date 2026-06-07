import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  UserProfile,
  Order,
  Address,
  BonusTransaction,
  NotificationState,
  Review,
  WishlistProduct,
  UpdateFirstNameRequest,
  UpdateLastNameRequest,
  UpdateEmailRequest,
  UpdatePhoneRequest,
  ChangePasswordRequest,
  UpdateAvatarRequest,
  UpdatePreferredCityRequest,
  UpdatePreferredStoreRequest,
  UpdateUsernameRequest
} from '../models/profile-models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private baseUrl = '/api/profile';

  // Основные состояния с сервера
  readonly user = signal<UserProfile | null>(null);
  readonly orders = signal<Order[]>([]);
  readonly addresses = signal<Address[]>([]);
  readonly bonusHistory = signal<BonusTransaction[]>([]);

  // Состояния, ожидающие будущих API (пока с локальными значениями по умолчанию)
  readonly notifications = signal<NotificationState>({
    email: true,
    sms: false,
    push: true,
  });
  readonly reviews = signal<Review[]>([]);
  readonly wishlistItems = signal<WishlistProduct[]>([]);

  // ===== Загрузка профиля =====
  loadProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.baseUrl).pipe(
      tap(profile => this.user.set(profile)),
      catchError(error => {
        console.error('Ошибка загрузки профиля', error);
        return throwError(() => error);
      })
    );
  }

  // ===== Загрузка заказов с преобразованием =====
  loadOrders(): Observable<Order[]> {
    return this.http.get<any[]>(`${this.baseUrl}/orders`).pipe(
      tap(orders => {
        const mapped: Order[] = orders.map(o => ({
          ...o,
          date: new Date(o.createdAt).toLocaleDateString('ru-RU'),
          statusColor: this.getStatusColor(o.status),
          items: o.items?.length ?? o.itemsCount ?? 0,
          total: o.totalAmount ?? 0,
        }));
        this.orders.set(mapped);
      }),
      catchError(error => {
        console.error('Ошибка загрузки заказов', error);
        return throwError(() => error);
      })
    );
  }

  // ===== Загрузка адресов =====
  loadAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.baseUrl}/addresses`).pipe(
      tap(addresses => this.addresses.set(addresses)),
      catchError(error => {
        console.error('Ошибка загрузки адресов', error);
        return throwError(() => error);
      })
    );
  }

  // ===== Загрузка истории бонусов =====
  loadBonusHistory(): Observable<BonusTransaction[]> {
    return this.http.get<BonusTransaction[]>(`${this.baseUrl}/bonus-history`).pipe(
      tap(history => this.bonusHistory.set(history)),
      catchError(error => {
        console.error('Ошибка загрузки истории бонусов', error);
        return throwError(() => error);
      })
    );
  }

  updateUserName(userName: string): Observable<{ userName: string }> {
    const body: UpdateUsernameRequest = { userName };
    return this.http.put<{ userName: string }>(`${this.baseUrl}/user-name`, body).pipe(
      tap(response => this.user.update(u => u ? { ...u, userName: response.userName } : null))
    );
  }

  // ===== Методы обновления профиля (без изменений) =====
  updateFirstName(firstName: string): Observable<{ firstName: string; fullName: string }> {
    const body: UpdateFirstNameRequest = { firstName };
    return this.http.put<{ firstName: string; fullName: string }>(`${this.baseUrl}/first-name`, body).pipe(
      tap(response => this.user.update(u => u ? { ...u, firstName: response.firstName, fullName: response.fullName } : null))
    );
  }

  updateLastName(lastName: string): Observable<{ lastName: string; fullName: string }> {
    const body: UpdateLastNameRequest = { lastName };
    return this.http.put<{ lastName: string; fullName: string }>(`${this.baseUrl}/last-name`, body).pipe(
      tap(response => this.user.update(u => u ? { ...u, lastName: response.lastName, fullName: response.fullName } : null))
    );
  }

  updateEmail(email: string): Observable<{ email: string }> {
    const body: UpdateEmailRequest = { email };
    return this.http.put<{ email: string }>(`${this.baseUrl}/email`, body).pipe(
      tap(response => this.user.update(u => u ? { ...u, email: response.email } : null))
    );
  }

  updatePhone(phoneNumber: string): Observable<{ phoneNumber: string }> {
    const body: UpdatePhoneRequest = { phoneNumber };
    return this.http.put<{ phoneNumber: string }>(`${this.baseUrl}/phone`, body).pipe(
      tap(response => this.user.update(u => u ? { ...u, phoneNumber: response.phoneNumber } : null))
    );
  }

  changePassword(dto: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/password`, dto);
  }

  updateAvatar(avatarUrl: string): Observable<{ avatarUrl: string }> {
    const body: UpdateAvatarRequest = { avatarUrl };
    return this.http.put<{ avatarUrl: string }>(`${this.baseUrl}/avatar`, body).pipe(
      tap(response => this.user.update(u => u ? { ...u, avatarUrl: response.avatarUrl } : null))
    );
  }

  updatePreferredCity(cityId: number | null): Observable<any> {
    const body: UpdatePreferredCityRequest = { cityId };
    return this.http.put(`${this.baseUrl}/preferred-city`, body).pipe(
      tap(() => this.user.update(u => u ? { ...u, preferredCityId: cityId } : null))
    );
  }

  updatePreferredStore(storeId: number | null): Observable<any> {
    const body: UpdatePreferredStoreRequest = { storeId };
    return this.http.put(`${this.baseUrl}/preferred-store`, body).pipe(
      tap(() => this.user.update(u => u ? { ...u, preferredStoreId: storeId } : null))
    );
  }

  // ===== Локальные методы-заглушки для избранного и уведомлений =====
  removeFromWishlist(productId: number): void {
    this.wishlistItems.update(items => items.filter(i => i.id !== productId));
  }

  toggleNotification(type: 'email' | 'sms' | 'push'): void {
    this.notifications.update(n => ({ ...n, [type]: !n[type] }));
  }

  // ===== Сброс данных =====
  clearAll(): void {
    this.user.set(null);
    this.orders.set([]);
    this.addresses.set([]);
    this.bonusHistory.set([]);
    this.notifications.set({ email: true, sms: false, push: true });
    this.reviews.set([]);
    this.wishlistItems.set([]);
  }

  // Вспомогательная функция цвета статуса заказа
  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Доставлен': '#10b981',
      'В пути': '#f59e0b',
      'Отменён': '#ef4444',
      'Обработка': '#3b82f6',
    };
    return colors[status] ?? '#6b7280';
  }
}
