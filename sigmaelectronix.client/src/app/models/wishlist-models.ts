import { WishlistProduct } from './wishlist-product-models';

export interface WishlistDto {
  readonly id: number;
  readonly userId: string | null;
  readonly items: readonly WishlistItemDto[];
  readonly totalItems: number;
}

export interface WishlistItemDto {
  readonly id: number;
  readonly productId: number;
  readonly productName: string;
  readonly productImage: string | null;
  readonly price: number;
  readonly brandName?: string;
  readonly averageRating: number;
  readonly reviewsCount: number;
  readonly discountPrice?: number;
  readonly isNew: boolean;
}

// Реэкспортируем для удобства
export type { WishlistProduct };
