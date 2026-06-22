export enum PaymentMethod {
  Card = 0,
  Cash = 1,
  Wallet = 2
}

export interface CreateOrderItemDto {
  readonly productId: number;
  readonly quantity: number;
}

export interface CreateOrderDto {
  readonly shippingFullName: string;
  readonly shippingPhone: string;
  readonly shippingEmail?: string;
  readonly shippingAddress: string;
  readonly shippingCost: number;
  readonly promoCode?: string;
  readonly storeId?: number | null;
  readonly paymentMethod: PaymentMethod;
  readonly items: readonly CreateOrderItemDto[];
  readonly bonusesToSpend?: number;
}

export interface OrderItemDto {
  readonly id: number;
  readonly productId: number;
  readonly storeId?: number;
  readonly productName: string;
  readonly productImageUrl?: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
}

export interface OrderDto {
  readonly id: number;
  readonly orderNumber: string;
  readonly userId?: string;
  readonly totalAmount: number;
  readonly shippingCost: number;
  readonly discountAmount: number;
  readonly status: string;
  readonly storeId?: number;
  readonly paymentStatus: string;
  readonly paymentMethod: string;
  readonly paidAt?: string;              // ✅ ISO 8601 (не Date!)
  readonly reservationExpiresAt?: string; // ✅ ISO 8601
  readonly shippingFullName: string;
  readonly shippingPhone: string;
  readonly shippingEmail?: string;
  readonly shippingAddress: string;
  readonly createdAt: string;             // ✅ ISO 8601
  readonly updatedAt?: string;            // ✅ ISO 8601
  readonly items: readonly OrderItemDto[];
}
