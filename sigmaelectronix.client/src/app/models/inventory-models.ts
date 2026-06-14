export interface ReceiveStockDto {
  storeId: number;
  productId: number;
  quantity: number;
  referenceId?: string; // Накладная (опционально)
}

export interface TransferStockDto {
  fromStoreId: number;
  toStoreId: number;
  productId: number;
  quantity: number;
  referenceId?: string;
}
