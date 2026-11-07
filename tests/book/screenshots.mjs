/* Manual helper: node tests/book/screenshots.mjs <outDir>  (installed Chrome, mock API). Writes /book step 1 with the vessel
 * confirm, and the exit popup: desktop light, phone light, desktop dark. */
import { chromium } from '@playwright/test';
import { startServer } from './static-server.mjs';
import { createMock, captureCollector } from './mock-api.mjs';
const out = process.argv[2] || '.';
const { server, url } = await startServer();
const browser = await chromium.launch({ channel: 'chrome' });
async function ctxPage(opts) {
  const ctx = await browser.newContext({ locale: 'en-GB', ...opts });
  const page = await ctx.newPage();
  const mock = createMock(); await mock.install(page); await mock.installImo(page, url); await captureCollector(page);
  await page.addInitScript(() => { try { localStorage.setItem('celeste_consent', JSON.stringify({ v: '2026-10-31', analytics: false, ads: false })); } catch (e) {} });
  return { ctx, page };
}
{ // /book step 1
  const { ctx, page } = await ctxPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${url}/book`);
  await page.getByLabel(/Vessel IMO/).fill('IMO 9074729');
  await page.locator('#bk-imo-note').filter({ hasText: 'Test Star' }).waitFor();
  await page.getByLabel('Your role').selectOption('chief_engineer');
  await page.getByLabel('Name', { exact: true }).fill('Sam Example');
  await page.getByLabel('Email', { exact: true }).fill('sam@example.com');
  await page.screenshot({ path: `${out}/book-step1-vessel-confirm.png`, fullPage: true });
  await ctx.close();
}
async function popup(name, opts) {
  const { ctx, page } = await ctxPage({ ...opts, colorScheme: 'light' });
  await page.goto(`${url}/tests/popup/popup-test.html?popup=preview`);
  await page.locator('dialog.cp-dialog[open]').waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/popup-step1-${name}.png` });
  await page.locator('input[name=imo]').fill('9074729');
  await page.getByLabel('Email', { exact: true }).fill('sam@example.com');
  await page.locator('dialog button[type=submit]').click();
  await page.locator('[data-copy-slot="step2-heading"]').waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/popup-step2-${name}.png` });
  await ctx.close();
}
await popup('desktop-light', { viewport: { width: 1280, height: 800 } });
await popup('phone-light', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await browser.close(); server.close();
