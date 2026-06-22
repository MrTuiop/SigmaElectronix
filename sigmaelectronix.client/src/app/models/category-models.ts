// ============ DTO для чтения ============

export interface CategoryDto {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly imageUrl?: string;
  readonly icon?: string;
  readonly parentCategoryId?: number;
  readonly parentCategoryName?: string;
  readonly productsCount: number;
  readonly subCategoriesCount: number;
}

export interface CategoryTreeDto {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly imageUrl?: string;
  readonly icon?: string;
  readonly productsCount: number;
  readonly subCategories: readonly CategoryTreeDto[];
}

// ============ Переводы ============

export interface CategoryTranslationDto {
  readonly languageCode: string;
  readonly name: string;
  readonly slug: string;
}

// ============ Создание / Обновление ============

export interface CreateCategoryDto {
  readonly imageUrl?: string;
  readonly icon?: string;
  readonly parentCategoryId?: number;
  readonly translations: readonly CategoryTranslationDto[];
}

export type UpdateCategoryDto = CreateCategoryDto;

// ============ Прочее ============

export interface SlugCheckResponse {
  readonly slug: string;
  readonly isAvailable: boolean;
}
