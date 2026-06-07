import { Injectable, inject, signal, Injector } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
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
    // Загружаем профиль, только если уже есть токен, и откладываем вызов
    if (this.token()) {
      setTimeout(() => {
        this.getProfileService().loadProfile().subscribe();
      });
    }
  }
}
