export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'TravelBook',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '/mock-api',
  defaultTheme: import.meta.env.VITE_DEFAULT_THEME ?? 'light',
}
