export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sort?: string;
  search?: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// ─── Shared Helpers ─────────────────────────────────────────────────

/**
 * Build pagination meta object (DRY helper for services)
 */
export function buildPaginationMeta(page: number, perPage: number, total: number): PaginationMeta {
  return { page, perPage, total, totalPages: Math.ceil(total / perPage) };
}

/**
 * Shared route context type for Next.js dynamic routes
 */
export type RouteContext<T extends string = "id"> = {
  params: Promise<Record<T, string>>;
};
