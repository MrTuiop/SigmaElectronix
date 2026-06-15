// order.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateOrderDto, OrderDto } from '../models/order-model';


@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/orders';
  
  createOrder(dto: CreateOrderDto): Observable<OrderDto> {
    return this.http.post<OrderDto>(this.baseUrl, dto, { withCredentials: true }).pipe(
      catchError(this.handleError)
    );
  }

  getMyOrders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.baseUrl}/my`, { withCredentials: true }).pipe(
      catchError(this.handleError)
    );
  }

  getOrderById(id: number): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.baseUrl}/${id}`, { withCredentials: true }).pipe(
      catchError(this.handleError)
    );
  }

  payOrder(id: number): Observable<OrderDto> {
    return this.http.post<OrderDto>(`${this.baseUrl}/${id}/pay`, {}, { withCredentials: true }).pipe(
      catchError(this.handleError)
    );
  }

  // --- МЕТОДЫ ДЛЯ МЕНЕДЖЕРА ---

  // Получить все заказы магазина
  getAllOrders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(this.baseUrl, { withCredentials: true }).pipe(
      catchError(this.handleError)
    );
  }

  // Обновить статус заказа
  updateOrderStatus(id: number, status: string): Observable<OrderDto> {
    // Отправляем новый статус. В зависимости от того, как принимает твой контроллер,
    // возможно нужно отправлять как { status } или передавать через query
    return this.http.patch<OrderDto>(`${this.baseUrl}/${id}/status`, { status }, { withCredentials: true }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('Ошибка в OrderService:', error);
    return throwError(() => new Error(error.error?.message || 'Произошла ошибка при работе с заказами'));
  }
}
