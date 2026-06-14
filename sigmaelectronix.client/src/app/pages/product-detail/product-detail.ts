import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2,
  LucideStar, LucideShoppingCart, LucideHeart, LucideShieldCheck, LucideTruck, LucideRefreshCw,
  LucideBell, LucideCheck, LucidePackage,
  LucideChevronLeft, LucideChevronRight,
  LucideThumbsUp, LucideThumbsDown, LucideMessageSquare, LucideUser, LucideSend, // <-- НОВЫЕ ИКОНКИ
  LucideEdit2,
  LucideX,
  LucideTrash2
} from '@lucide/angular';
import { ProductService } from '../../services/product-service';
import { CartService } from '../../services/cart-service';
import { WishlistService } from '../../services/wishlist-service';
import { ToastService } from '../../services/toast';
import { ReviewService } from '../../services/review-service'; // <-- ТВОЙ СЕРВИС
import { AuthService } from '../../services/auth-service';     // <-- СЕРВИС АВТОРИЗАЦИИ

import { ProductDetailDto } from '../../models/product-models';
import { ProductListDto } from '../../models/brand-models';
import { ReviewDto } from '../../models/review-models'; // Убедись в правильности пути
import { AuthModalComponent } from '../../components/auth-components/auth-modal/auth-modal';
import { ConfirmModalComponent } from '../../components/shared-components/confirm-modal/confirm-modal';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    KeyValuePipe,
    LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2,
    LucideStar, LucideShoppingCart, LucideHeart, LucideShieldCheck, LucideTruck, LucideRefreshCw,
    LucideBell, LucideCheck, LucidePackage,
    LucideChevronLeft, LucideChevronRight,
    LucideThumbsUp, LucideThumbsDown, LucideMessageSquare, LucideUser, LucideSend, LucideEdit2, LucideX, LucideTrash2,
    AuthModalComponent, ConfirmModalComponent
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailPage implements OnInit {
  protected readonly Math = Math;

  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  public cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService); // <-- Делаем public для HTML
  private reviewService = inject(ReviewService);

  product = signal<ProductDetailDto | null>(null);
  relatedProducts = signal<ProductListDto[]>([]);
  reviews = signal<ReviewDto[]>([]); // <-- Сигнал для отзывов
  hasLeftReview = computed(() => this.reviews().some(r => r.isMine));

  isLoading = signal(true);
  error = signal<string | null>(null);

  activeImageIndex = signal(0);
  quantity = signal(1);
  priceAlertRequested = signal(false);

  // --- Состояния для отзывов ---
  newReviewRating = signal(5);
  newReviewText = signal('');
  isSubmittingReview = signal(false);

  // --- Состояния для комментариев ---
  replyingToReviewId = signal<number | null>(null);
  newCommentText = signal('');
  newReviewTitle = signal('');

  // --- Состояния для РЕДАКТИРОВАНИЯ ---
  editingReviewId = signal<number | null>(null);
  editReviewRating = signal(5);
  editReviewTitle = signal('');
  editReviewText = signal('');

  editingCommentId = signal<number | null>(null);
  editCommentText = signal('');

  showAuthModal = signal(false);

  openAuthModal(): void {
    this.showAuthModal.set(true);
  }

  closeAuthModal(): void {
    this.showAuthModal.set(false);
  }

  onAuthenticated(): void {
    this.showAuthModal.set(false);
    // При успешном входе обновляем отзывы, чтобы подтянулась инфа (лайки и т.д.)
    if (this.product()) {
      this.loadReviews(this.product()!.id);
    }
  }

  // --- Состояния для сворачивания комментариев ---
  expandedReviews = signal<Set<number>>(new Set<number>());

  // Метод для переключения видимости комментариев
  toggleComments(reviewId: number): void {
    const current = new Set(this.expandedReviews());
    if (current.has(reviewId)) {
      current.delete(reviewId);
    } else {
      current.add(reviewId);
    }
    this.expandedReviews.set(current);
  }

  // ===== МЕТОДЫ РЕДАКТИРОВАНИЯ ОТЗЫВА =====
  startEditReview(review: ReviewDto): void {
    this.editingReviewId.set(review.id);
    this.editReviewRating.set(review.rating);
    this.editReviewTitle.set(review.title);
    this.editReviewText.set(review.comment);
  }

  cancelEditReview(): void {
    this.editingReviewId.set(null);
  }

  saveEditReview(reviewId: number): void {
    if (!this.editReviewText().trim()) return;

    const dto = {
      productId: this.product()!.id,
      rating: this.editReviewRating(),
      title: this.editReviewTitle() || 'Без заголовка',
      comment: this.editReviewText()
    };

    this.reviewService.updateReview(reviewId, dto).subscribe({
      next: () => {
        this.toastService.success('Отзыв обновлен и отправлен на модерацию');
        this.editingReviewId.set(null);
        this.loadReviews(this.product()!.id);
      },
      error: () => this.toastService.error('Ошибка при обновлении отзыва')
    });
  }

  // ===== МЕТОДЫ РЕДАКТИРОВАНИЯ КОММЕНТАРИЯ =====
  startEditComment(comment: any): void {
    this.editingCommentId.set(comment.id);
    this.editCommentText.set(comment.text);
  }

  cancelEditComment(): void {
    this.editingCommentId.set(null);
  }

  saveEditComment(commentId: number): void {
    if (!this.editCommentText().trim()) return;

    this.reviewService.updateComment(commentId, this.editCommentText()).subscribe({
      next: () => {
        this.toastService.success('Комментарий обновлен');
        this.editingCommentId.set(null);
        this.loadReviews(this.product()!.id);
      },
      error: () => this.toastService.error('Ошибка при обновлении комментария')
    });
  }

  inWishlist = computed(() => {
    const p = this.product();
    return p ? this.wishlistService.isInWishlist(p.id) : false;
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadProduct(slug);
      }
    });
  }

  private loadProduct(slug: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.productService.getProductBySlug(slug).subscribe({
      next: (data) => {
        this.product.set(data);
        this.isLoading.set(false);
        this.activeImageIndex.set(0);
        this.quantity.set(1);

        // Загружаем отзывы и похожие товары
        this.loadReviews(data.id);

        this.productService.getRelatedProducts(data.id, 4).subscribe({
          next: (related) => this.relatedProducts.set(related)
        });
      },
      error: (err) => {
        this.error.set('Товар не найден или удален');
        this.isLoading.set(false);
      }
    });
  }

  // ==========================================
  //               ЛОГИКА ОТЗЫВОВ
  // ==========================================

  private loadReviews(productId: number): void {
    this.reviewService.getProductReviews(productId).subscribe({
      next: (res) => this.reviews.set(res),
      error: () => console.error('Не удалось загрузить отзывы')
    });
  }

  setRating(stars: number): void {
    this.newReviewRating.set(stars);
  }

  submitReview(): void {
    if (!this.newReviewText().trim()) {
      this.toastService.error('Напишите текст отзыва');
      return;
    }

    this.isSubmittingReview.set(true);
    const dto = {
      productId: this.product()!.id,
      rating: this.newReviewRating(),
      title: this.newReviewTitle() || 'Без заголовка',
      comment: this.newReviewText() // Или 'text', зависит от твоей CreateReviewDto
    };

    this.reviewService.createReview(dto).subscribe({
      next: () => {
        this.toastService.success('Отзыв отправлен на модерацию');
        this.newReviewText.set('');
        this.newReviewRating.set(5);
        this.isSubmittingReview.set(false);
        // Опционально: можно перезагрузить отзывы, если модерация не строгая
      },
      error: () => {
        this.toastService.error('Ошибка отправки отзыва');
        this.isSubmittingReview.set(false);
      }
    });
  }

  reactToReview(reviewId: number, isLike: boolean): void {
    if (!this.authService.isAuthenticated()) {
      this.openAuthModal(); // <-- Открываем модалку
      return;
    }

    // 1. МГНОВЕННО обновляем UI (Оптимистичный UI)
    this.reviews.update(current => current.map(r => {
      if (r.id === reviewId) {
        const isRemoving = r.userReaction === (isLike ? 'Like' : 'Dislike');
        let newLikes = r.likesCount;
        let newDislikes = r.dislikesCount;

        if (r.userReaction === 'Like') newLikes--;
        if (r.userReaction === 'Dislike') newDislikes--;

        if (!isRemoving) {
          if (isLike) newLikes++;
          else newDislikes++;
        }

        return {
          ...r,
          likesCount: newLikes,
          dislikesCount: newDislikes,
          userReaction: isRemoving ? null : (isLike ? 'Like' : 'Dislike')
        };
      }
      return r;
    }));

    // 2. Отправляем на сервер в фоне (без перезагрузки списка)
    this.reviewService.reactToReview(reviewId, isLike).subscribe();
  }

  // ==========================================
  //             ЛОГИКА КОММЕНТАРИЕВ
  // ==========================================

  openReplyForm(reviewId: number): void {
    if (!this.authService.isAuthenticated()) {
      this.openAuthModal(); // <-- Открываем модалку
      return;
    }
    this.replyingToReviewId.set(this.replyingToReviewId() === reviewId ? null : reviewId);
    this.newCommentText.set('');
  }

  submitComment(reviewId: number): void {
    if (!this.newCommentText().trim()) return;

    if (!this.authService.isAuthenticated()) {
      this.openAuthModal(); // <-- Открываем модалку
      return;
    }

    this.reviewService.addComment(reviewId, this.newCommentText()).subscribe({
      next: () => {
        this.toastService.success('Комментарий добавлен');
        this.replyingToReviewId.set(null);
        this.newCommentText.set('');
        this.loadReviews(this.product()!.id);
      },
      error: () => this.toastService.error('Ошибка добавления комментария')
    });
  }

  reactToComment(commentId: number, isLike: boolean): void {
    if (!this.authService.isAuthenticated()) {
      this.openAuthModal(); // <-- Открываем модалку
      return;
    }

    if (!this.authService.isAuthenticated()) return;

    // Мгновенное обновление лайков у комментария
    this.reviews.update(current => current.map(r => {
      return {
        ...r,
        comments: r.comments.map(c => {
          if (c.id === commentId) {
            const isRemoving = c.userReaction === (isLike ? 'Like' : 'Dislike');
            let newLikes = c.likesCount;
            let newDislikes = c.dislikesCount;

            if (c.userReaction === 'Like') newLikes--;
            if (c.userReaction === 'Dislike') newDislikes--;

            if (!isRemoving) {
              if (isLike) newLikes++;
              else newDislikes++;
            }

            return { ...c, likesCount: newLikes, dislikesCount: newDislikes, userReaction: isRemoving ? null : (isLike ? 'Like' : 'Dislike') };
          }
          return c;
        })
      };
    }));

    this.reviewService.reactToComment(commentId, isLike).subscribe();
  }



  // 🔹 4. Реальное добавление в корзину (с тостом)
  addToCart(): void {
    const p = this.product();
    if (!p) return;
    const price = p.discountPrice || p.price;
    this.cartService.addItem({
      productId: p.id,
      quantity: this.quantity(),
      price: price
    }).subscribe({
      next: () => this.toastService.success('Товар добавлен в корзину'),
      error: () => this.toastService.error('Ошибка при добавлении в корзину')
    });
  }

  // 🔹 5. Реальное добавление в избранное с уведомлением
  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    this.wishlistService.toggleItem(p.id).subscribe({
      next: () => {
        const isNowInWishlist = this.wishlistService.isInWishlist(p.id);
        if (isNowInWishlist) {
          this.toastService.success('Добавлено в избранное');
        } else {
          this.toastService.info('Удалено из избранного');
        }
      },
      error: () => this.toastService.error('Не удалось обновить избранное')
    });
  }

  // Навигация по картинкам
  nextImage(): void {
    const images = this.product()?.images;
    if (!images || images.length === 0) return;
    this.activeImageIndex.update(i => (i + 1) % images.length);
  }

  prevImage(): void {
    const images = this.product()?.images;
    if (!images || images.length === 0) return;
    this.activeImageIndex.update(i => (i - 1 + images.length) % images.length);
  }

  setImageIndex(index: number): void {
    this.activeImageIndex.set(index);
  }

  requestPriceAlert(): void {
    this.priceAlertRequested.set(true);
  }

  deleteReview(reviewId: number): void {
    this.confirmModalConfig.set({
      title: 'Удалить отзыв?',
      message: 'Вы действительно хотите удалить этот отзыв? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      actionType: 'review',
      targetId: reviewId
    });
    this.showConfirmModal.set(true);
  }

  deleteComment(commentId: number): void {
    this.confirmModalConfig.set({
      title: 'Удалить комментарий?',
      message: 'Вы уверены, что хотите удалить свой комментарий?',
      confirmText: 'Удалить',
      actionType: 'comment',
      targetId: commentId
    });
    this.showConfirmModal.set(true);
  }

  onConfirmDelete(): void {
    const config = this.confirmModalConfig();
    this.showConfirmModal.set(false); // Сразу закрываем модалку

    if (config.actionType === 'review') {
      this.reviewService.deleteReview(config.targetId).subscribe({
        next: () => {
          this.toastService.success('Отзыв удален');
          this.loadReviews(this.product()!.id);
        },
        error: () => this.toastService.error('Ошибка при удалении отзыва')
      });
    } else if (config.actionType === 'comment') {
      this.reviewService.deleteComment(config.targetId).subscribe({
        next: () => {
          this.toastService.success('Комментарий удален');
          this.loadReviews(this.product()!.id);
        },
        error: () => this.toastService.error('Ошибка при удалении комментария')
      });
    }
  }

  onCancelDelete(): void {
    this.showConfirmModal.set(false);
  }

  showConfirmModal = signal(false);
  confirmModalConfig = signal({
    title: '',
    message: '',
    confirmText: 'Удалить',
    actionType: 'none' as 'review' | 'comment' | 'none',
    targetId: 0
  });
}
