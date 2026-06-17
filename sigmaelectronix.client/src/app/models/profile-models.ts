// ========== Профиль пользователя ==========
export interface UserProfile {
  id: string;
  userName: string
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  preferredCityId?: number | null;
  preferredStoreId?: number | null;
  createdAt: string;               // ISO дата
  bonusBalance: number;            // <-- новое поле с сервера
}

// ========== Заказ ==========
export interface Order {
  id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  itemsCount: number;              // или свойство items (массив), смотрите серверный ответ
  statusColor?: string;            // будем вычислять на клиенте
  date?: string;                   // форматированная дата
  total?: number;                  // синоним totalAmount
  items?: number;                  // синоним itemsCount
}

// ========== Адрес ==========
// DTO для отправки на сервер
export interface CreateUpdateAddressDto {
  title: string;
  cityId: number; // 👈 Меняем cityName: string на cityId: number
  street: string;
  building: string;
  apartment?: string;
  postalCode: string;
  isDefault: boolean;
  recipientName?: string;
  recipientPhone?: string;
}

// Убедись, что твой интерфейс Address выглядит так:
export interface Address {
  id: number;
  title: string;
  street: string;
  city: string;
  zip: string;
  isDefault: boolean;
  // Поля для формы редактирования:
  cityId: number;
  originalStreet: string;
  originalBuilding: string;
  originalApartment?: string;
}

// ========== Бонусная транзакция (DTO с сервера) ==========
export interface BonusTransaction {
  id: number;
  amount: number;
  reason: string;
  createdAt: string;
  orderId?: number | null;
  orderNumber?: string | null;
}

// ========== DTO для запросов (остаются без изменений) ==========
export interface UpdateUsernameRequest {
  userName: string;
}
export interface UpdateFirstNameRequest { firstName: string; }
export interface UpdateLastNameRequest { lastName: string; }
export interface UpdateEmailRequest { email: string; }
export interface UpdatePhoneRequest { phoneNumber: string; }
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
export interface UpdateAvatarRequest { avatarUrl: string; }
export interface UpdatePreferredCityRequest { cityId: number | null; }
export interface UpdatePreferredStoreRequest { storeId: number | null; }

// ========== Вспомогательные типы для UI (временные, пока нет своих API) ==========
export interface NotificationState {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface Review {
  product: string;
  rating: number;
  text: string;
  date: string;
}

export interface WishlistProduct {
  id: number;
  name: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  discount: number;
  rating: number;
  reviews: number;
  gradient: string;
  icon: string;
}
