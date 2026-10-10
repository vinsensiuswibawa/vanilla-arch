// Downloads the curated seller photos listed in content/photos.selection.json from
// Wikimedia Commons, converts them to WebP in public/photos/<slug>/, and writes
// content/photos.json with credit and license data for every image.
// A pick is a Commons file ({ file }) or, for photos found on Openverse (scripts/photos/search.mjs),
// a direct image with its own credit: { url, credit, license, licenseUrl, sourceUrl }.
// Usage: node scripts/photos/fetch.mjs            (all cars)
//        node scripts/photos/fetch.mjs --preview <slug>   (contact sheet only, no downloads)
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = { 'User-Agent': 'arcade-showroom-asset-research/0.1 (one-off photo curation for a portfolio site)' };
const MAX_EDGE = 2000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// upload.wikimedia.org throttles bulk downloads hard: honor Retry-After, and once throttled,
// keep every later request at least 10 s apart for the rest of the run.
let throttled = false;
async function get(url, pace = 700) {
  for (let attempt = 0; attempt < 7; attempt++) {
    await sleep(throttled ? Math.max(pace, 10_000) : pace);
    const res = await fetch(url, { headers: UA });
    if (res.ok) return res;
    if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status} for ${url}`);
    throttled = true;
    const retryAfter = Number(res.headers.get('retry-after'));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5000 * 2 ** attempt;
    console.log(`  throttled (HTTP ${res.status}); waiting ${Math.round(wait / 1000)} s`);
    await sleep(wait);
  }
  throw new Error(`gave up after retries: ${url}`);
}

const strip = (html) => (html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function info(titles, width) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo',
    titles: titles.join('|'), iiprop: 'url|size|extmetadata', iiurlwidth: String(width),
  });
  const data = await (await get(`${API}?${params}`)).json();
  const byTitle = new Map();
  for (const p of data.query?.pages ?? []) {
    if (p.missing) throw new Error(`missing on Commons: ${p.title}`);
    const ii = p.imageinfo[0];
    const m = ii.extmetadata ?? {};
    byTitle.set(p.title, {
      thumb: ii.thumburl, page: ii.descriptionurl,
      artist: strip(m.Artist?.value), license: strip(m.LicenseShortName?.value),
      licenseUrl: m.LicenseUrl?.value ?? null,
    });
  }
  // The API normalizes titles (underscores, capitalization); map back by order-insensitive lookup.
  return (t) => byTitle.get(t) ?? byTitle.get(t.replace(/_/g, ' '));
}

// Commons picks get their URLs and credits from the API; direct picks carry their own.
async function commonsOrDirect(picks, width) {
  const files = picks.filter((p) => p.file).map((p) => p.file);
  const lookup = files.length ? await info(files, width) : () => undefined;
  return (pick) => pick.file
    ? lookup(pick.file)
    : { thumb: pick.url, page: pick.sourceUrl, artist: pick.credit, license: pick.license, licenseUrl: pick.licenseUrl };
}

const selection = JSON.parse(await readFile('content/photos.selection.json', 'utf8'));
const previewIdx = process.argv.indexOf('--preview');

if (previewIdx >= 0) {
  const slug = process.argv[previewIdx + 1];
  const picks = selection[slug] ?? [];
  const lookup = await commonsOrDirect(picks, 480);
  const W = 320, H = 213, COLS = 4, LABEL = 18;
  const composites = [];
  for (let i = 0; i < picks.length; i++) {
    const meta = lookup(picks[i]);
    const img = await sharp(Buffer.from(await (await get(meta.thumb)).arrayBuffer())).resize(W, H, { fit: 'cover' }).toBuffer();
    const text = `${i} ${picks[i].kind} | ${(picks[i].file?.slice(5) ?? picks[i].credit).slice(0, 37)}`.replace(/[<&>]/g, '');
    composites.push({ input: img, left: (i % COLS) * W, top: Math.floor(i / COLS) * (H + LABEL) });
    composites.push({ input: Buffer.from(`<svg width="${W}" height="${LABEL}"><rect width="100%" height="100%" fill="#fff"/><text x="4" y="13" font-family="Segoe UI, sans-serif" font-size="11" fill="#111">${text}</text></svg>`), left: (i % COLS) * W, top: Math.floor(i / COLS) * (H + LABEL) + H });
  }
  await mkdir(`.cache/photos/${slug}`, { recursive: true });
  const rows = Math.ceil(picks.length / COLS);
  await sharp({ create: { width: COLS * W, height: rows * (H + LABEL), channels: 3, background: '#fff' } })
    .composite(composites).jpeg({ quality: 82 }).toFile(`.cache/photos/${slug}/selected.jpg`);
  console.log(`preview: .cache/photos/${slug}/selected.jpg (${picks.length} photos)`);
  process.exit(0);
}

const manifest = {};
for (const [slug, picks] of Object.entries(selection)) {
  if (!picks.length) continue;
  await mkdir(`public/photos/${slug}`, { recursive: true });
  const lookup = await commonsOrDirect(picks, 2400);
  manifest[slug] = [];
  for (let i = 0; i < picks.length; i++) {
    const pick = picks[i];
    const meta = lookup(pick);
    // Named by source, not position, so reordering a selection can't mislabel a file.
    const name = `${createHash('sha1').update(pick.file ?? pick.url).digest('hex').slice(0, 10)}.webp`;
    const path = `public/photos/${slug}/${name}`;
    // Resumable: keep files from an earlier run (delete one to re-fetch it).
    const out = existsSync(path)
      ? await sharp(path).metadata()
      : await sharp(Buffer.from(await (await get(meta.thumb, 2500)).arrayBuffer()))
        .rotate() // honor EXIF orientation
        .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(path);
    manifest[slug].push({
      src: `/photos/${slug}/${name}`, width: out.width, height: out.height,
      kind: pick.kind, alt: pick.alt,
      credit: meta.artist, license: meta.license, licenseUrl: meta.licenseUrl, sourceUrl: meta.page,
    });
    console.log(`${slug}/${name}  ${out.width}x${out.height}  ${meta.license}  ${meta.artist}`);
  }
}
await writeFile('content/photos.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`wrote content/photos.json (${Object.values(manifest).flat().length} photos)`);
