// cart-models.ts
export interface CartDto {
  id: number;
  userId?: string;
  items: CartItemDto[];
  total: number;
  updatedAt: string;
}

export interface CartItemDto {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
  price: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
