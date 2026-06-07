import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideHeart, LucideX, LucideSmartphone, LucideHeadphones, LucideStar, LucideShoppingCart } from '@lucide/angular';
import { ProfileService } from '../../../services/profile-service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule, LucideHeart, LucideX, LucideSmartphone, LucideHeadphones, LucideStar, LucideShoppingCart
  ],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class WishlistComponent {
  data = inject(ProfileService);
}
