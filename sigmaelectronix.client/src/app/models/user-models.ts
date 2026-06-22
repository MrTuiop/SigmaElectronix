// То, что мы получаем с сервера
export interface UserDto {
  readonly id: string;
  readonly userName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly bonusBalance: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly roles: readonly string[];
  readonly avatarUrl?: string;
}

export interface CreateUserDto {
  readonly userName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly password?: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: string;
}

// Обычное обновление пользователем (без бонусов и isActive)
export interface UpdateUserDto {
  readonly userName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly firstName: string;
  readonly lastName: string;
}

// Админское обновление (включает бонусы, статус, роли)
export interface AdminUpdateUserDto extends UpdateUserDto {
  readonly bonusBalance: number;
  readonly isActive: boolean;
  readonly roles: readonly string[];
}

// Для смены пароля (Админ)
export interface ChangeUserPasswordDto {
  readonly newPassword: string;
}
