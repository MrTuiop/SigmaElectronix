import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideStar, LucideThumbsUp, LucideThumbsDown } from '@lucide/angular';
import { ReviewService } from '../../../services/review-service';
import { ProductService } from '../../../services/product-service';
import { ReviewDto } from '../../../models/review-models';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TranslateService, TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ

export type EnrichedReview = ReviewDto & { productName?: string; productSlug?: string };

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    CommonModule,
    LucideStar,
    LucideThumbsUp,
    LucideThumbsDown,
    DatePipe,
    RouterLink,
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
  ],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
})
export class ReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private productService = inject(ProductService);
  private translate = inject(TranslateService); // 👈 ИНЖЕКТ СЕРВИСА

  reviews = signal<EnrichedReview[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.reviewService.getMyReviews().subscribe({
      next: (reviewsData) => {
        if (reviewsData.length === 0) {
          this.reviews.set([]);
          this.isLoading.set(false);
          return;
        }

        const uniqueProductIds = [...new Set(reviewsData.map(r => r.productId))];

        const productRequests = uniqueProductIds.map(id =>
          this.productService.getProductById(id).pipe(
            map(product => ({ id, name: product.name, slug: product.slug })),
            catchError(() => of({
              id,
              // 👈 ПЕРЕВОДИМ Фоллбэк, если товар не найден
              name: `${this.translate.instant('PROFILE.REVIEWS.PRODUCT_FALLBACK')} #${id}`,
              slug: ''
            }))
          )
        );

        forkJoin(productRequests).subscribe(products => {
          const productMap = products.reduce((acc, curr) => {
            acc[curr.id] = { name: curr.name, slug: curr.slug };
            return acc;
          }, {} as Record<number, { name: string; slug: string }>);

          const enrichedReviews = reviewsData.map(review => ({
            ...review,
            productName: productMap[review.productId]?.name || review.title,
            productSlug: productMap[review.productId]?.slug || ''
          }));

          this.reviews.set(enrichedReviews);
          this.isLoading.set(false);
        });
      },
      error: (err) => {
        console.error('Ошибка загрузки отзывов:', err);
        this.isLoading.set(false);
      }
    });
  }
}
