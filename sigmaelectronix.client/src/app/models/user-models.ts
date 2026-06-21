// То, что мы получаем с сервера
export interface UserDto {
  id: string;
  userName: string; // <-- ДОБАВИЛИ
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bonusBalance: number;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  avatarUrl?: string;
}

export interface CreateUserDto {
  userName: string; // <-- ДОБАВИЛИ
  email: string;
  phoneNumber: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdateUserDto {
  userName: string; // <-- ДОБАВИЛИ
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  bonusBalance: number;
  isActive: boolean;
}

// Для смены пароля (Админ)
export interface ChangeUserPasswordDto {
  newPassword: string;
}
