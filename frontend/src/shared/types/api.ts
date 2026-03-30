export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiErrorShape {
  message: string
  code?: string
}

