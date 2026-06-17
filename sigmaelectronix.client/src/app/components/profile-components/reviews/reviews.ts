import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router'; // 🆕 Импортируем RouterLink для работы ссылок
import { LucideStar, LucideThumbsUp, LucideThumbsDown } from '@lucide/angular';
import { ReviewService } from '../../../services/review-service';
import { ProductService } from '../../../services/product-service';
import { ReviewDto } from '../../../models/review-models';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Расширяем тип, добавляя и productName, и productSlug
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
    RouterLink // 🆕 Обязательно добавляем RouterLink в импорты standalone-компонента
  ],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
})
export class ReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private productService = inject(ProductService);

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

        // 🆕 Теперь запрашиваем у productService и name, и slug товара
        const productRequests = uniqueProductIds.map(id =>
          this.productService.getProductById(id).pipe(
            map(product => ({ id, name: product.name, slug: product.slug })),
            catchError(() => of({ id, name: `Товар #${id}`, slug: '' }))
          )
        );

        forkJoin(productRequests).subscribe(products => {
          // Переделываем кэш-словарь, чтобы он хранил и имя, и slug
          const productMap = products.reduce((acc, curr) => {
            acc[curr.id] = { name: curr.name, slug: curr.slug };
            return acc;
          }, {} as Record<number, { name: string; slug: string }>);

          // Обогащаем наши отзывы именами и слагами для роутинга
          const enrichedReviews = reviewsData.map(review => ({
            ...review,
            productName: productMap[review.productId]?.name || review.title,
            productSlug: productMap[review.productId]?.slug || '' // 🆕 Добавляем slug
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
