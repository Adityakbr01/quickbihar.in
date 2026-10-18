import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for QuickBihar user-web.
 *
 * Runs the dev server (`vite --host`) as the web-server so tests exercise the
 * real SPA against `http://localhost:5173`. Secrets (API keys, Razorpay keys)
 * are never hardcoded here — they come from the environment / .env.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'blob' : 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chrome-mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
})
