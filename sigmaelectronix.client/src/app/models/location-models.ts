// --- Модели Регионов ---
export interface RegionDto {
  readonly id: number;
  readonly name: string;
  readonly code?: string;
  readonly citiesCount: number;
}

export interface CreateUpdateRegionDto {
  readonly name: string;
  readonly code?: string;
}

// --- Модели Городов ---
export interface CityDto {
  readonly id: number;
  readonly name: string;
  readonly regionId: number;
  readonly regionName: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone?: string;
}

export interface CreateUpdateCityDto {
  readonly name: string;
  readonly regionId: number;
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone?: string;
}
