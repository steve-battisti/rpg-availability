/**
 * Screenshot the design preview in both themes.
 *
 * Shoots preview.html, not the app: the app needs a claimed Supabase session,
 * and design fidelity should stay checkable without one. The preview renders the
 * real screen components against fixture data.
 *
 * This project is a high-fidelity rebuild of a specific design, so "it compiles"
 * proves very little. This is how a change gets checked against
 * design/mars-funk/screenshots/ without a human opening a browser.
 *
 *   npm run build && npm run shot
 *
 * Output lands in .shots/ (gitignored).
 */

import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

const OUT = process.argv[2] ?? '.shots';
const PORT = 4173;

await mkdir(OUT, { recursive: true });
const server = await preview({ preview: { port: PORT, strictPort: true } });
const browser = await chromium.launch();

try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 900 },
      deviceScaleFactor: 2,
    });
    await page.goto(`http://localhost:${PORT}/preview.html`, { waitUntil: 'networkidle' });
    if (theme === 'dark') {
      // Title, not aria-pressed: the app has several toggles now.
      await page.click('button[title^="Switch to"]');
      await page.waitForTimeout(150);
    }
    // Bungee is a heavy display face; without this the shot catches the fallback.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/proof-${theme}.png`, fullPage: true });
    await page.close();
    console.log(`${OUT}/proof-${theme}.png`);
  }
} finally {
  await browser.close();
  await server.close();
}
