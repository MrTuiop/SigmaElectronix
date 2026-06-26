import { Component, signal, computed, OnInit, inject, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, KeyValuePipe, Location } from '@angular/common';
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
import { LanguageService } from '../../services/language-service';
import { TranslateService, TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ

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
    AuthModalComponent, ConfirmModalComponent,
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
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
  private location = inject(Location);
  private languageService = inject(LanguageService);
  private currentLocationService = inject(CurrentLocationService);
  private storeInventoryService = inject(StoreInventoryService);
  private storeService = inject(StoreService);
  private translate = inject(TranslateService); // 👈 ИНЖЕКТ СЕРВИСА

  private previousLanguage = signal<string>(this.languageService.currentLanguage());

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

  inventory = signal<StoreInventoryDto[]>([]);
  stores = signal<StoreDto[]>([]);
  showStoresModal = signal(false);

  currentCityName = computed(() => this.currentLocationService.currentCityName());

  storeAvailability = computed(() => {
    const inv = this.inventory();
    const st = this.stores();
    const city = this.currentCityName().toLowerCase().trim();
    const cityStores = st.filter(s => s.cityName.toLowerCase() === city && s.isActive);
    return cityStores.map(store => {
      const inventoryItem = inv.find(i => i.storeId === store.id);
      return { storeDetails: store, quantity: inventoryItem ? inventoryItem.quantity : 0 };
    });
  });

  inStockStoresCount = computed(() => this.storeAvailability().filter(item => item.quantity > 0).length);

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
  expandedReviews = signal<Set<number>>(new Set<number>());

  showConfirmModal = signal(false);
  confirmModalConfig = signal({
    title: '', message: '', confirmText: this.translate.instant('PRODUCT.MODALS.DELETE_BTN'), actionType: 'none' as 'review' | 'comment' | 'none', targetId: 0
  });

  openAuthModal(): void { this.showAuthModal.set(true); }
  closeAuthModal(): void { this.showAuthModal.set(false); }

  onAuthenticated(): void {
    this.showAuthModal.set(false);
    if (this.product()) this.loadReviews(this.product()!.id);
  }

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
      title: this.editReviewTitle() || this.translate.instant('PRODUCT.REVIEWS.NO_TITLE'), // 👈
      comment: this.editReviewText()
    };
    this.reviewService.updateReview(reviewId, dto).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('PRODUCT.TOASTS.REVIEW_UPDATED')); // 👈
        this.editingReviewId.set(null);
        this.loadReviews(this.product()!.id);
      },
      error: () => this.toastService.error(this.translate.instant('PRODUCT.TOASTS.REVIEW_UPDATE_ERROR')) // 👈
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
        this.toastService.success(this.translate.instant('PRODUCT.TOASTS.COMMENT_UPDATED')); // 👈
        this.editingCommentId.set(null);
        this.loadReviews(this.product()!.id);
      },
      error: () => this.toastService.error(this.translate.instant('PRODUCT.TOASTS.COMMENT_UPDATE_ERROR')) // 👈
    });
  }

  inWishlist = computed(() => {
    const p = this.product();
    return p ? this.wishlistService.isInWishlist(p.id) : false;
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) this.loadProduct(slug);
    });

    this.languageService.languageChanged$.subscribe(() => {
      const prod = this.product();
      if (!prod) return;
      this.productService.getProductBySlug(prod.slug).subscribe({
        next: (localized) => {
          this.product.set(localized);
          this.buildBreadcrumbs(localized);
          if (localized.slug !== prod.slug) {
            const newUrl = this.router.createUrlTree(['/product', localized.slug]).toString();
            this.location.replaceState(newUrl);
          }
        },
        error: (err) => console.error('Ошибка загрузки перевода:', err)
      });
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
        this.error.set(this.translate.instant('PRODUCT.ERROR_NOT_FOUND')); // 👈
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
        { label: this.translate.instant('PRODUCT.BREADCRUMBS.HOME'), slug: '' }, // 👈
        { label: this.translate.instant('PRODUCT.BREADCRUMBS.CATALOG'), slug: 'catalog' } // 👈
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
      if ((id && cat.id === id) || (name && cat.name === name)) return { category: cat, path };
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
      this.toastService.error(this.translate.instant('PRODUCT.TOASTS.REVIEW_EMPTY')); // 👈
      return;
    }
    this.isSubmittingReview.set(true);
    const dto = {
      productId: this.product()!.id,
      rating: this.newReviewRating(),
      title: this.newReviewTitle() || this.translate.instant('PRODUCT.REVIEWS.NO_TITLE'), // 👈
      comment: this.newReviewText()
    };
    this.reviewService.createReview(dto).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('PRODUCT.TOASTS.REVIEW_SENT')); // 👈
        this.newReviewText.set('');
        this.newReviewRating.set(5);
        this.isSubmittingReview.set(false);
      },
      error: () => {
        this.toastService.error(this.translate.instant('PRODUCT.TOASTS.REVIEW_ERROR')); // 👈
        this.isSubmittingReview.set(false);
      }
    });
  }

  reactToReview(reviewId: number, isLike: boolean): void {
    if (!this.authService.isAuthenticated()) { this.openAuthModal(); return; }
    this.reviews.update(current => current.map(r => {
      if (r.id === reviewId) {
        const isRemoving = r.userReaction === (isLike ? 'Like' : 'Dislike');
        let newLikes = r.likesCount, newDislikes = r.dislikesCount;
        if (r.userReaction === 'Like') newLikes--;
        if (r.userReaction === 'Dislike') newDislikes--;
        if (!isRemoving) { if (isLike) newLikes++; else newDislikes++; }
        return { ...r, likesCount: newLikes, dislikesCount: newDislikes, userReaction: isRemoving ? null : (isLike ? 'Like' : 'Dislike') };
      }
      return r;
    }));
    this.reviewService.reactToReview(reviewId, isLike).subscribe();
  }

  openReplyForm(reviewId: number): void {
    if (!this.authService.isAuthenticated()) { this.openAuthModal(); return; }
    this.replyingToReviewId.set(this.replyingToReviewId() === reviewId ? null : reviewId);
    this.newCommentText.set('');
  }

  submitComment(reviewId: number): void {
    if (!this.newCommentText().trim()) return;
    if (!this.authService.isAuthenticated()) { this.openAuthModal(); return; }
    this.reviewService.addComment(reviewId, this.newCommentText()).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('PRODUCT.TOASTS.COMMENT_ADDED')); // 👈
        this.replyingToReviewId.set(null);
        this.newCommentText.set('');
        this.loadReviews(this.product()!.id);
      },
      error: () => this.toastService.error(this.translate.instant('PRODUCT.TOASTS.COMMENT_ERROR')) // 👈
    });
  }

  reactToComment(commentId: number, isLike: boolean): void {
    if (!this.authService.isAuthenticated()) { this.openAuthModal(); return; }
    this.reviews.update(current => current.map(r => {
      return {
        ...r,
        comments: r.comments.map(c => {
          if (c.id === commentId) {
            const isRemoving = c.userReaction === (isLike ? 'Like' : 'Dislike');
            let newLikes = c.likesCount, newDislikes = c.dislikesCount;
            if (c.userReaction === 'Like') newLikes--;
            if (c.userReaction === 'Dislike') newDislikes--;
            if (!isRemoving) { if (isLike) newLikes++; else newDislikes++; }
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
    if (this.cartService.isInCart(p.id)) { this.router.navigate(['/cart']); return; }
    const price = p.discountPrice || p.price;
    this.cartService.addItem({ productId: p.id, quantity: this.quantity(), price: price }).subscribe({
      next: () => this.toastService.success(this.translate.instant('PRODUCT.TOASTS.ADD_TO_CART')), // 👈
      error: () => this.toastService.error(this.translate.instant('PRODUCT.TOASTS.ADD_TO_CART_ERROR')) // 👈
    });
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    this.wishlistService.toggleItem(p.id).subscribe({
      next: () => {
        if (this.wishlistService.isInWishlist(p.id)) {
          this.toastService.success(this.translate.instant('PRODUCT.TOASTS.WISHLIST_ADDED')); // 👈
        } else {
          this.toastService.info(this.translate.instant('PRODUCT.TOASTS.WISHLIST_REMOVED')); // 👈
        }
      },
      error: () => this.toastService.error(this.translate.instant('PRODUCT.TOASTS.WISHLIST_ERROR')) // 👈
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
  setImageIndex(index: number): void { this.activeImageIndex.set(index); }
  requestPriceAlert(): void { this.priceAlertRequested.set(true); }

  deleteReview(reviewId: number): void {
    this.confirmModalConfig.set({
      title: this.translate.instant('PRODUCT.MODALS.DELETE_REVIEW_TITLE'), // 👈
      message: this.translate.instant('PRODUCT.MODALS.DELETE_REVIEW_MSG'), // 👈
      confirmText: this.translate.instant('PRODUCT.MODALS.DELETE_BTN'), // 👈
      actionType: 'review', targetId: reviewId
    });
    this.showConfirmModal.set(true);
  }

  deleteComment(commentId: number): void {
    this.confirmModalConfig.set({
      title: this.translate.instant('PRODUCT.MODALS.DELETE_COMMENT_TITLE'), // 👈
      message: this.translate.instant('PRODUCT.MODALS.DELETE_COMMENT_MSG'), // 👈
      confirmText: this.translate.instant('PRODUCT.MODALS.DELETE_BTN'), // 👈
      actionType: 'comment', targetId: commentId
    });
    this.showConfirmModal.set(true);
  }

  onConfirmDelete(): void {
    const config = this.confirmModalConfig();
    this.showConfirmModal.set(false);
    if (config.actionType === 'review') {
      this.reviewService.deleteReview(config.targetId).subscribe({
        next: () => {
          this.toastService.success(this.translate.instant('PRODUCT.TOASTS.REVIEW_DELETED')); // 👈
          this.loadReviews(this.product()!.id);
        },
        error: () => this.toastService.error(this.translate.instant('PRODUCT.TOASTS.REVIEW_DELETE_ERROR')) // 👈
      });
    } else if (config.actionType === 'comment') {
      this.reviewService.deleteComment(config.targetId).subscribe({
        next: () => {
          this.toastService.success(this.translate.instant('PRODUCT.TOASTS.COMMENT_DELETED')); // 👈
          this.loadReviews(this.product()!.id);
        },
        error: () => this.toastService.error(this.translate.instant('PRODUCT.TOASTS.COMMENT_DELETE_ERROR')) // 👈
      });
    }
  }

  onCancelDelete(): void { this.showConfirmModal.set(false); }

  getReviewWord(count: number | undefined): string {
    if (count === undefined) return this.translate.instant('PRODUCT.REVIEWS.WORD_MANY');
    const value = Math.abs(count) % 100;
    const num = count % 10;
    if (value > 10 && value < 20) return this.translate.instant('PRODUCT.REVIEWS.WORD_MANY');
    if (num > 1 && num < 5) return this.translate.instant('PRODUCT.REVIEWS.WORD_FEW');
    if (num === 1) return this.translate.instant('PRODUCT.REVIEWS.WORD_SINGLE');
    return this.translate.instant('PRODUCT.REVIEWS.WORD_MANY');
  }

  getDeliveryDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }

  onQuantityChange(value: number): void {
    if (value > 10) this.quantity.set(10);
    else if (value < 1 || !value) this.quantity.set(1);
    else this.quantity.set(value);
  }
}
