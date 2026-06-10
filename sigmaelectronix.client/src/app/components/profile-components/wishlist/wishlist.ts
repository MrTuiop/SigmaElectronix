import { Component, inject, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideHeart, LucideX, LucideSmartphone, LucideHeadphones,
  LucideStar, LucideShoppingCart, LucidePackage
} from '@lucide/angular';
// 🎯 Подключаем наш новый сервис!
import { WishlistService } from '../../../services/wishlist-service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, RouterModule,
    LucideHeart, LucideX, LucideSmartphone, LucideHeadphones,
    LucideStar, LucideShoppingCart, LucidePackage
  ],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class WishlistComponent {
  wishlistService = inject(WishlistService);

  private gradientCache = new Map<number, string>();

  // 🎯 Динамически читаем товары из сервиса и добавляем им градиенты для UI
  items = computed(() => {
    const wishlistItems = this.wishlistService.wishlist()?.items || [];
    return wishlistItems.map(item => ({
      ...item,
      gradient: this.getGradient(item.productId)
    }));
  });

  removeFromWishlist(productId: number) {
    // Так как метод называется toggle (переключатель), 
    // клик по уже существующему товару просто удалит его из БД
    this.wishlistService.toggleItem(productId).subscribe();
  }

  addToCart(productId: number) {
    console.log(`Товар ${productId} добавлен в корзину`);
    // Позже здесь будет вызов CartService
  }

  private getGradient(productId: number): string {
    if (!this.gradientCache.has(productId)) {
      const gradients = [
        'linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)', // Красный
        'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)', // Фиолетовый
        'linear-gradient(135deg, #10b981 0%, #064e3b 100%)', // Изумрудный
        'linear-gradient(135deg, #f59e0b 0%, #78350f 100%)', // Оранжевый
      ];
      this.gradientCache.set(productId, gradients[Math.floor(Math.random() * gradients.length)]);
    }
    return this.gradientCache.get(productId)!;
  }
}
