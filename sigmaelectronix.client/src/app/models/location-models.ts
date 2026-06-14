// src/app/models/location-models.ts

// --- Модели Регионов ---
export interface RegionDto {
  id: number;
  name: string;
  code?: string;
  citiesCount: number;
}

export interface CreateUpdateRegionDto {
  name: string;
  code?: string;
}

// --- Модели Городов ---
export interface CityDto {
  id: number;
  name: string;
  regionId: number;
  regionName: string;
  latitude: number;
  longitude: number;
  timeZone?: string;
}

export interface CreateUpdateCityDto {
  name: string;
  regionId: number;
  latitude: number;
  longitude: number;
  timeZone?: string;
}
