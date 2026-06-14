// src/app/models/store-inventory.model.ts

export interface StoreInventoryDto {
  id: number;
  storeId: number;
  storeName: string;
  productId: number;
  productName: string;
  quantity: number;
  lastUpdated: string; // ISO дата с сервера
  isReservable: boolean;
}

export interface UpdateInventorySettingsDto {
  isReservable: boolean;
}

export interface TransactionHistoryDto {
  id: number;
  transactionType: string;
  quantityChange: number;
  referenceId?: string | null;
  createdAt: string; // ISO дата
}
