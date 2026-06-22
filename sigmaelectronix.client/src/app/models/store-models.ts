// store-models.ts

export enum StoreType {
  Retail = 0,
  PickupPoint = 1,
  Warehouse = 2,
  ServiceCenter = 3
}

export interface StoreDto {
  readonly id: number;
  readonly name: string;
  readonly code: string;
  readonly cityId: number;
  readonly cityName: string;
  readonly fullAddress: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly phone: string;
  readonly email?: string;
  readonly workingHours: string;
  readonly isActive: boolean;
  readonly type: string; // ✅ ОБЯЗАТЕЛЬНО string (с бэка приходят строки!)
}

export interface CreateStoreDto {
  readonly name: string;
  readonly code: string;
  readonly cityId: number;
  readonly fullAddress: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly phone: string;
  readonly email?: string;
  readonly workingHours: string;
  readonly isActive: boolean;
  readonly type: StoreType; // ✅ Для отправки используем enum (бэк примет число)
}

export type UpdateStoreDto = CreateStoreDto;
