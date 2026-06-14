import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReceiveStockDto, TransferStockDto } from '../models/inventory-models';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/inventory';

  receiveStock(dto: ReceiveStockDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/receive`, dto).pipe(
      catchError(this.handleError)
    );
  }

  transferStock(dto: TransferStockDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/transfer`, dto).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Произошла ошибка при работе со складом.';
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    }
    console.error('InventoryService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
