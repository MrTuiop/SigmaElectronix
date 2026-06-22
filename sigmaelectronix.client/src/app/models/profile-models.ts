import { WishlistProduct } from './wishlist-product-models';

// ========== Профиль пользователя ==========
export interface UserProfile {
  readonly id: string;
  readonly userName: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly phoneNumber: string;
  readonly avatarUrl?: string | null;
  readonly preferredCityId?: number | null;
  readonly preferredStoreId?: number | null;
  readonly createdAt: string;
  readonly bonusBalance: number;
}

// ========== Заказ (в истории профиля) ==========
export interface Order {
  readonly id: string;
  readonly createdAt: string;
  readonly status: string;
  readonly totalAmount: number;
  readonly itemsCount: number;
  readonly statusColor?: string;
  readonly date?: string;
  readonly total?: number;
  readonly items?: number;
}

// ========== Адрес ==========
export interface CreateUpdateAddressDto {
  readonly title: string;
  readonly cityId: number;
  readonly street: string;
  readonly building: string;
  readonly apartment?: string;
  readonly postalCode: string;
  readonly isDefault: boolean;
  readonly recipientName?: string;
  readonly recipientPhone?: string;
}

export interface Address {
  readonly id: number;
  readonly title: string;
  readonly street: string;
  readonly city: string;
  readonly zip: string;
  readonly isDefault: boolean;
  readonly cityId: number;
  readonly originalStreet: string;
  readonly originalBuilding: string;
  readonly originalApartment?: string;
}

// ========== Бонусная транзакция ==========
export interface BonusTransaction {
  readonly id: number;
  readonly amount: number;
  readonly reason: string;
  readonly createdAt: string;
  readonly orderId?: number | null;
  readonly orderNumber?: string | null;
}

// ========== DTO для запросов ==========
export interface UpdateUsernameRequest { readonly userName: string; }
export interface UpdateFirstNameRequest { readonly firstName: string; }
export interface UpdateLastNameRequest { readonly lastName: string; }
export interface UpdateEmailRequest { readonly email: string; }
export interface UpdatePhoneRequest { readonly phoneNumber: string; }
export interface UpdateAvatarRequest { readonly avatarUrl: string; }
export interface UpdatePreferredCityRequest { readonly cityId: number | null; }
export interface UpdatePreferredStoreRequest { readonly storeId: number | null; }

export interface ChangePasswordRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmNewPassword: string;
}

// ========== Вспомогательные типы для UI ==========
export interface NotificationState {
  readonly email: boolean;
  readonly sms: boolean;
  readonly push: boolean;
}

// Реэкспортируем WishlistProduct для удобства
export type { WishlistProduct };
