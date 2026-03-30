export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
}

export interface PaginatedResult<T> {
  items: T[]
  meta: PaginationMeta
}

