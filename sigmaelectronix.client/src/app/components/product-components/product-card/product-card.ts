import { Component, Input, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  LucideHeart,
  LucideShoppingCart,
  LucideStar,
  LucidePackage,
  LucideCheck,
  LucideStarOff
} from '@lucide/angular';
import { WishlistService } from '../../../services/wishlist-service';
import { CartService } from '../../../services/cart-service';
import { ProductListDto } from '../../../models/product-models';
import { ToastService } from '../../../services/toast';
import { TranslateDirective } from '@ngx-translate/core';

// Экспортируем интерфейс отсюда, чтобы родители его использовали
export interface UiProduct extends ProductListDto {
  inWishlist: boolean;
  discount?: number;
  gradient?: string;
  // ✅ isNew уже наследуется из ProductListDto как обязательное поле boolean
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterModule,
    LucideHeart,
    LucideShoppingCart,
    LucideStar,
    LucideStarOff,
    LucidePackage,
    LucideCheck,
    TranslateDirective
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCardComponent {
  @Input({ required: true }) product!: UiProduct;
  @Input() brandName?: string;

  private wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  toggleWishlist(product: UiProduct): void {
    this.wishlistService.toggleItem(product.id).subscribe({
      next: () => {
        product.inWishlist = !product.inWishlist;

        if (product.inWishlist) {
          this.toastService.success('Добавлено в избранное');
        } else {
          this.toastService.info('Удалено из избранного');
        }
      },
      error: () => this.toastService.error('Не удалось обновить избранное')
    });
  }

  addToCart(product: UiProduct): void {
    if (this.isInCart(product.id)) {
      this.router.navigate(['/cart']);
      return;
    }

    const price = product.discountPrice || product.price;
    this.cartService.addItem({
      productId: product.id,
      quantity: 1,
      price: price
    }).subscribe({
      next: () => this.toastService.success('Товар добавлен в корзину'),
      error: () => this.toastService.error('Ошибка при добавлении в корзину')
    });
  }

  isInCart(productId: number): boolean {
    return this.cartService.isInCart(productId);
  }
}
