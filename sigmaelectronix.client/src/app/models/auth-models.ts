// Запрос на регистрацию (адаптирован под ваши требования)
export interface RegisterRequest {
  userName: string;           // обязателен, 3–50 символов
  phoneNumber: string;        // обязателен
  password: string;           // обязателен, минимум 6 символов
  email?: string | null;      // необязателен, но если указан – должен быть валидный email
}

// Запрос на логин
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

// Ответ при успешном логине
export interface LoginResponse {
  accessToken: string;
}

// Ответ при успешной регистрации
export interface RegisterResponse {
  message: string;
}

// Ошибка с сервера (ожидаемая структура)
export interface ApiError {
  Errors?: string[];
}
