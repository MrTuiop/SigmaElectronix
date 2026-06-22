// UI-модель для отображения товара в wishlist (не DTO)
export interface WishlistProduct {
  readonly id: number;
  readonly name: string;
  readonly brand: string;
  readonly price: number;
  readonly oldPrice: number | null;
  readonly discount: number;
  readonly rating: number;
  readonly reviews: number;
  readonly gradient: string;
  readonly icon: string;
}
