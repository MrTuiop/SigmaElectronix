export interface CartDto {
  readonly id: number;
  readonly userId?: string;
  readonly items: readonly CartItemDto[];
  readonly total: number;
  readonly updatedAt: string;
}

export interface CartItemDto {
  readonly id: number;
  readonly productId: number;
  readonly productName: string;
  readonly productImage?: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
}

export interface AddToCartRequest {
  readonly productId: number;
  readonly quantity: number;
  readonly price: number;
}

export interface UpdateCartItemRequest {
  readonly quantity: number;
}
