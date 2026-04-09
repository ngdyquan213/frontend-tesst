import { defineConfig } from '@playwright/test'

const isMockMode = process.env.VITE_ENABLE_MOCKS === 'true'
const previewBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173'
const liveApiBaseUrl =
  process.env.VITE_API_BASE_URL ??
  `${process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000'}/api/v1`

function shellEscape(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

const webServerCommand = isMockMode
  ? `VITE_ENABLE_MOCKS=${shellEscape('true')} npm run build && VITE_ENABLE_MOCKS=${shellEscape('true')} npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`
  : `VITE_ENABLE_MOCKS=${shellEscape('false')} VITE_API_BASE_URL=${shellEscape(liveApiBaseUrl)} VITE_API_URL=${shellEscape(liveApiBaseUrl)} npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`

export default defineConfig({
  testDir: './src/tests/e2e',
  timeout: 30_000,
  workers: isMockMode ? undefined : 1,
  use: {
    baseURL: previewBaseUrl,
    trace: 'on-first-retry',
  },
  webServer: {
    command: webServerCommand,
    port: 4173,
    // Reusing an existing preview server can leak the wrong mock/live build into E2E runs.
    reuseExistingServer: false,
  },
})
