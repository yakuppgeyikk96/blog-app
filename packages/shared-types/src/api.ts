export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedApiResponse<T> {
  success: true;
  data: {
    items: T[];
    pagination: Pagination;
  };
}
