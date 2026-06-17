// order-models.ts
export enum PaymentMethod {
  Card = 0,
  Cash = 1,
  Wallet = 2
}

export interface CreateOrderItemDto {
  productId: number;
  quantity: number;
}

export interface CreateOrderDto {
  shippingFullName: string;
  shippingPhone: string;
  shippingEmail?: string;
  shippingAddress: string;
  shippingCost: number;
  promoCode?: string;
  storeId?: number | null;
  paymentMethod: PaymentMethod;
  items: CreateOrderItemDto[];
  bonusesToSpend?: number;
}

export interface OrderItemDto {
  id: number;
  productId: number;
  storeId?: number;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderDto {
  id: number;
  orderNumber: string;
  userId?: string;
  totalAmount: number;
  shippingCost: number;
  discountAmount: number;
  status: string;
  storeId?: number;
  paymentStatus: string;
  paymentMethod: string;
  paidAt?: Date;
  reservationExpiresAt?: Date;
  shippingFullName: string;
  shippingPhone: string;
  shippingEmail?: string;
  shippingAddress: string;
  createdAt: Date;
  updatedAt?: Date;
  items: OrderItemDto[];
}
