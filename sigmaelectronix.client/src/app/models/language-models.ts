export interface LanguageDto {
  readonly code: string;
  readonly name: string;
  readonly nativeName: string;
  readonly iconUrl?: string;
  readonly isDefault: boolean;
  readonly isActive: boolean;
}

export type CreateUpdateLanguageDto = LanguageDto;
