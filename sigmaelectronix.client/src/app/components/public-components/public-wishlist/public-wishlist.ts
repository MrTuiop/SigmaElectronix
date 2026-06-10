import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  LucideHeart, LucideX, LucideShoppingCart, LucidePackage, LucideStar, LucideCheck, LucideTrash2,
} from '@lucide/angular';
import { AuthModalComponent } from '../../auth-components/auth-modal/auth-modal';
import { WishlistService } from '../../../services/wishlist-service';
import { CartService } from '../../../services/cart-service';       // <-- добавлено
import { ToastService } from '../../../services/toast';             // <-- путь, как у вас

@Component({
  selector: 'app-public-wishlist',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, RouterModule,
    LucideHeart, LucideX, LucideShoppingCart, LucidePackage, LucideStar, LucideCheck, LucideTrash2,
    AuthModalComponent
  ],
  templateUrl: './public-wishlist.html',
  styleUrl: './public-wishlist.css'
})
export class PublicWishlistComponent {
  wishlistService = inject(WishlistService);
  private router = inject(Router);
  private cartService = inject(CartService);        // <-- инжектим
  private toastService = inject(ToastService);      // <-- инжектим
  private gradientCache = new Map<number, string>();

  showAuthModal = signal(false);

  items = computed(() => {
    const wishlistItems = this.wishlistService.wishlist()?.items || [];
    return wishlistItems.map(item => {
      let discount: number | undefined;
      if (item.discountPrice && item.discountPrice < item.price) {
        discount = Math.round(((item.price - item.discountPrice) / item.price) * 100);
      }

      return {
        ...item,
        discount,
        gradient: this.getGradient(item.productId)
      };
    });
  });

  removeFromWishlist(productId: number) {
    this.wishlistService.toggleItem(productId).subscribe({
      next: () => {
        // После переключения проверяем, что товар действительно удалён
        const stillInWishlist = this.wishlistService.isInWishlist(productId);
        if (!stillInWishlist) {
          this.toastService.info('Удалено из избранного');
        }
      },
      error: () => this.toastService.error('Не удалось удалить из избранного')
    });
  }

  isInCart(productId: number): boolean {
    const items = this.cartService.cart()?.items;
    return items ? items.some(i => i.productId === productId) : false;
  }

  addToCart(productId: number) {
    if (this.isInCart(productId)) {
      this.router.navigate(['/cart']);
      return;
    }

    const item = this.items().find(i => i.productId === productId);
    if (!item) return;

    const price = item.discountPrice || item.price;

    this.cartService.addItem({
      productId: productId,
      quantity: 1,
      price: price
    }).subscribe({
      next: () => this.toastService.success('Товар добавлен в корзину'),
      error: () => this.toastService.error('Ошибка при добавлении в корзину')
    });
  }

  openAuthModal() {
    this.showAuthModal.set(true);
  }

  closeAuthModal() {
    this.showAuthModal.set(false);
  }

  onAuthenticated() {
    this.closeAuthModal();
    this.router.navigate(['/profile/wishlist']);
  }

  getItemsWord(count: number): string {
    const words = ['товар', 'товара', 'товаров'];
    const cases = [2, 0, 1, 1, 1, 2];
    const index = (count % 100 > 4 && count % 100 < 20) ? 2 : cases[(count % 10 < 5) ? count % 10 : 5];
    return `${count} ${words[index]}`;
  }

  clearWishlist() {
    this.wishlistService.clearWishlist().subscribe({
      next: () => this.toastService.info('Избранное очищено'),
      error: () => this.toastService.error('Ошибка при очистке')
    });
  }

  private getGradient(productId: number): string {
    if (!this.gradientCache.has(productId)) {
      const gradients = [
        'linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)',
        'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)',
        'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #78350f 100%)',
      ];
      this.gradientCache.set(productId, gradients[Math.floor(Math.random() * gradients.length)]);
    }
    return this.gradientCache.get(productId)!;
  }
}
