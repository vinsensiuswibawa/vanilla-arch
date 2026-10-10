// Finds candidate seller-photo sets on Openverse (CC photos from Flickr, Wikimedia, ...).
// Usage: node scripts/photos/search.mjs <slug> "<query>" ["<query>" ...] [--creator "<name>"]
// Writes .cache/photos/<slug>/candidates.json and a numbered contact sheet for curation.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const API = 'https://api.openverse.org/v1/images/';
// Commercial-friendly licenses only, matching the CC-BY-only model decision.
const LICENSES = 'cc0,pdm,by,by-sa';

const args = process.argv.slice(2);
const slug = args.shift();
const creatorIdx = args.indexOf('--creator');
const creator = creatorIdx >= 0 ? args.splice(creatorIdx, 2)[1] : null;
const queries = args;
if (!slug || queries.length === 0) {
  console.error('usage: node scripts/photos/search.mjs <slug> "<query>" ... [--creator "<name>"]');
  process.exit(1);
}

const dir = `.cache/photos/${slug}`;
await mkdir(dir, { recursive: true });
const file = `${dir}/candidates.json`;
const known = existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : [];
const byId = new Map(known.map((c) => [c.id, c]));

for (const q of queries) {
  for (let page = 1; page <= 3; page++) {
    const params = new URLSearchParams({ q, license: LICENSES, category: 'photograph', page_size: '20', page: String(page) });
    if (creator) params.set('creator', creator);
    const res = await fetch(`${API}?${params}`, { headers: { 'User-Agent': 'arcade-showroom-asset-research/0.1' } });
    if (!res.ok) { console.warn(`${q} p${page}: HTTP ${res.status}`); break; }
    const data = await res.json();
    for (const r of data.results ?? []) {
      if (!byId.has(r.id)) {
        byId.set(r.id, {
          id: r.id, title: r.title, creator: r.creator, creatorUrl: r.creator_url,
          license: r.license, licenseVersion: r.license_version, licenseUrl: r.license_url,
          provider: r.provider, source: r.source, landing: r.foreign_landing_url,
          url: r.url, thumb: r.thumbnail, width: r.width, height: r.height, query: q,
        });
      }
    }
    if (!data.page_count || page >= data.page_count) break;
    await new Promise((r) => setTimeout(r, 1200)); // stay well under anonymous rate limits
  }
}

const all = [...byId.values()];
await writeFile(file, JSON.stringify(all, null, 2));

// Group by photographer: a seller's set is several shots of one car by one person.
const groups = new Map();
for (const c of all) {
  const key = `${c.provider}:${c.creator ?? '?'}`;
  groups.set(key, [...(groups.get(key) ?? []), c]);
}
const ranked = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
console.log(`${slug}: ${all.length} candidates from ${groups.size} photographers`);
for (const [key, items] of ranked.slice(0, 12)) console.log(`  ${String(items.length).padStart(3)}  ${key}`);

// Contact sheet: photographers with the most shots first, each tile numbered by its index in candidates.json.
const order = ranked.flatMap(([, items]) => items).slice(0, 48);
const W = 240, H = 160, COLS = 6, LABEL = 18;
const tiles = [];
for (let i = 0; i < order.length; i++) {
  const c = order[i];
  let img;
  try {
    const res = await fetch(c.thumb, { headers: { 'User-Agent': 'arcade-showroom-asset-research/0.1' } });
    img = await sharp(Buffer.from(await res.arrayBuffer())).resize(W, H, { fit: 'cover' }).toBuffer();
  } catch {
    img = await sharp({ create: { width: W, height: H, channels: 3, background: '#ddd' } }).png().toBuffer();
  }
  const idx = all.indexOf(c);
  const text = `${idx} ${(c.creator ?? '?').slice(0, 22)} ${c.license}`.replace(/[<&>]/g, '');
  const label = Buffer.from(`<svg width="${W}" height="${LABEL}"><rect width="100%" height="100%" fill="#fff"/><text x="4" y="13" font-family="Segoe UI, sans-serif" font-size="11" fill="#111">${text}</text></svg>`);
  tiles.push({ input: img, left: (i % COLS) * W, top: Math.floor(i / COLS) * (H + LABEL) });
  tiles.push({ input: label, left: (i % COLS) * W, top: Math.floor(i / COLS) * (H + LABEL) + H });
}
const rows = Math.ceil(order.length / COLS);
await sharp({ create: { width: COLS * W, height: rows * (H + LABEL), channels: 3, background: '#fff' } })
  .composite(tiles).jpeg({ quality: 80 }).toFile(`${dir}/sheet.jpg`);
console.log(`  sheet: ${dir}/sheet.jpg`);
