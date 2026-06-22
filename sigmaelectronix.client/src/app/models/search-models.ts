export interface SearchSuggestDto {
  readonly categories: readonly SuggestCategoryDto[];
  readonly brands: readonly SuggestBrandDto[];
  readonly products: readonly SuggestProductDto[];
}

export interface SuggestCategoryDto {
  readonly name: string;
  readonly slug: string;
}

export interface SuggestBrandDto {
  readonly name: string;
  readonly slug: string;
  readonly logoUrl?: string;
}

export interface SuggestProductDto {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly price: number;
  readonly discountPrice?: number;
  readonly imageUrl?: string;
}
