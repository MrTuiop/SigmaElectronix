export interface CouponDto {
  id: number;
  code: string;
  description: string;
  discountValue: number;
  isPercentage: boolean;
  minOrderAmount: number;
  startDate: string; // ISO 8601 string из C# DateTime
  endDate: string;
  maxUsageCount: number;
  currentUsageCount: number;
  isActive: boolean;
}

export interface CreateUpdateCouponDto {
  code: string;
  description: string;
  discountValue: number;
  isPercentage: boolean;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  maxUsageCount: number;
  isActive: boolean;
}

export interface ValidateCouponRequest {
  code: string;
  cartTotal: number;
}

export interface ValidateCouponResponse {
  message: string;
  coupon?: CouponDto;
}
