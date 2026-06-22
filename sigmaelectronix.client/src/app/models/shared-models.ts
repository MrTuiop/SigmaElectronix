// src/app/models/shared-models.ts

// ============ Общие обёртки ============

export interface PaginatedResponse<T> {
  items: readonly T[];
  readonly totalCount: number;
  readonly pageNumber: number;
  readonly pageSize: number;
}

// ============ Общие API-ошибки ============

export interface ApiError {
  readonly errors?: readonly string[];
  readonly title?: string;
  readonly status?: number;
  readonly traceId?: string;
}

// ============ Общие поля аудита ============

export interface AuditFields {
  readonly createdAt: string; // ISO 8601
  readonly updatedAt?: string;
}
