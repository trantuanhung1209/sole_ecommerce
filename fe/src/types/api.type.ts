// Base API Response format cho tất cả endpoint
export interface ApiResponse<T = unknown> {
  success?: boolean;
  status?: number;
  message: string;
  data: T;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
  };
}

// Paginated Response
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Generic types cho các trường hợp phổ biến
export type ApiListResponse<T> = ApiResponse<T[]>; // Cho list items
export type ApiItemResponse<T> = ApiResponse<T>; // Cho single item
export type ApiMessageResponse = ApiResponse<null>; // Cho success message only

// Error response
export interface ApiErrorResponse {
  status: number;
  message: string;
  error?: string;
  data?: null;
}
