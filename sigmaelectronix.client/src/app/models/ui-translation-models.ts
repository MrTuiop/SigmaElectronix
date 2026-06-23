export interface UiTranslationDto {
  id: number;
  key: string;
  languageCode: string;
  value: string;
}

export interface CreateUpdateUiTranslationDto {
  key: string;
  languageCode: string;
  value: string;
}
