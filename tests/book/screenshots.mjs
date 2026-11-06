/* Manual helper: node tests/book/screenshots.mjs <outDir>  (uses installed Chrome, mock API) */
import { chromium } from '@playwright/test';
import { startServer } from './static-server.mjs';
import { createMock, API } from './mock-api.mjs';
const out = process.argv[2] || '.';
const { server, url } = await startServer();
const browser = await chromium.launch({ channel: 'chrome' });
for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['390', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, locale: 'en-GB', timezoneId: 'Europe/Paris' });
  const page = await ctx.newPage();
  const mock = createMock(); await mock.install(page);
  await page.goto(`${url}/book?api=${encodeURIComponent(API)}`);
  await page.locator('.bk-time').first().waitFor();
  await page.screenshot({ path: `${out}/book-1-slots-${name}.png`, fullPage: true });
  await page.locator('.bk-time').first().click();
  await page.getByLabel('Name', { exact: true }).fill('Sam Example');
  await page.getByLabel('Email', { exact: true }).fill('sam@example.com');
  await page.getByLabel('Company', { exact: true }).fill('Example Marine');
  await page.getByLabel('Your role').selectOption('chief_engineer');
  await page.screenshot({ path: `${out}/book-2-form-${name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await page.locator('#bk-invite').waitFor();
  await page.screenshot({ path: `${out}/book-3-confirmed-${name}.png`, fullPage: true });
  await ctx.close();
}
await browser.close(); server.close();
