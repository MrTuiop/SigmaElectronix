import { Component, inject, computed, effect, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  LucideHeart, LucideX, LucideSmartphone, LucideHeadphones,
  LucideStar, LucideShoppingCart, LucidePackage, LucideCheck
} from '@lucide/angular';
import { WishlistService } from '../../../services/wishlist-service';
import { CartService } from '../../../services/cart-service';
import { ToastService } from '../../../services/toast';
import { LanguageService } from '../../../services/language-service'; // 👈 Импортируем

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, RouterModule,
    LucideHeart, LucideX, LucideSmartphone, LucideHeadphones,
    LucideStar, LucideShoppingCart, LucidePackage, LucideCheck
  ],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class WishlistComponent {
  wishlistService = inject(WishlistService);
  cartService = inject(CartService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private languageService = inject(LanguageService); // 👈 Инжектим

  private previousLanguage = signal<string>(this.languageService.currentLanguage());

  private gradientCache = new Map<number, string>();

  items = computed(() => {
    const wishlistItems = this.wishlistService.wishlist()?.items || [];
    return wishlistItems.map(item => ({
      ...item,
      gradient: this.getGradient(item.productId)
    }));
  });

  // 👇 Перезагружаем вишлист при смене языка
  private readonly languageEffect = effect(() => {
    const currentLang = this.languageService.currentLanguage();
    if (this.previousLanguage() !== currentLang) {
      this.previousLanguage.set(currentLang);
      // Перезагружаем вишлист с сервера — товары придут с новыми переводами
      this.wishlistService.loadWishlist().subscribe({
        error: () => console.error('Ошибка перезагрузки вишлиста при смене языка')
      });
    }
  });

  removeFromWishlist(productId: number) {
    this.wishlistService.toggleItem(productId).subscribe();
  }

  addToCart(item: any) {
    if (this.cartService.isInCart(item.productId)) {
      this.router.navigate(['/cart']);
      return;
    }

    this.cartService.addItem({
      productId: item.productId,
      quantity: 1,
      price: item.price
    }).subscribe({
      next: () => this.toastService.success('Товар добавлен в корзину'),
      error: () => this.toastService.error('Ошибка при добавлении в корзину')
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
