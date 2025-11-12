import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.URL || 'http://localhost:7777';
const OUT = process.env.OUT || 'static/logo.png';
const SELECTOR = process.env.SELECTOR; // optional CSS selector for element screenshot

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let target;
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 8000 });
    if (SELECTOR) {
      target = page.locator(SELECTOR);
      await target.waitFor({ state: 'visible', timeout: 7000 });
    } else {
      // try brand link just to ensure page rendered
      target = page.getByRole('link', { name: 'Zheon' });
      await target.waitFor({ state: 'visible', timeout: 7000 });
    }
  } catch (e) {
    // Fallback: render minimal header markup for the logo
    await page.setContent(`
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            :root { color-scheme: light; }
            body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, sans-serif; background: #fafafa; color: #111827; }
            header { position: sticky; top: 0; background: #fff; border-bottom: 1px solid #e5e7eb; padding: 12px 16px; }
            .brand { font-weight: 800; font-size: 20px; text-decoration: none; color: #111827; display: inline-block; }
            main { max-width: 960px; margin: 0 auto; padding: 24px 16px; }
            .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
            .row { display: flex; gap: 12px; align-items: center; }
            input[type="url"] { flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
            button { padding: 10px 14px; border: 1px solid #111827; background: #111827; color: #fff; border-radius: 8px; font-weight: 600; }
            ul { list-style: none; padding: 0; margin: 0; }
            li { display: flex; gap: 12px; padding: 12px 8px; border-top: 1px solid #f3f4f6; align-items: center; }
            .dot { width: 8px; height: 8px; border-radius: 9999px; background: #10b981; flex: 0 0 auto; }
            .thumb { width: 100px; aspect-ratio: 16/9; background: #e5e7eb; border-radius: 4px; flex: 0 0 auto; }
            .title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          </style>
        </head>
        <body>
          <header>
            <a class="brand" href="/">Zheon</a>
          </header>
          <main>
            <section class="card">
              <form class="row">
                <input type="url" placeholder="YouTube URL을 입력하세요" />
                <button type="button">분석하기</button>
              </form>
            </section>
            <section class="card">
              <ul>
                <li><span class="dot"></span><div class="thumb"></div><div class="title">예시 영상 제목 1 - 요약 대기...</div></li>
                <li><span class="dot" style="background:#f59e0b"></span><div class="thumb"></div><div class="title">예시 영상 제목 2 - 처리 중...</div></li>
                <li><span class="dot" style="background:#ef4444"></span><div class="thumb"></div><div class="title">예시 영상 제목 3 - 실패 사유 표시</div></li>
              </ul>
            </section>
          </main>
        </body>
      </html>
    `, { waitUntil: 'domcontentloaded' });
    target = page.getByRole('link', { name: 'Zheon' });
    await target.waitFor({ state: 'visible', timeout: 3000 });
  }

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  if (SELECTOR) {
    await target.screenshot({ path: OUT });
  } else {
    await page.screenshot({ path: OUT, fullPage: true });
  }
  await browser.close();
  // eslint-disable-next-line no-console
  console.log(`Saved logo screenshot to ${OUT}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
