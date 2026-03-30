import type { ThemeMode } from '@/shared/types/common'

const THEME_KEY = 'travelbook_theme'

export const themeStorage = {
  get: (): ThemeMode => (localStorage.getItem(THEME_KEY) as ThemeMode) || 'light',
  set: (value: ThemeMode) => localStorage.setItem(THEME_KEY, value),
}

