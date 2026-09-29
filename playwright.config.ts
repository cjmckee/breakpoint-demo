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
  // Hard ceilings. A spec that hangs should fail with its diagnostic while
  // someone is still watching, not grind out ten minutes first — the whole point
  // of a driven-browser suite is a fast answer. A spec that genuinely needs
  // longer raises it for itself with test.setTimeout, and should say why.
  timeout: 60_000,
  globalTimeout: 600_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Without this, a single action inherits the whole test budget: `isEnabled()`
    // auto-waits for its element, so one probe for a button this screen does not
    // render swallows the entire run and reports as a bare timeout with no
    // diagnostic. That cost a lot of wall clock before it was spotted.
    actionTimeout: 10_000,
    // Sandboxes with a preinstalled Chromium (Claude Code on the web ships one at
    // /opt/pw-browsers/chromium) often lag the pinned Playwright's expected build,
    // and cannot download a new one. Point at it rather than failing to launch.
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH && {
      launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH },
    }),
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
