/**
 * Takes screenshots of the running app and saves them to public/screenshots/.
 * Run with:  node scripts/screenshot.mjs
 * Requires the dev (or prod) server to already be running on http://localhost:3000
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'public/screenshots');
mkdirSync(OUT, { recursive: true });

// Read admin password from .env.local
const envContent = readFileSync(resolve(ROOT, '.env.local'), 'utf-8');
const adminPassword = envContent.match(/^ADMIN_PASSWORD=(.+)$/m)?.[1]?.trim();
if (!adminPassword) {
  console.error('ADMIN_PASSWORD not found in .env.local');
  process.exit(1);
}

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
console.log(`Connecting to ${BASE_URL}…`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

// ── 1. Landing overlay ────────────────────────────────────────────────────────
console.log('  → landing.png');
await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
await page.waitForTimeout(900); // let mount animation finish
await page.screenshot({ path: `${OUT}/landing.png` });

// ── 2. Password input ─────────────────────────────────────────────────────────
console.log('  → sign-in.png');
await page.click('button:has-text("Sign in")');
await page.waitForTimeout(450);
await page.screenshot({ path: `${OUT}/sign-in.png` });

// ── 3. Unlock → main dashboard ────────────────────────────────────────────────
console.log('  Entering password…');
await page.fill('input[type="password"]', adminPassword);
await page.click('button:has-text("Unlock")');
// Wait for the overlay to fade and the main content to appear
await page.waitForSelector('text=Paste a link to save it', { timeout: 15_000 });
await page.waitForTimeout(700);
console.log('  → home.png');
await page.screenshot({ path: `${OUT}/home.png` });

// ── 4. Individual link card (if any cards are present) ────────────────────────
const firstCard = page.locator('div:has(a:text("Open ↗"))').first();
if (await firstCard.isVisible({ timeout: 2_000 }).catch(() => false)) {
  console.log('  → link-card.png');
  await firstCard.screenshot({ path: `${OUT}/link-card.png` });
} else {
  console.log('  (no link cards found — skipping link-card.png)');
}

await browser.close();
console.log(`\n✓ Screenshots saved to public/screenshots/`);
