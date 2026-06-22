import { ApiError } from './shared-models';

export interface RegisterRequest {
  readonly userName: string;
  readonly phoneNumber: string;
  readonly password: string;
  readonly email?: string | null;
}

export interface LoginRequest {
  readonly usernameOrEmail: string;
  readonly password: string;
}

export interface LoginResponse {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresIn?: number;
}

export interface RegisterResponse {
  readonly message: string;
  readonly userId?: string;
}

// Реэкспорт ApiError для удобства
export type { ApiError };
