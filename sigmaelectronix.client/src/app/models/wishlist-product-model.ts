export interface WishlistProduct {
  id: number;
  name: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  discount: number;
  rating: number;
  reviews: number;
  gradient: string;
  icon: string;
}
