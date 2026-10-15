/**
 * SEANET-EUPHORIA.SPEC.JS — contract test for the M/Y Euphoria proposal set.
 *
 * Pages: /seanet-euphoria.html (landing), /seanet-euphoria-overview.html (10-slide deck),
 * /seanet-euphoria-proposal.html (technical proposal). See docs/seanet-euphoria/README.md.
 *
 * Runs against TEST_URL. To run locally:
 *   python3 -m http.server 8080 &
 *   TEST_URL=http://localhost:8080 npx playwright test tests/journeys/seanet-euphoria.spec.js --project=chromium
 *
 * The access gate is bypassed by setting its localStorage key before each page loads.
 */

import { test, expect } from '@playwright/test';

const LANDING = '/seanet-euphoria.html';
const DECK = '/seanet-euphoria-overview.html';
const PROPOSAL = '/seanet-euphoria-proposal.html';
const COMPANION = '/seanet-security-companion.html';

const PROPOSAL_SECTIONS = [
  'summary', 'needs', 'record', 'onboarding', 'compound', 'warranty', 'handover', 'documents', 'search',
  'ledger', 'ism', 'fleet', 'security', 'first-month', 'scope', 'investment', 'contact',
];

// Copy the founder has retired. None of it may reappear on any Euphoria page.
const RETIRED_COPY = [/about a day/i, /\bin one day\b/i, /Barcelona/i, /\b6 Nov/i, /refit trial/i, /\$995 per vessel per month<\/b>/];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('seanet_access_granted', '1'));
});

test.describe('seanet-euphoria · access gate', () => {
  test('gate shows without the stored key and opens with the code', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(LANDING);
    await expect(page.locator('#seanet-gate')).toBeVisible();
    await page.fill('#seanet-gate-input', 'seanetco');
    await page.click('#seanet-gate-submit');
    await expect(page.locator('#seanet-gate')).toBeHidden();
    await context.close();
  });
});

test.describe('seanet-euphoria · proposal structure', () => {
  test('all 17 sections exist in order, numbered to match the contents', async ({ page }) => {
    await page.goto(PROPOSAL);
    const ids = await page.locator('section.sec[data-title]').evaluateAll((els) => els.map((e) => e.id).filter((id) => id !== 'contents'));
    expect(ids).toEqual(PROPOSAL_SECTIONS);
    const titles = await page.locator('section.sec[data-title]').evaluateAll((els) => els.map((e) => e.getAttribute('data-title')).filter((t) => t !== 'Contents'));
    titles.forEach((t, i) => expect(t.startsWith(String(i + 1).padStart(2, '0') + ' · '), t).toBeTruthy());
    const links = await page.locator('nav.toc a').evaluateAll((els) => els.map((e) => e.getAttribute('href').slice(1)));
    expect(links).toEqual(PROPOSAL_SECTIONS);
  });

  test('no section shows two animations at once, except Proof', async ({ page }) => {
    await page.goto(PROPOSAL);
    for (const id of PROPOSAL_SECTIONS) {
      const visible = await page.locator(`#${id} svg.anim`).evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
      expect(visible, `#${id}`).toBeLessThanOrEqual(id === 'ledger' ? 2 : 1);
    }
  });

  test('04, 11 and 13 do not fall back to the shared fact list', async ({ page }) => {
    await page.goto(PROPOSAL);
    await expect(page.locator('#onboarding .night-sheet')).toHaveCount(1);
    await expect(page.locator('#security .access-record')).toHaveCount(1);
    for (const id of ['onboarding', 'ism', 'security']) await expect(page.locator(`#${id} .facts`), `#${id}`).toHaveCount(0);
    await expect(page.locator('#security .access-record-link')).toHaveAttribute('href', '/seanet-security-companion');
  });

  test('security keeps every commitment', async ({ page }) => {
    await page.goto(PROPOSAL);
    const text = await page.locator('#security').innerText();
    for (const fact of [/Approved crew only/i, /Microsoft 365/i, /second device/i, /never sees the password/i, /Set by the server/i, /database/i, /Encrypted in transit and at rest/i, /backed up daily/i, /30 days/i, /never trains AI/i]) {
      expect(text, String(fact)).toMatch(fact);
    }
  });

  test('every animation has an accessible name', async ({ page }) => {
    await page.goto(PROPOSAL);
    const unnamed = await page.locator('svg.anim[role="img"]').evaluateAll((els) => els.filter((e) => !e.getAttribute('aria-label')).length);
    expect(unnamed).toBe(0);
  });
});

