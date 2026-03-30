import { env } from '@/app/config/env'

export const appConfig = {
  name: env.appName,
  apiBaseUrl: env.apiBaseUrl,
  defaultTheme: env.defaultTheme,
}

