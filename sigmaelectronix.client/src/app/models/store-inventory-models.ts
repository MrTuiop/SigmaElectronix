export interface StoreInventoryDto {
  readonly id: number;
  readonly storeId: number;
  readonly storeName: string;
  readonly productId: number;
  readonly productName: string;
  readonly quantity: number;
  readonly lastUpdated: string; // ISO дата
  readonly isReservable: boolean;
}

export interface UpdateInventorySettingsDto {
  readonly isReservable: boolean;
}

export interface TransactionHistoryDto {
  readonly id: number;
  readonly transactionType: string;
  readonly quantityChange: number;
  readonly referenceId?: string | null;
  readonly createdAt: string; // ISO дата
}
