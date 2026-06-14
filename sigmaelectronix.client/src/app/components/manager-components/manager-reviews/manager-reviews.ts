import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../services/review-service';
import { ReviewDto } from '../../../models/review-models';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';
import {
  LucideMessageSquare, LucideCheck, LucideX,
  LucideTrash2, LucideStar
} from '@lucide/angular';

@Component({
  selector: 'app-manager-reviews',
  standalone: true,
  imports: [
    CommonModule, FormsModule, SpinnerComponent,
    LucideMessageSquare, LucideCheck, LucideX, LucideTrash2, LucideStar
  ],
  templateUrl: './manager-reviews.html',
  styleUrl: './manager-reviews.css'
})
export class ManagerReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);

  reviews = signal<ReviewDto[]>([]);
  loading = signal(true);

  // Состояние модального окна для ответа
  isModalOpen = signal(false);
  selectedReview = signal<ReviewDto | null>(null);
  adminResponse = signal('');

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading.set(true);
    this.reviewService.getPendingReviews().subscribe({
      next: (res) => {
        this.reviews.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // Одобрить отзыв (без ответа)
  approveReview(id: number): void {
    this.loading.set(true);
    this.reviewService.moderateReview(id, { isApproved: true }).subscribe({
      next: () => this.loadReviews(),
      error: () => this.loading.set(false)
    });
  }

  // Удалить/отклонить отзыв навсегда
  deleteReview(id: number): void {
    if (confirm('Точно удалить этот отзыв? Он будет безвозвратно удален.')) {
      this.loading.set(true);
      this.reviewService.deleteReview(id).subscribe({
        next: () => this.loadReviews(),
        error: () => this.loading.set(false)
      });
    }
  }

  // Открыть окно ответа магазина
  openReplyModal(review: ReviewDto): void {
    this.selectedReview.set(review);
    this.adminResponse.set('');
    this.isModalOpen.set(true);
  }

  closeReplyModal(): void {
    this.isModalOpen.set(false);
    this.selectedReview.set(null);
  }

  // Одобрить отзыв и добавить комментарий от магазина
  submitReplyAndApprove(): void {
    const review = this.selectedReview();
    if (!review) return;

    this.loading.set(true);
    this.reviewService.moderateReview(review.id, {
      isApproved: true,
      adminResponse: this.adminResponse()
    }).subscribe({
      next: () => {
        this.closeReplyModal();
        this.loadReviews();
      },
      error: () => this.loading.set(false)
    });
  }
}
