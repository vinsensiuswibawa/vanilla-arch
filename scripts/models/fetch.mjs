// Downloads each model in content/lineup.json from Sketchfab as raw/<slug>.glb.
// Needs SKETCHFAB_API_TOKEN in .env.local (gitignored). Existing files are kept.
// Usage: node scripts/models/fetch.mjs [slug ...]
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const token = process.env.SKETCHFAB_API_TOKEN?.trim();
if (!token) {
  console.error('SKETCHFAB_API_TOKEN is missing from .env.local (Sketchfab > Settings > Password & API).');
  process.exit(1);
}

const lineup = JSON.parse(await readFile('content/lineup.json', 'utf8'));
const only = process.argv.slice(2);
await mkdir('raw', { recursive: true });

for (const [slug, model] of Object.entries(lineup)) {
  if (only.length && !only.includes(slug)) continue;
  const out = `raw/${slug}.glb`;
  if (existsSync(out)) { console.log(`${slug}: already downloaded`); continue; }
  const res = await fetch(`https://api.sketchfab.com/v3/models/${model.uid}/download`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) { console.error(`${slug}: download API returned HTTP ${res.status}`); continue; }
  const archives = await res.json();
  if (!archives.glb?.url) { console.error(`${slug}: no GLB archive offered (formats: ${Object.keys(archives).join(', ')})`); continue; }
  const file = await fetch(archives.glb.url); // pre-signed URL, no auth header
  if (!file.ok) { console.error(`${slug}: GLB fetch returned HTTP ${file.status}`); continue; }
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(out, bytes);
  console.log(`${slug}: ${(bytes.length / 1048576).toFixed(1)} MB`);
}
