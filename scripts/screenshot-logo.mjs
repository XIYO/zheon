import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.URL || 'http://localhost:7777';
const OUT = process.env.OUT || 'static/logo.png';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let link;
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 8000 });
    link = page.getByRole('link', { name: 'Zheon' });
    await link.waitFor({ state: 'visible', timeout: 7000 });
  } catch (e) {
    // Fallback: render minimal header markup for the logo
    await page.setContent(`
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, sans-serif; }
            header { border-bottom: 1px solid #e5e7eb; }
            .brand { font-weight: 800; font-size: 20px; text-decoration: none; color: #111827; display: inline-block; padding: 8px 0; }
          </style>
        </head>
        <body>
          <header>
            <a class="brand" href="/">Zheon</a>
          </header>
        </body>
      </html>
    `, { waitUntil: 'domcontentloaded' });
    link = page.getByRole('link', { name: 'Zheon' });
    await link.waitFor({ state: 'visible', timeout: 3000 });
  }

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  await link.screenshot({ path: OUT });
  await browser.close();
  // eslint-disable-next-line no-console
  console.log(`Saved logo screenshot to ${OUT}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
