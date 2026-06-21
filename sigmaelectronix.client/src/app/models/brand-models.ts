// ---------- Вспомогательные / общие ----------

/** Пагинированный результат (подстройте под реальный ответ сервера) */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** Краткая модель товара, используемая в витрине бренда */
export interface ProductListDto {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  price: number;
  discountPrice?: number;
  finalPrice: number;
  brand?: BrandSummaryDto;
  categoryName?: string;
  mainImageUrl?: string;
  averageRating?: number;
  reviewsCount?: number;
  isPublished?: boolean;

  // Поля для UI
  discount?: number;
  isNew?: boolean;
  inWishlist?: boolean;
  gradient?: string;
}

// ---------- Бренд-специфичные DTO ----------

export interface BrandListDto {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  heroImageUrl?: string;
  shortDescription: string;
  productsCount: number;
  isFeatured: boolean;
  isActive: boolean; // <--- ДОБАВЬ ЭТУ СТРОЧКУ
}

export interface BrandImageDto {
  id: number;
  url: string;
  altText?: string;
  caption?: string;
  sortOrder: number;
  imageType: string;
}

export interface BrandCategoryDto {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  iconUrl?: string;
  icon?: string;
  productsCount: number;
}

export interface BrandSummaryDto {
  id: number;
  name: string;
  slug?: string;
  logoUrl?: string;
}

export interface BrandShowcaseDto {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  description: string;
  heroImageUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  bannerButtonText?: string;
  seoTitle?: string;
  seoDescription?: string;
  images: BrandImageDto[];
  categories: BrandCategoryDto[];
  featuredProducts: ProductListDto[];
  totalProductsCount: number;
}

export interface CreateBrandDto {
  name: string;
  slug?: string;
  description: string;
  logoUrl?: string;
  heroImageUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  bannerButtonText?: string;
  isFeatured: boolean;
  isActive: boolean;
}

export type UpdateBrandDto = CreateBrandDto;
