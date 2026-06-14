import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CouponDto,
  CreateUpdateCouponDto,
  ValidateCouponRequest,
  ValidateCouponResponse
} from '../models/coupon-models';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/coupons';

  // ==========================================
  // ПУБЛИЧНЫЕ ЭНДПОИНТЫ (Для Корзины / Checkout)
  // ==========================================

  validateCoupon(code: string, cartTotal: number): Observable<ValidateCouponResponse> {
    const request: ValidateCouponRequest = { code, cartTotal };
    return this.http.post<ValidateCouponResponse>(`${this.baseUrl}/validate`, request);
  }

  // ==========================================
  // АДМИНИСТРАТИВНЫЕ ЭНДПОИНТЫ (CRUD)
  // ==========================================

  getAllCoupons(): Observable<CouponDto[]> {
    return this.http.get<CouponDto[]>(this.baseUrl);
  }

  getCouponById(id: number): Observable<CouponDto> {
    return this.http.get<CouponDto>(`${this.baseUrl}/${id}`);
  }

  createCoupon(dto: CreateUpdateCouponDto): Observable<CouponDto> {
    return this.http.post<CouponDto>(this.baseUrl, dto);
  }

  updateCoupon(id: number, dto: CreateUpdateCouponDto): Observable<CouponDto> {
    return this.http.put<CouponDto>(`${this.baseUrl}/${id}`, dto);
  }

  deleteCoupon(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
