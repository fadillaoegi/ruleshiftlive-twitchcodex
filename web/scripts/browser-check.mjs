// Run against this project's local Vite server on a machine permitted to open
// loopback ports. This test exercises browser rehearsal, never real Twitch.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.env.RULESHIFT_BASE_URL ?? 'http://localhost:5174';
const output = new URL('../../.local/browser-evidence/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH
  ? { executablePath: process.env.CHROME_PATH, headless: true }
  : { channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Chat writes the rules. You survive them.' }).waitFor();
  assert.ok(await page.getByText('LOCAL REHEARSAL', { exact: true }).first().isVisible());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  await page.screenshot({ path: new URL('rehearsal-720p.png', output).pathname, fullPage: true });
  await page.getByRole('button', { name: 'Send rehearsal message' }).click();
  await page.getByRole('button', { name: 'Approve rule' }).click();
  await page.getByRole('button', { name: 'Start approved round' }).click();
  await page.keyboard.down('d');
  try {
    await page.waitForFunction(() => Number(document.querySelector('[data-testid="coins"]')?.textContent?.split('/')[0]) >= 3, undefined, { timeout: 7000 });
  } finally { await page.keyboard.up('d'); }
  assert.match(await page.getByTestId('gravity').textContent(), /Reversed/);
  await page.screenshot({ path: new URL('third-coin-reversal.png', output).pathname, fullPage: true });
  await page.waitForFunction(() => document.querySelector('[data-testid="gravity"]')?.textContent?.includes('Normal'), undefined, { timeout: 6500 });
  await page.getByRole('button', { name: 'Stop round & clear effects' }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="game-event"]')?.textContent?.includes('All effects cleared'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByLabel('REHEARSAL MESSAGE').fill('!rule execute arbitrary code');
  await page.getByRole('button', { name: 'Send rehearsal message' }).click();
  assert.equal(await page.getByRole('button', { name: 'Approve rule' }).count(), 0);
  await page.getByRole('button', { name: 'Twitch live' }).click();
  assert.equal(await page.getByText('LOCAL REHEARSAL', { exact: true }).count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  await page.screenshot({ path: new URL('mobile-390.png', output).pathname, fullPage: true });
  assert.deepEqual(errors, []);
  const result = { status: 'passed', source: 'browser rehearsal; no Twitch or AI inference', at: new Date().toISOString(), viewport: '1280×720 and 390×844' };
  await writeFile(new URL('result.json', output), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
