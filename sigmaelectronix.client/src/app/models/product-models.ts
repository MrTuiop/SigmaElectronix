import { PaginatedResponse } from './shared-models';

// ============ Базовые / общие DTO ============

export interface BrandSummaryDto {
  readonly id: number;
  readonly name: string;
  readonly slug?: string;
  readonly logoUrl?: string;
}

export interface ProductImageDto {
  readonly id: number;
  readonly url: string;
  readonly altText?: string;
  readonly sortOrder: number;
  readonly isPrimary: boolean;
}

export type ProductImageCreateDto = Omit<ProductImageDto, 'id'>;

// ============ Переводы ============

export interface ProductTranslationDto {
  readonly languageCode: string; // 'ru' | 'en' | 'uz'
  readonly name: string;
  readonly slug: string;
  readonly shortDescription: string;
  readonly fullDescription: string;
  readonly specifications: Readonly<Record<string, string>>;
  readonly tags: readonly string[];
}

// ============ Чтение ============

export interface ProductListDto {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly shortDescription: string;
  readonly price: number;
  readonly discountPrice: number | null;
  readonly finalPrice: number;
  readonly brand: BrandSummaryDto;
  readonly categoryName: string;
  readonly mainImageUrl: string;
  readonly averageRating: number;
  readonly reviewsCount: number;
  readonly isPublished: boolean;
  readonly isNew: boolean;
  readonly createdAt: string;
  readonly quantity?: number;
}

export interface ProductDetailDto {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly shortDescription: string;
  readonly fullDescription: string;
  readonly price: number;
  readonly discountPrice: number | null;
  readonly finalPrice: number;
  readonly discountPercent: number | null;
  readonly brand: BrandSummaryDto;
  readonly categoryId: number;
  readonly categoryName: string;
  readonly isPublished: boolean;
  readonly specifications: Readonly<Record<string, string>>;
  readonly tags: readonly string[];
  readonly averageRating: number;
  readonly reviewsCount: number;
  readonly images: readonly ProductImageDto[];
  readonly createdAt: string;
  readonly translations?: readonly ProductTranslationDto[];
}

// ============ Фильтры ============

export interface ProductFilterDto {
  readonly categoryId?: number;
  readonly brandIds?: readonly number[];
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly searchQuery?: string;
  readonly specifications?: Readonly<Record<string, readonly string[]>>;
  readonly sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'rating' | 'popular' | 'date_desc' | 'date_asc' | 'brand_asc' | 'brand_desc' | 'category_asc' | 'category_desc' | 'status_asc' | 'status_desc';
  readonly pageNumber?: number;
  readonly pageSize?: number;
}

export interface CategoryFilterDto {
  readonly minPrice: number;
  readonly maxPrice: number;
  readonly brands: readonly BrandSummaryDto[];
  readonly specifications: Readonly<Record<string, readonly string[]>>;
}

// ============ Создание / Обновление ============

export interface CreateProductDto {
  readonly price: number;
  readonly discountPrice?: number | null;
  readonly brandId: number;
  readonly categoryId: number;
  readonly isPublished: boolean;
  readonly images: readonly ProductImageCreateDto[];
  readonly translations: readonly ProductTranslationDto[];
}

export type UpdateProductDto = CreateProductDto;

// Реэкспорт PaginatedResponse для удобства
export type { PaginatedResponse };
