import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideTrash2,
  LucidePlus,
  LucideMinus,
  LucideShoppingCart,
  LucideTag,
  LucideTruck,
  LucideArrowRight,
  LucidePercent,
  LucideShieldCheck,
  LucidePackage,
} from '@lucide/angular';
import { CartService } from '../../services/cart-service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideTrash2,
    LucidePlus,
    LucideMinus,
    LucideShoppingCart,
    LucideTag,
    LucideTruck,
    LucideArrowRight,
    LucidePercent,
    LucideShieldCheck,
    LucidePackage,
  ],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
})
export class CartPage implements OnInit {
  private cartService = inject(CartService);

  // Прямой доступ к сигналу корзины
  readonly cart = this.cartService.cart;

  // Сумма заказа берётся прямо из серверного DTO
  readonly cartTotal = computed(() => this.cart()?.total ?? 0);

  ngOnInit(): void {
    // Загружаем актуальную корзину при входе на страницу
    this.cartService.loadCart().subscribe();
  }

  increaseQuantity(itemId: number): void {
    const item = this.cart()?.items.find(i => i.id === itemId);
    if (item) {
      this.cartService.updateItemQuantity(itemId, item.quantity + 1).subscribe();
    }
  }

  decreaseQuantity(itemId: number): void {
    const item = this.cart()?.items.find(i => i.id === itemId);
    if (!item) return;

    if (item.quantity > 1) {
      this.cartService.updateItemQuantity(itemId, item.quantity - 1).subscribe();
    } else {
      // Если количество 1 — удаляем товар
      this.removeItem(itemId);
    }
  }

  removeItem(itemId: number): void {
    this.cartService.removeItem(itemId).subscribe();
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe();
  }
}
