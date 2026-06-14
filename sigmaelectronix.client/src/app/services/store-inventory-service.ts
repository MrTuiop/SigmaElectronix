import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StoreInventoryDto, TransactionHistoryDto, UpdateInventorySettingsDto } from '../models/store-inventory-models';

@Injectable({
  providedIn: 'root'
})
export class StoreInventoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/storeinventories';

  // 🔹 Получить остатки всех товаров в конкретном магазине
  getInventoryByStore(storeId: number): Observable<StoreInventoryDto[]> {
    return this.http.get<StoreInventoryDto[]>(`${this.baseUrl}/store/${storeId}`);
  }

  // 🔹 Получить наличие конкретного товара по всем магазинам (например, для карточки товара)
  getInventoryByProduct(productId: number): Observable<StoreInventoryDto[]> {
    return this.http.get<StoreInventoryDto[]>(`${this.baseUrl}/product/${productId}`);
  }

  // 🔹 Получить историю движений (приход/расход) товара в магазине
  getProductHistory(storeId: number, productId: number): Observable<TransactionHistoryDto[]> {
    return this.http.get<TransactionHistoryDto[]>(
      `${this.baseUrl}/store/${storeId}/product/${productId}/history`
    );
  }

  // 🔹 Включить/выключить возможность резерва товара (если это витринный образец)
  updateReservableStatus(storeId: number, productId: number, isReservable: boolean): Observable<void> {
    const body: UpdateInventorySettingsDto = { isReservable };
    return this.http.patch<void>(
      `${this.baseUrl}/store/${storeId}/product/${productId}/reservable`,
      body
    );
  }
}
