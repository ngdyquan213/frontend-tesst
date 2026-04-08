function readBooleanEnv(value: unknown) {
  return value === 'true' || value === '1'
}

export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'TravelBook',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '/api/v1',
  defaultTheme: import.meta.env.VITE_DEFAULT_THEME ?? 'light',
  enableMocks: readBooleanEnv(import.meta.env.VITE_ENABLE_MOCKS),
}
