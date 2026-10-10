// Prints what each raw model contains, to write its settings in content/lineup.json.
// Usage: node scripts/models/inspect.mjs [slug ...]   (reads raw/<slug>.glb)
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const models = JSON.parse(await readFile('content/lineup.json', 'utf8'));
const only = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

const triangles = (prim) => {
  const idx = prim.getIndices();
  const count = idx ? idx.getCount() : prim.getAttribute('POSITION').getCount();
  return prim.getMode() === 4 ? count / 3 : 0;
};
const hex = (rgba) => '#' + rgba.slice(0, 3).map((c) => Math.round(Math.min(1, c ** (1 / 2.2)) * 255).toString(16).padStart(2, '0')).join('');

for (const slug of Object.keys(models)) {
  if (only.length && !only.includes(slug)) continue;
  const file = `raw/${slug}.glb`;
  if (!existsSync(file)) { console.log(`\n${slug}: not downloaded`); continue; }
  const doc = await io.read(file);
  const root = doc.getRoot();
  const b = getBounds(root.getDefaultScene() ?? root.listScenes()[0]);
  const size = b.max.map((v, i) => v - b.min[i]);
  let tris = 0, prims = 0;
  const trisByMaterial = new Map();
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const t = triangles(prim);
      tris += t; prims++;
      const name = prim.getMaterial()?.getName() || '(none)';
      trisByMaterial.set(name, (trisByMaterial.get(name) ?? 0) + t);
    }
  }
  console.log(`\n=== ${slug}  size x/y/z = ${size.map((v) => v.toFixed(2)).join(' / ')}  tris ${Math.round(tris)}  primitives ${prims}`);
  console.log('materials (name | base colour | textures | tris):');
  for (const m of root.listMaterials()) {
    const tex = ['getBaseColorTexture', 'getNormalTexture', 'getMetallicRoughnessTexture', 'getOcclusionTexture', 'getEmissiveTexture']
      .filter((g) => m[g]()).map((g) => g.replace(/^get|Texture$/g, ''));
    console.log(`  ${m.getName() || '(unnamed)'} | ${hex(m.getBaseColorFactor())} a${m.getBaseColorFactor()[3].toFixed(2)} ${m.getAlphaMode()} | ${tex.join(',') || '-'} | ${Math.round(trisByMaterial.get(m.getName()) ?? 0)}`);
  }
  console.log('textures:', root.listTextures().map((t) => `${t.getName() || t.getURI() || '?'} ${t.getSize()?.join('x')}`).join('; ') || '-');
  console.log('nodes:', root.listNodes().map((n) => n.getName()).filter(Boolean).slice(0, 120).join(' | '));
}
