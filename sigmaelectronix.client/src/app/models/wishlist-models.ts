export interface WishlistDto {
  id: number;
  userId: string | null;
  items: WishlistItemDto[];
  totalItems: number;
}

export interface WishlistItemDto {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  price: number;

  // 🎯 Добавляем новые поля, чтобы TypeScript не ругался
  brandName?: string;
  averageRating: number;
  reviewsCount: number;
  discountPrice?: number;

  isNew: boolean;
}
