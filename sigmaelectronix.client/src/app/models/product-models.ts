// BrandSummaryDto (минимально)
export interface BrandSummaryDto {
  id: number;
  name: string;
}

// Фильтр списка товаров
export interface ProductFilterDto {
  categoryId?: number;
  brandIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
  specifications?: Record<string, string>;
  sortBy?: string; // 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular'
  pageNumber?: number;
  pageSize?: number;
}

// Товар в списке
export interface ProductListDto {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  price: number;
  discountPrice?: number;
  finalPrice: number; // вычисляется на бэке, можно оставить
  brand: BrandSummaryDto;
  categoryName: string;
  mainImageUrl: string;
  averageRating: number;
  reviewsCount: number;
  isPublished: boolean;
}

// Детальная карточка товара
export interface ProductDetailDto {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  discountPrice?: number;
  finalPrice: number;
  discountPercent?: number;
  brand: BrandSummaryDto;
  categoryId: number;
  categoryName: string;
  specifications: Record<string, string>;
  averageRating: number;
  reviewsCount: number;
  images: ProductImageDto[];
  createdAt: string; // DateTime в ISO-формате
}

export interface ProductImageDto {
  id: number;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

// DTO для создания / редактирования
export interface CreateProductDto {
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  discountPrice?: number;
  brandId: number;
  categoryId: number;
  specifications: Record<string, string>;
  isPublished: boolean;
}

export interface UpdateProductDto {
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  discountPrice?: number;
  brandId: number;
  categoryId: number;
  specifications: Record<string, string>;
  isPublished: boolean;
}

// Обёртка пагинированного ответа (предполагаемая структура с бэка)
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
