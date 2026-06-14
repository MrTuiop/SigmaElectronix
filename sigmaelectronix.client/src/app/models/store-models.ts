// store-models.ts

// Типы магазинов (должны совпадать с твоим C# Enum StoreType)
// Если в C# Retail = 0, Warehouse = 1, то оставляем так.
export enum StoreType {
  Retail = 0,
  PickupPoint = 1,
  Warehouse = 2,
  ServiceCenter = 3
}

export interface StoreDto {
  id: number;
  name: string;
  code: string;
  cityId: number;
  cityName: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  workingHours: string;
  isActive: boolean;
  type: string; // С бэкенда приходит уже в виде строки (MapToDto)
}

export interface CreateStoreDto {
  name: string;
  code: string;
  cityId: number;
  fullAddress: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  workingHours: string;
  isActive: boolean;
  type: StoreType; // Отправляем на бэкенд числовое значение Enum
}

export interface UpdateStoreDto extends CreateStoreDto {
  // Наследует все поля от CreateStoreDto
}
