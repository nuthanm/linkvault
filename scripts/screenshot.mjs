/**
 * Takes screenshots of the running app and saves them to public/screenshots/.
 * Run with:  node scripts/screenshot.mjs
 * Requires the dev (or prod) server to already be running on http://localhost:3000
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "public/screenshots");
mkdirSync(OUT, { recursive: true });

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
console.log(`Connecting to ${BASE_URL}…`);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
});
const page = await ctx.newPage();

// ── 1. Signup page (split-panel, default view) ────────────────────────────────
console.log("  → signup.png");
await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/signup.png` });

// ── 2. Sign-in form (click the "Sign in" toggle link) ─────────────────────────
console.log("  → sign-in.png");
await page.click('button:has-text("Sign in")');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/sign-in.png` });

// ── 3. Home / dashboard (use existing screenshot if already signed in) ─────────
// To capture the dashboard, set MOBILE and PIN env vars before running:
//   MOBILE=9999999999 PIN=1234 node scripts/screenshot.mjs
const mobile = process.env.MOBILE;
const pin = process.env.PIN;

if (mobile && pin) {
  console.log("  Signing in…");
  await page.fill('input[type="tel"]', mobile);
  await page.fill('input[type="password"]', pin);
  await page.click('button:has-text("Sign in")');
  await page.waitForSelector('input[type="url"][placeholder*="Paste a URL"]', {
    timeout: 15_000,
  });
  await page.waitForTimeout(700);
  console.log("  → home.png");
  await page.screenshot({ path: `${OUT}/home.png` });

  // ── 4. Individual link card (if any cards are present) ──────────────────────
  // Cards currently render as direct children of the links grid.
  const firstCard = page.locator("div.grid > div.group").first();
  if (await firstCard.isVisible({ timeout: 2_000 }).catch(() => false)) {
    console.log("  → link-card.png");
    await firstCard.screenshot({ path: `${OUT}/link-card.png` });
  } else {
    console.log("  (no link cards found — skipping link-card.png)");
  }

  // ── 5. Account settings page ─────────────────────────────────────────────────
  console.log("  → account.png");
  await page.goto(`${BASE_URL}/account`, {
    waitUntil: "networkidle",
    timeout: 15_000,
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/account.png` });

  // Navigate back home so subsequent steps start from the right page
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15_000 });
} else {
  console.log("  (MOBILE/PIN not set — skipping home.png and link-card.png)");
  console.log(
    "  Re-run with: MOBILE=<number> PIN=<pin> node scripts/screenshot.mjs",
  );
}

await browser.close();
console.log(`\n✓ Screenshots saved to public/screenshots/`);
