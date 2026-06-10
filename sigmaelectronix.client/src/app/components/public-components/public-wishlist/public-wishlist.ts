import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  LucideHeart, LucideX, LucideShoppingCart, LucidePackage, LucideStar // 🎯 Добавили звезду
} from '@lucide/angular';
import { AuthModalComponent } from '../../auth-components/auth-modal/auth-modal';
import { WishlistService } from '../../../services/wishlist-service';

@Component({
  selector: 'app-public-wishlist',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, RouterModule,
    LucideHeart, LucideX, LucideShoppingCart, LucidePackage, LucideStar,
    AuthModalComponent
  ],
  templateUrl: './public-wishlist.html',
  styleUrl: './public-wishlist.css'
})
export class PublicWishlistComponent {
  wishlistService = inject(WishlistService);
  private router = inject(Router);
  private gradientCache = new Map<number, string>();

  showAuthModal = signal(false);

  items = computed(() => {
    const wishlistItems = this.wishlistService.wishlist()?.items || [];
    return wishlistItems.map(item => {
      // 🎯 Математика для бейджа скидки
      let discount: number | undefined;
      if (item.discountPrice && item.discountPrice < item.price) {
        discount = Math.round(((item.price - item.discountPrice) / item.price) * 100);
      }

      return {
        ...item,
        discount, // Прокидываем скидку в UI
        gradient: this.getGradient(item.productId)
      };
    });
  });

  removeFromWishlist(productId: number) {
    this.wishlistService.toggleItem(productId).subscribe();
  }

  addToCart(productId: number) {
    console.log(`Товар ${productId} добавлен в корзину`);
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

  // 🎯 Умный метод для склонения слова "товар" (1 товар, 2 товара, 5 товаров)
  getItemsWord(count: number): string {
    const words = ['товар', 'товара', 'товаров'];
    const cases = [2, 0, 1, 1, 1, 2];
    const index = (count % 100 > 4 && count % 100 < 20) ? 2 : cases[(count % 10 < 5) ? count % 10 : 5];
    return `${count} ${words[index]}`;
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
