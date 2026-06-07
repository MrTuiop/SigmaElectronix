import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
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
  LucideShieldCheck
} from '@lucide/angular';

interface CartItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  gradient: string;
  icon: string;
  quantity: number;
}

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
    LucideShieldCheck
  ],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartPage {
  items = signal<CartItem[]>([
    {
      id: 1,
      name: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      price: 129990,
      oldPrice: 139990,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: 'smartphone',
      quantity: 1
    },
    {
      id: 2,
      name: 'Sony WH-1000XM5',
      brand: 'Sony',
      price: 34990,
      oldPrice: 39990,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: 'headphones',
      quantity: 2
    },
    {
      id: 3,
      name: 'Apple MacBook Air M3',
      brand: 'Apple',
      price: 149990,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      icon: 'laptop',
      quantity: 1
    }
  ]);

  subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  total = computed(() => this.subtotal());

  increaseQuantity(itemId: number): void {
    this.items.update(items =>
      items.map(item =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  decreaseQuantity(itemId: number): void {
    this.items.update(items =>
      items
        .map(item =>
          item.id === itemId && item.quantity > 1
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  removeItem(itemId: number): void {
    this.items.update(items => items.filter(item => item.id !== itemId));
  }

  clearCart(): void {
    this.items.set([]);
  }

  checkout(): void {
    alert('Заказ оформлен! (заглушка)');
    this.clearCart();
  }
}
