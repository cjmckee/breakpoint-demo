import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Boots the Vite dev server on the project's fixed port (3000, set in
 * vite.config.ts) and drives real browser sessions — each test gets a clean context,
 * so the persisted zustand store in localStorage starts empty and every run is a
 * genuine first-time player.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // The menu collapses hard below sm: labels drop out of the status bar and the
    // stats panel starts collapsed, so the walkthrough is worth checking at width.
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
