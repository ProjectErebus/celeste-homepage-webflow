/* channel:'chrome' = installed Google Chrome (no browser download). Local-only config for the /book and /popup specs (mock API + own static server): chromium desktop + Pixel 7. */
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: ['book/**/*.spec.mjs', 'popup/**/*.spec.mjs'],
  reporter: [['list']],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
});