// Hedging the founder has ruled out, checked in visible text, SVG text and accessible names.
const HEDGES = [/\babout\b/i, /\bmay\b/i, /\bmight\b/i, /\btypically\b/i, /\bapproximately\b/i];

test.describe('seanet-euphoria · copy', () => {
  for (const path of [LANDING, DECK, PROPOSAL]) {
    test(`no retired copy or hedging on ${path}`, async ({ page }) => {
      await page.goto(path);
      const html = await page.content();
      for (const re of RETIRED_COPY) expect(html, String(re)).not.toMatch(re);
      const words = await page.evaluate(() => {
        const main = document.querySelector('main, body');
        const labels = Array.from(document.querySelectorAll('[aria-label]')).map((e) => e.getAttribute('aria-label'));
        const svgText = Array.from(document.querySelectorAll('svg text')).map((t) => t.textContent);
        const gate = document.getElementById('seanet-gate');
        const body = main.innerText.replace(gate ? gate.innerText : '', '');
        return [body, ...labels, ...svgText].join('\n');
      });
      for (const re of HEDGES) expect(words, String(re)).not.toMatch(re);
    });
  }
});

test.describe('seanet-euphoria · security companion', () => {
  test('closes with the founder and the programme line; no stray contact lines', async ({ page }) => {
    await page.goto(COMPANION);
    const close = page.locator('#close');
    await expect(close.locator('.cl-sig')).toHaveText('Alex Short');
    await expect(close.locator('.cl-closer-img')).toHaveAttribute('src', '/images/euphoria/alex-short.jpg');
    await expect(close.locator('.cl-backing img')).toHaveAttribute('src', '/images/euphoria/anthropic-wordmark.svg');
    await expect(close.locator('.cl-backing p')).toHaveText("Celeste has been accepted into Anthropic's Claude for Startups programme.");
    // The address appears once in the close and once as a FAQ answer, nowhere else.
    await expect(page.locator('#s15 a[href^="mailto:"]')).toHaveCount(0);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
  });
});

test.describe('seanet-euphoria · deck', () => {
  test('ten slides; only the current one is reachable', async ({ page }) => {
    await page.goto(DECK);
    await expect(page.locator('.slide')).toHaveCount(10);
    const inertCount = await page.locator('.slide').evaluateAll((els) => els.filter((e) => e.inert).length);
    expect(inertCount).toBe(9);
    await page.click('#next-btn');
    await expect(page.locator('#slide-num')).toHaveText('02 / 10');
    await expect(page.locator('#slide-2')).toHaveClass(/active/);
  });
});

test.describe('seanet-euphoria · reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('animations rest on their finished frame', async ({ page }) => {
    await page.goto(PROPOSAL);
    // The plan timeline's last step ("Review") is lit, not dimmed.
    // (The frame is set at the load event; poll until the first animation sample lands.)
    const review = page.locator('#summary svg.only-wide text').filter({ hasText: 'Review' });
    await expect.poll(() => review.evaluate((t) => parseFloat(getComputedStyle(t).opacity))).toBeGreaterThan(0.95);
    // Breathing dots are not frozen mid-pulse.
    const dots = await page.locator('#security svg.only-wide circle').evaluateAll((cs) => cs.map((c) => parseFloat(getComputedStyle(c).fillOpacity)));
    dots.forEach((o) => expect(o).toBeGreaterThan(0.95));
    // Sequenced drawings show their final layer.
    const claim = await page.locator('#warranty svg.only-wide g[data-in="0.62"]').getAttribute('opacity');
    expect(claim).toBe('1');
  });
});

test.describe('seanet-euphoria · phone layout', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('deck animations swap to phone versions', async ({ page }) => {
    await page.goto(DECK);
    const wideShown = await page.locator('svg.only-wide').evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
    expect(wideShown).toBe(0);
    for (const n of [2, 3, 4, 5, 6, 7, 8, 9]) {
      await expect(page.locator(`#slide-${n} svg.only-narrow`), `slide ${n}`).toHaveCount(1);
    }
  });

  test('proposal has no horizontal scroll and swaps to phone animations', async ({ page }) => {
    await page.goto(PROPOSAL);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const wideShown = await page.locator('svg.only-wide').evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
    expect(wideShown).toBe(0);
    const narrowShown = await page.locator('svg.only-narrow').evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
    expect(narrowShown).toBeGreaterThan(0);
  });
});
