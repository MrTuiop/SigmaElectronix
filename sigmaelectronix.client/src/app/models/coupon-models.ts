export interface CouponDto {
  readonly id: number;
  readonly code: string;
  readonly description: string;
  readonly discountValue: number;
  readonly isPercentage: boolean;
  readonly minOrderAmount: number;
  readonly startDate: string; // ISO 8601
  readonly endDate: string;
  readonly maxUsageCount: number;
  readonly currentUsageCount: number;
  readonly isActive: boolean;
}

export interface CreateUpdateCouponDto {
  readonly code: string;
  readonly description: string;
  readonly discountValue: number;
  readonly isPercentage: boolean;
  readonly minOrderAmount: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly maxUsageCount: number;
  readonly isActive: boolean;
}

export interface ValidateCouponRequest {
  readonly code: string;
  readonly cartTotal: number;
}

export interface ValidateCouponResponse {
  readonly message: string;
  readonly coupon?: CouponDto;
}
