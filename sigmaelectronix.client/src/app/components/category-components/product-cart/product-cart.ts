import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2,
  LucideStar, LucideShoppingCart, LucideHeart
} from '@lucide/angular';

export interface ProductCardData {
  id: number;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  isNew?: boolean;
  rating: number;
  reviews: number;
  gradient: string;
  icon: string;
}

@Component({
  selector: 'app-product-cart',
  standalone: true,
  imports: [
    CommonModule,
    LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2,
    LucideStar, LucideShoppingCart, LucideHeart
  ],
  templateUrl: './product-cart.html',
  styleUrl: './product-cart.css',
})
export class ProductCartComponent {
  @Input() product!: ProductCardData;
  @Output() addToCartClick = new EventEmitter<ProductCardData>();
  @Output() wishlistToggle = new EventEmitter<ProductCardData>();

  inWishlist = false; // можно сделать входным параметром, но для демо — локально

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCartClick.emit(this.product);
  }

  onToggleWishlist(event: Event): void {
    event.stopPropagation();
    this.inWishlist = !this.inWishlist;
    this.wishlistToggle.emit(this.product);
  }
}
