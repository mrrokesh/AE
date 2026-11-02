export interface ListParams {
  /** Case-insensitive match over the collection's searchable fields. */
  search?: string
  /** field -> value. Array values mean "any of"; array fields match if they contain the value. */
  filters?: Record<string, unknown>
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  page?: number // 1-based
  pageSize?: number
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
