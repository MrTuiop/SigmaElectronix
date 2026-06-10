export interface SearchSuggestDto {
  categories: SuggestCategoryDto[];
  brands: SuggestBrandDto[];
  products: SuggestProductDto[];
}

export interface SuggestCategoryDto {
  name: string;
  slug: string;
}

export interface SuggestBrandDto {
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface SuggestProductDto {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
}
