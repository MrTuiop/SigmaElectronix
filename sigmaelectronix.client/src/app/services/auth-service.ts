import { Injectable, inject, signal, Injector } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ProfileService } from './profile-service';

import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ApiError
} from '../models/auth-models';
import { WishlistService } from './wishlist-service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private injector = inject(Injector);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = '/api/auth';

  readonly token = signal<string | null>(localStorage.getItem('access_token'));

  private getProfileService(): ProfileService {
    return this.injector.get(ProfileService);
  }

  private getWishlistService(): WishlistService {
    return this.injector.get(WishlistService);
  }

  register(dto: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, dto).pipe(
      catchError(this.handleError)
    );
  }

  login(dto: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, dto).pipe(
      tap(response => {
        this.setToken(response.accessToken);
        this.getProfileService().loadProfile().subscribe();
        this.getWishlistService().mergeGuestWishlist().subscribe();
      }),
      catchError(this.handleError)
    );
  }

  setToken(token: string): void {
    localStorage.setItem('access_token', token);
    this.token.set(token);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.token.set(null);
    this.getProfileService().clearAll();
    this.getWishlistService().wishlist.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }

  checkUsername(username: string): Observable<{ isAvailable: boolean }> {
    const params = new HttpParams().set('username', username);
    return this.http.get<{ isAvailable: boolean }>(`${this.baseUrl}/check-username`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'Произошла ошибка';
    if (error.status === 400 && error.error?.Errors) {
      message = (error.error as ApiError).Errors?.join('\n') ?? message;
    } else if (error.error?.message) {
      message = error.error.message;
    }
    return throwError(() => new Error(message));
  }

  constructor() {
    // 1. Избранное загружаем ВСЕГДА (и для гостей, и для авторизованных)
    // Используем setTimeout, чтобы избежать проблемы с циклическими зависимостями или ранней инициализацией
    setTimeout(() => {
      this.getWishlistService().loadWishlist().subscribe();
    });

    // 2. А профиль загружаем ТОЛЬКО если есть токен (пользователь авторизован)
    if (this.token()) {
      setTimeout(() => {
        this.getProfileService().loadProfile().subscribe();
      });
    }
  }
}
