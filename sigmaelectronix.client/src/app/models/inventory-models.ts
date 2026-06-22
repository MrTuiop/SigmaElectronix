export interface ReceiveStockDto {
  readonly storeId: number;
  readonly productId: number;
  readonly quantity: number;
  readonly referenceId?: string;
}

export interface TransferStockDto {
  readonly fromStoreId: number;
  readonly toStoreId: number;
  readonly productId: number;
  readonly quantity: number;
  readonly referenceId?: string;
}
