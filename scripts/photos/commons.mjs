// Finds same-car photo sets on Wikimedia Commons: files in a model category (plus chosen
// subcategories), grouped by photographer and day, since that is how one car's set appears.
// Usage: node scripts/photos/commons.mjs <slug> "<Category:...>" ["<Category:...>" ...]
//          [--sub "<substring>"] [--depth 1] [--min 3]
// Subcategories up to --depth are walked; with --sub, only matching ones contribute files.
// Writes .cache/photos/<slug>/commons.json and commons-sheet.jpg (tiles labelled g<group>.<n>).
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = { 'User-Agent': 'arcade-showroom-asset-research/0.1 (one-off photo curation for a portfolio site)' };
const OK_LICENSE = /^(CC0|Public domain|PD|CC BY(-SA)? [0-9.]+)/i; // commercial-friendly only

const args = process.argv.slice(2);
const slug = args.shift();
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const subFilters = args.flatMap((a, i) => (args[i - 1] === '--sub' ? [a.toLowerCase()] : []));
const min = Number(opt('--min', '3'));
const depth = Number(opt('--depth', '1'));
const roots = args.filter((a, i) => a.startsWith('Category:') && !String(args[i - 1]).startsWith('--'));
if (!slug || roots.length === 0) { console.error('usage: commons.mjs <slug> "<Category:...>" ... [--sub "<substring>"] [--depth 1] [--min 3]'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  for (let attempt = 0; attempt < 8; attempt++) {
    await sleep(700); // Wikimedia asks for modest, serial request rates
    const res = await fetch(url, { headers: UA });
    if (res.ok) return res;
    if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status} for ${url}`);
    await sleep(2000 * 2 ** attempt);
  }
  throw new Error(`gave up after retries: ${url}`);
}
async function api(params) {
  const res = await get(`${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`);
  return res.json();
}

async function members(cat, type) {
  const out = [];
  let cont = {};
  do {
    const data = await api({ action: 'query', list: 'categorymembers', cmtitle: cat, cmtype: type, cmlimit: '500', ...cont });
    out.push(...(data.query?.categorymembers ?? []).map((m) => m.title));
    cont = data.continue ?? null;
  } while (cont);
  return out;
}

// Walk subcategories breadth-first up to --depth.
const found = [];
let frontier = roots;
for (let d = 0; d < depth && frontier.length; d++) {
  const next = [];
  for (const cat of frontier) {
    for (const s of await members(cat, 'subcat')) {
      if (!found.includes(s) && !roots.includes(s)) { found.push(s); next.push(s); }
    }
  }
  frontier = next;
}
console.log(`${roots.join(', ')}: ${found.length} subcategories within depth ${depth}`);
for (const s of found) console.log(`  ${s}`);
const picked = subFilters.length ? found.filter((s) => subFilters.some((f) => s.toLowerCase().includes(f))) : found;
const chosen = [...roots, ...picked];

const files = new Set();
for (const cat of chosen) for (const f of await members(cat, 'file')) files.add(f);
console.log(`files across ${chosen.length} categories: ${files.size}`);

const strip = (html) => (html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const items = [];
const titles = [...files];
for (let i = 0; i < titles.length; i += 20) {
  const data = await api({
    action: 'query', prop: 'imageinfo', titles: titles.slice(i, i + 20).join('|'),
    iiprop: 'url|size|extmetadata|user', iiurlwidth: '360',
  });
  for (const p of data.query?.pages ?? []) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/\.(jpe?g|png|webp)$/i.test(p.title)) continue;
    const m = ii.extmetadata ?? {};
    const license = strip(m.LicenseShortName?.value);
    if (!OK_LICENSE.test(license)) continue;
    const date = strip(m.DateTimeOriginal?.value).slice(0, 10) || 'undated';
    items.push({
      title: p.title, artist: strip(m.Artist?.value) || ii.user, license, licenseUrl: m.LicenseUrl?.value ?? null,
      date, width: ii.width, height: ii.height, url: ii.url, thumb: ii.thumburl, page: ii.descriptionurl,
      description: strip(m.ImageDescription?.value).slice(0, 200),
    });
  }
}

// Group by photographer + day; bigger groups are likelier to be one car shot from many angles.
const groups = new Map();
for (const it of items) {
  const key = `${it.artist} | ${it.date}`;
  groups.set(key, [...(groups.get(key) ?? []), it]);
}
const ranked = [...groups.entries()].filter(([, g]) => g.length >= min).sort((a, b) => b[1].length - a[1].length);
const out = ranked.map(([key, g], gi) => ({ group: gi, key, size: g.length, items: g }));
await mkdir(`.cache/photos/${slug}`, { recursive: true });
await writeFile(`.cache/photos/${slug}/commons.json`, JSON.stringify(out, null, 2));
console.log(`${items.length} usable files; ${out.length} groups with >= ${min} photos`);
for (const g of out.slice(0, 15)) console.log(`  g${g.group}  ${String(g.size).padStart(3)}  ${g.key}`);

const tilesList = out.flatMap((g) => g.items.slice(0, 12).map((it, n) => ({ it, label: `g${g.group}.${n} ${it.artist.slice(0, 18)} ${it.date}` }))).slice(0, 60);
const W = 240, H = 160, COLS = 6, LABEL = 18;
const composites = [];
for (let i = 0; i < tilesList.length; i++) {
  const { it, label } = tilesList[i];
  let img;
  try {
    const res = await get(it.thumb);
    img = await sharp(Buffer.from(await res.arrayBuffer())).resize(W, H, { fit: 'cover' }).toBuffer();
  } catch {
    img = await sharp({ create: { width: W, height: H, channels: 3, background: '#ddd' } }).png().toBuffer();
  }
  const text = label.replace(/[<&>]/g, '');
  const svg = Buffer.from(`<svg width="${W}" height="${LABEL}"><rect width="100%" height="100%" fill="#fff"/><text x="4" y="13" font-family="Segoe UI, sans-serif" font-size="11" fill="#111">${text}</text></svg>`);
  composites.push({ input: img, left: (i % COLS) * W, top: Math.floor(i / COLS) * (H + LABEL) });
  composites.push({ input: svg, left: (i % COLS) * W, top: Math.floor(i / COLS) * (H + LABEL) + H });
}
if (composites.length) {
  const rows = Math.ceil(tilesList.length / COLS);
  await sharp({ create: { width: COLS * W, height: rows * (H + LABEL), channels: 3, background: '#fff' } })
    .composite(composites).jpeg({ quality: 80 }).toFile(`.cache/photos/${slug}/commons-sheet.jpg`);
  console.log(`  sheet: .cache/photos/${slug}/commons-sheet.jpg`);
}
