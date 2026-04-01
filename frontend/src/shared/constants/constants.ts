// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
export const API_TIMEOUT = 30000

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_TYPE: 'token_type',
  TOKEN_EXPIRES_AT: 'token_expires_at',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
} as const

// Pagination
export const DEFAULT_PAGE_SIZE = 10
export const DEFAULT_PAGINATION = {
  limit: DEFAULT_PAGE_SIZE,
  offset: 0,
}

// Booking Types
export const BOOKING_TYPES = {
  FLIGHT: 'FLIGHT',
  HOTEL: 'HOTEL',
  TOUR: 'TOUR',
} as const

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const

// Document Status
export const DOCUMENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

// Document Types
export const DOCUMENT_TYPES = {
  PASSPORT: 'PASSPORT',
  VISA: 'VISA',
  INSURANCE: 'INSURANCE',
  VACCINATION: 'VACCINATION',
  ID_PROOF: 'ID_PROOF',
} as const

// Routes
export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    BLOG: '/blog',
    BLOG_DETAIL: '/blog/:id',
    ABOUT: '/about',
    SERVICES: '/services',
    CONTACT: '/contact',
  },
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password/:token',
  },
  PROTECTED: {
    DASHBOARD: '/dashboard',
    FLIGHTS: '/flights',
    HOTELS: '/hotels',
    TOURS: '/tours',
    BOOKINGS: '/bookings',
    BOOKING_DETAIL: '/bookings/:id',
    PAYMENT: '/payment/:bookingId',
    UPLOADS: '/uploads',
  },
  ACCOUNT: {
    PROFILE: '/account/profile',
    SETTINGS: '/account/settings',
    BOOKINGS: '/account/bookings',
    DOCUMENTS: '/account/documents',
    WALLET: '/account/wallet',
  },
  ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    BOOKINGS: '/admin/bookings',
    DOCUMENTS: '/admin/documents',
    PAYMENTS: '/admin/payments',
  },
  ERROR: {
    NOT_FOUND: '/404',
    UNAUTHORIZED: '/401',
    FORBIDDEN: '/403',
    SERVER_ERROR: '/500',
  },
} as const

// Validation Rules
export const VALIDATION = {
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  PHONE_PATTERN: /^\d{10,}$/,
} as const

// Toast Config
export const TOAST_CONFIG = {
  DURATION: 3000,
  POSITION: 'top-right' as const,
} as const

// Feature Flags
export const FEATURES = {
  ENABLE_TOURS: true,
  ENABLE_COUPONS: true,
  ENABLE_WALLET: true,
  ENABLE_NOTIFICATIONS: true,
} as const
