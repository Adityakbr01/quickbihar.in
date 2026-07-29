export interface PaginationResult<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  status?: string;
  type?: string;
  role?: string;
  [key: string]: any;
}

export interface MutationPayload {
  before?: any;
  after?: any;
  metadata?: any;
  message?: string;
  severity?: "INFO" | "WARNING" | "ERROR";
}

export type PartnerType = "SELLER" | "DELIVERY";
