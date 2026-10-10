// Renders each car's still from the dev studio (app/studio/[slug]?still=og) with Playwright:
// public/stills/<slug>-og.jpg (1200x630 share card) and <slug>-card.webp (phone neighbours).
// Starts its own `next dev` on port 3100 unless STUDIO_URL points at a running server.
// Needs public/models/<slug>.glb. Usage: node scripts/stills.mjs [slug ...]
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const PORT = 3100;
const base = process.env.STUDIO_URL ?? `http://localhost:${PORT}`;
const models = JSON.parse(await readFile('content/lineup.json', 'utf8'));
const only = process.argv.slice(2);
const slugs = Object.keys(models).filter((slug) => (!only.length || only.includes(slug)) && existsSync(`public/models/${slug}.glb`));
if (!slugs.length) {
  console.log('No optimized models in public/models yet; run npm run models first.');
  process.exit(0);
}

const stop = (child) => {
  if (!child) return;
  // On Windows the shell wraps `next dev`, so kill the whole process tree.
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F']);
  else child.kill('SIGTERM');
};

let server;
if (!process.env.STUDIO_URL) {
  server = spawn(`npx next dev -p ${PORT}`, { shell: true, stdio: 'ignore' });
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    try { up = (await fetch(base)).ok; } catch { /* still starting */ }
    if (!up) await new Promise((r) => setTimeout(r, 1000));
  }
  if (!up) { stop(server); throw new Error(`next dev did not start on ${base}`); }
}

await mkdir('public/stills', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
try {
  for (const slug of slugs) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.goto(`${base}/studio/${slug}?still=og`, { waitUntil: 'load', timeout: 180_000 });
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' }); // hide the dev indicator
    await page.waitForSelector('html[data-studio-ready="true"]', { timeout: 180_000 });
    const shot = await page.screenshot({ type: 'png' });
    await sharp(shot).jpeg({ quality: 86, mozjpeg: true }).toFile(`public/stills/${slug}-og.jpg`);
    await sharp(shot).resize(800).webp({ quality: 80 }).toFile(`public/stills/${slug}-card.webp`);
    console.log(`${slug}: og + card stills`);
    await page.close();
  }
} finally {
  await browser.close();
  stop(server);
}
