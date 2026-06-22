import { BrandSummaryDto, ProductListDto } from './product-models';
import { PaginatedResponse } from './shared-models';

// ============ DTO для чтения ============

// BrandSummaryDto импортирован из product-models

export interface BrandListDto {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly logoUrl?: string;
  readonly heroImageUrl?: string;
  readonly shortDescription: string;
  readonly productsCount: number;
  readonly isFeatured: boolean;
  readonly isActive: boolean;
}

export interface BrandImageDto {
  readonly id: number;
  readonly url: string;
  readonly altText?: string;
  readonly caption?: string;
  readonly sortOrder: number;
  readonly imageType: string;
}

export interface BrandCategoryDto {
  readonly categoryId: number;
  readonly categoryName: string;
  readonly categorySlug: string;
  readonly iconUrl?: string;
  readonly icon?: string;
  readonly productsCount: number;
}

export interface BrandShowcaseDto {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly logoUrl?: string;
  readonly description: string;
  readonly heroImageUrl?: string;
  readonly heroTitle?: string;
  readonly heroSubtitle?: string;
  readonly bannerButtonText?: string;
  readonly images: readonly BrandImageDto[];
  readonly categories: readonly BrandCategoryDto[];
  readonly featuredProducts: readonly ProductListDto[];
  readonly totalProductsCount: number;
}

// ============ Переводы ============

export interface BrandTranslationDto {
  readonly languageCode: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly heroTitle?: string;
  readonly heroSubtitle?: string;
  readonly bannerButtonText?: string;
}

// ============ Создание / Обновление ============

export interface CreateBrandDto {
  readonly logoUrl?: string;
  readonly heroImageUrl?: string;
  readonly isFeatured: boolean;
  readonly isActive: boolean;
  readonly translations: readonly BrandTranslationDto[];
}

export type UpdateBrandDto = CreateBrandDto;

// Реэкспорт общих типов
export type { BrandSummaryDto, PaginatedResponse };
