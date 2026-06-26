import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, effect, signal } from '@angular/core';
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
import { LanguageService } from '../../services/language-service';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ

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
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
  ],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
})
export class CartPage implements OnInit {
  private cartService = inject(CartService);
  private languageService = inject(LanguageService);

  private previousLanguage = signal<string>(this.languageService.currentLanguage());

  readonly cart = this.cartService.cart;
  readonly cartTotal = computed(() => this.cart()?.total ?? 0);

  // 👇 Перезагружаем корзину при смене языка
  private readonly languageEffect = effect(() => {
    const currentLang = this.languageService.currentLanguage();
    if (this.previousLanguage() !== currentLang) {
      this.previousLanguage.set(currentLang);
      this.cartService.loadCart().subscribe({
        error: () => console.error('Ошибка перезагрузки корзины при смене языка')
      });
    }
  });

  ngOnInit(): void {
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
