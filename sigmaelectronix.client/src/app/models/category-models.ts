// src/app/models/category-models.ts

export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  icon?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  productsCount: number;
  subCategoriesCount: number;
}

export interface CategoryTreeDto {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  icon?: string;
  productsCount: number;
  subCategories: CategoryTreeDto[];
}

export interface CreateCategoryDto {
  name: string;
  slug: string;
  imageUrl?: string;
  icon?: string;
  parentCategoryId?: number;
}

export interface UpdateCategoryDto {
  name: string;
  slug: string;
  imageUrl?: string;
  icon?: string;
  parentCategoryId?: number;
}

export interface SlugCheckResponse {
  slug: string;
  isAvailable: boolean;
}
