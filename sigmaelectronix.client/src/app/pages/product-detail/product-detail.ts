import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2,
  LucideStar, LucideShoppingCart, LucideHeart, LucideShieldCheck, LucideTruck, LucideRefreshCw,
  LucideBell, LucideCheck, LucidePackage,
  LucideChevronLeft, LucideChevronRight,
  LucideThumbsUp, LucideThumbsDown, LucideMessageSquare, LucideUser, LucideSend,
  LucideEdit2, LucideX, LucideTrash2,
  LucideStore, LucideMapPin, LucideClock, LucideAward
} from '@lucide/angular';
import { ProductService } from '../../services/product-service';
import { CartService } from '../../services/cart-service';
import { WishlistService } from '../../services/wishlist-service';
import { ToastService } from '../../services/toast';
import { ReviewService } from '../../services/review-service';
import { AuthService } from '../../services/auth-service';

import { ProductDetailDto, ProductListDto } from '../../models/product-models';
import { ReviewDto } from '../../models/review-models';
import { AuthModalComponent } from '../../components/auth-components/auth-modal/auth-modal';
import { ConfirmModalComponent } from '../../components/shared-components/confirm-modal/confirm-modal';
import { CategoryService } from '../../services/category-service';

import { StoreInventoryService } from '../../services/store-inventory-service';
import { StoreService } from '../../services/store-service';
import { StoreInventoryDto } from '../../models/store-inventory-models';
import { StoreDto } from '../../models/store-models';
import { CurrentLocationService } from '../../services/current-location-service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, KeyValuePipe,
    LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2,
    LucideStar, LucideShoppingCart, LucideHeart, LucideShieldCheck, LucideTruck, LucideRefreshCw,
    LucideBell, LucideCheck, LucidePackage,
    LucideChevronLeft, LucideChevronRight,
    LucideThumbsUp, LucideThumbsDown, LucideMessageSquare, LucideUser, LucideSend, LucideEdit2, LucideX, LucideTrash2,
    LucideStore, LucideMapPin, LucideClock, LucideAward,
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
  public authService = inject(AuthService);
  private reviewService = inject(ReviewService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  private currentLocationService = inject(CurrentLocationService);

  private storeInventoryService = inject(StoreInventoryService);
  private storeService = inject(StoreService);

  breadcrumbs = signal<{ label: string; slug?: string }[]>([]);
  product = signal<ProductDetailDto | null>(null);
  relatedProducts = signal<ProductListDto[]>([]);
  reviews = signal<ReviewDto[]>([]);
  hasLeftReview = computed(() => this.reviews().some(r => r.isMine));

  isLoading = signal(true);
  error = signal<string | null>(null);

  activeImageIndex = signal(0);
  quantity = signal(1);
  priceAlertRequested = signal(false);

  // --- СОСТОЯНИЯ ДЛЯ ОСТАТКОВ И МАГАЗИНОВ ---
  inventory = signal<StoreInventoryDto[]>([]);
  stores = signal<StoreDto[]>([]);
  showStoresModal = signal(false);

  currentCityName = computed(() => this.currentLocationService.currentCityName());

  storeAvailability = computed(() => {
    const inv = this.inventory();
    const st = this.stores();
    const city = this.currentCityName().toLowerCase().trim();

    // 1. Оставляем только магазины текущего города (и активные)
    const cityStores = st.filter(s => s.cityName.toLowerCase() === city && s.isActive);

    // 2. Связываем их с инвентарем
    return cityStores.map(store => {
      const inventoryItem = inv.find(i => i.storeId === store.id);
      return {
        storeDetails: store,
        quantity: inventoryItem ? inventoryItem.quantity : 0
      };
    });
  });

  // 👇 Вычисляем, в скольких магазинах ТЕКУЩЕГО ГОРОДА товар есть в наличии
  inStockStoresCount = computed(() => {
    return this.storeAvailability().filter(item => item.quantity > 0).length;
  });

  // --- Состояния для отзывов ---
  newReviewRating = signal(5);
  newReviewText = signal('');
  isSubmittingReview = signal(false);

  replyingToReviewId = signal<number | null>(null);
  newCommentText = signal('');
  newReviewTitle = signal('');

  editingReviewId = signal<number | null>(null);
  editReviewRating = signal(5);
  editReviewTitle = signal('');
  editReviewText = signal('');

  editingCommentId = signal<number | null>(null);
  editCommentText = signal('');

  showAuthModal = signal(false);

  openAuthModal(): void { this.showAuthModal.set(true); }
  closeAuthModal(): void { this.showAuthModal.set(false); }

  onAuthenticated(): void {
    this.showAuthModal.set(false);
    if (this.product()) {
      this.loadReviews(this.product()!.id);
    }
  }

  expandedReviews = signal<Set<number>>(new Set<number>());

  toggleComments(reviewId: number): void {
    const current = new Set(this.expandedReviews());
    if (current.has(reviewId)) current.delete(reviewId);
    else current.add(reviewId);
    this.expandedReviews.set(current);
  }

  startEditReview(review: ReviewDto): void {
    this.editingReviewId.set(review.id);
    this.editReviewRating.set(review.rating);
    this.editReviewTitle.set(review.title);
    this.editReviewText.set(review.comment);
  }
  cancelEditReview(): void { this.editingReviewId.set(null); }

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

  startEditComment(comment: any): void {
    this.editingCommentId.set(comment.id);
    this.editCommentText.set(comment.text);
  }
  cancelEditComment(): void { this.editingCommentId.set(null); }

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
        this.buildBreadcrumbs(data);
        this.loadReviews(data.id);
        this.loadInventory(data.id);
        this.productService.getRelatedProducts(data.id, 4).subscribe({
          next: (related) => this.relatedProducts.set(related)
        });
      },
      error: () => {
        this.error.set('Товар не найден или удален');
        this.isLoading.set(false);
      }
    });
  }

  private loadInventory(productId: number): void {
    this.storeInventoryService.getInventoryByProduct(productId).subscribe({
      next: (inv) => this.inventory.set(inv),
      error: () => console.error('Не удалось загрузить остатки')
    });

    if (this.stores().length === 0) {
      this.storeService.getAllStores(false).subscribe({
        next: (st) => this.stores.set(st),
        error: () => console.error('Не удалось загрузить магазины')
      });
    }
  }

  private buildBreadcrumbs(product: any): void {
    const tree = this.categoryService.categoryTree();
    const generate = (categories: any[]) => {
      const crumbs: { label: string; slug?: string }[] = [
        { label: 'Главная', slug: '' },
        { label: 'Каталог', slug: 'catalog' }
      ];
      const result = this.findCategoryInTree(categories, product.categoryId, product.categoryName);
      if (result) {
        result.path.forEach(p => crumbs.push({ label: p.name, slug: `catalog/${p.slug}` }));
        crumbs.push({ label: result.category.name, slug: `catalog/${result.category.slug}` });
      } else if (product.categoryName) {
        crumbs.push({ label: product.categoryName, slug: 'catalog' });
      }
      crumbs.push({ label: product.name });
      this.breadcrumbs.set(crumbs);
    };

    if (tree.length === 0) {
      this.categoryService.loadTree().subscribe(loadedTree => generate(loadedTree));
    } else {
      generate(tree);
    }
  }

  private findCategoryInTree(categories: any[], id: number, name: string, path: any[] = []): { category: any, path: any[] } | null {
    for (const cat of categories) {
      if ((id && cat.id === id) || (name && cat.name === name)) {
        return { category: cat, path };
      }
      if (cat.subCategories && cat.subCategories.length > 0) {
        const found = this.findCategoryInTree(cat.subCategories, id, name, [...path, cat]);
        if (found) return found;
      }
    }
    return null;
  }

  private loadReviews(productId: number): void {
    this.reviewService.getProductReviews(productId).subscribe({
      next: (res) => this.reviews.set(res),
      error: () => console.error('Не удалось загрузить отзывы')
    });
  }

  setRating(stars: number): void { this.newReviewRating.set(stars); }

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
      comment: this.newReviewText()
    };
    this.reviewService.createReview(dto).subscribe({
      next: () => {
        this.toastService.success('Отзыв отправлен на модерацию');
        this.newReviewText.set('');
        this.newReviewRating.set(5);
        this.isSubmittingReview.set(false);
      },
      error: () => {
        this.toastService.error('Ошибка отправки отзыва');
        this.isSubmittingReview.set(false);
      }
    });
  }

  reactToReview(reviewId: number, isLike: boolean): void {
    if (!this.authService.isAuthenticated()) {
      this.openAuthModal();
      return;
    }
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
    this.reviewService.reactToReview(reviewId, isLike).subscribe();
  }

  openReplyForm(reviewId: number): void {
    if (!this.authService.isAuthenticated()) {
      this.openAuthModal();
      return;
    }
    this.replyingToReviewId.set(this.replyingToReviewId() === reviewId ? null : reviewId);
    this.newCommentText.set('');
  }

  submitComment(reviewId: number): void {
    if (!this.newCommentText().trim()) return;
    if (!this.authService.isAuthenticated()) {
      this.openAuthModal();
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
      this.openAuthModal();
      return;
    }
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

  addToCart(): void {
    const p = this.product();
    if (!p) return;

    // 1. Если товар уже в корзине — не добавляем снова, а переходим в корзину
    if (this.cartService.isInCart(p.id)) {
      this.router.navigate(['/cart']);
      return;
    }

    // 2. Если товара еще нет — добавляем
    const price = p.discountPrice || p.price;
    this.cartService.addItem({
      productId: p.id,
      quantity: this.quantity(),
      price: price
    }).subscribe({
      next: () => {
        this.toastService.success('Товар добавлен в корзину');

        // 💡 ОПЦИОНАЛЬНО: Если вы хотите, чтобы юзера перекидывало в корзину 
        // СРАЗУ ЖЕ после первого нажатия (автоматически), раскомментируйте строку ниже:
        // this.router.navigate(['/cart']);
      },
      error: () => this.toastService.error('Ошибка при добавлении в корзину')
    });
  }

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
    this.showConfirmModal.set(false);
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
    title: '', message: '', confirmText: 'Удалить', actionType: 'none' as 'review' | 'comment' | 'none', targetId: 0
  });

  getReviewWord(count: number | undefined): string {
    if (count === undefined) return 'отзывов';
    const value = Math.abs(count) % 100;
    const num = count % 10;
    if (value > 10 && value < 20) return 'отзывов';
    if (num > 1 && num < 5) return 'отзыва';
    if (num === 1) return 'отзыв';
    return 'отзывов';
  }

  getDeliveryDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }

  // Проверка ручного ввода количества товара
  onQuantityChange(value: number): void {
    if (value > 10) {
      this.quantity.set(10); // Если ввели больше 10, сбрасываем до 10
    } else if (value < 1 || !value) {
      this.quantity.set(1);  // Если ввели меньше 1 или удалили цифру, ставим 1
    } else {
      this.quantity.set(value);
    }
  }
}
