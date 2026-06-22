import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import {
  UserDto,
  CreateUserDto,
  UpdateUserDto,
  ChangeUserPasswordDto,
  AdminUpdateUserDto
} from '../models/user-models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  /**
   * Получить список всех пользователей (Admin, Manager)
   */
  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Получить одного пользователя по ID (Admin, Manager)
   */
  getUserById(id: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Создать нового пользователя (Admin, Manager)
   */
  createUser(dto: CreateUserDto): Observable<UserDto> {
    return this.http.post<UserDto>(this.baseUrl, dto).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Обновить данные пользователя (Admin, Manager)
   */
  updateUser(id: string, dto: AdminUpdateUserDto): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.baseUrl}/${id}`, dto).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Принудительно сменить пароль пользователю (Только Admin)
   */
  changePassword(id: string, newPassword: string): Observable<{ message: string }> {
    const dto: ChangeUserPasswordDto = { newPassword };
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${id}/password`, dto).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Заблокировать / Разблокировать пользователя
   */
  toggleStatus(id: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${id}/toggle-status`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Удалить пользователя (Только Admin, Soft Delete, если есть заказы)
   */
  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Общий обработчик ошибок
  private handleError(error: any) {
    console.error('UserService Error:', error);
    let errorMessage = 'Произошла ошибка при работе с пользователями.';

    // Пытаемся вытащить сообщение об ошибке с бэкенда
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
