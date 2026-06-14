import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReviewDto, CreateReviewDto, ModerateReviewDto } from '../models/review-models';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/reviews';

  // ==========================================
  //         ДЛЯ ОБЫЧНЫХ ПОЛЬЗОВАТЕЛЕЙ
  // ==========================================

  /**
   * Получить список одобренных отзывов для конкретного товара (витрина)
   */
  getProductReviews(productId: number): Observable<ReviewDto[]> {
    return this.http.get<ReviewDto[]>(`${this.baseUrl}/product/${productId}`);
  }

  /**
   * Получить все отзывы текущего пользователя (для личного кабинета)
   */
  getMyReviews(): Observable<ReviewDto[]> {
    return this.http.get<ReviewDto[]>(`${this.baseUrl}/my-reviews`, { withCredentials: true });
  }

  /**
   * Написать новый отзыв (он уйдет на модерацию)
   */
  createReview(dto: CreateReviewDto): Observable<ReviewDto> {
    return this.http.post<ReviewDto>(this.baseUrl, dto, { withCredentials: true });
  }

  // ==========================================
  //         ДЛЯ АДМИНИСТРАТОРОВ / МЕНЕДЖЕРОВ
  // ==========================================

  /**
   * Получить список отзывов, ожидающих модерации (для админки)
   */
  getPendingReviews(): Observable<ReviewDto[]> {
    return this.http.get<ReviewDto[]>(`${this.baseUrl}/pending`, { withCredentials: true });
  }

  /**
   * Одобрить или отклонить отзыв (можно добавить ответ магазина)
   */
  moderateReview(reviewId: number, dto: ModerateReviewDto): Observable<ReviewDto> {
    return this.http.put<ReviewDto>(`${this.baseUrl}/${reviewId}/moderate`, dto, { withCredentials: true });
  }

  /**
   * Полностью удалить отзыв
   */
  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${reviewId}`, { withCredentials: true });
  }

  /**
 * Добавить комментарий к отзыву
 */
  addComment(reviewId: number, text: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${reviewId}/comments`, { text }, { withCredentials: true });
  }

  /**
   * Поставить лайк/дизлайк отзыву (isLike: true — лайк, false — дизлайк)
   */
  reactToReview(reviewId: number, isLike: boolean): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${reviewId}/react`, { isLike }, { withCredentials: true });
  }

  /**
   * Поставить лайк/дизлайк комментарию
   */
  reactToComment(commentId: number, isLike: boolean): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/comments/${commentId}/react`, { isLike }, { withCredentials: true });
  }

  updateReview(reviewId: number, dto: CreateReviewDto): Observable<ReviewDto> {
    return this.http.put<ReviewDto>(`${this.baseUrl}/${reviewId}`, dto, { withCredentials: true });
  }

  updateComment(commentId: number, text: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/comments/${commentId}`, { text }, { withCredentials: true });
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/comments/${commentId}`, { withCredentials: true });
  }
}
