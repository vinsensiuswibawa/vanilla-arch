// Model prep for the lineup (content/lineup.json). Keeps each model's authored materials and textures;
// removes props; renames the car's paint material(s) to the canonical "paint" so the listing colour can
// replace it at runtime (lib/materials.ts); repairs the materials Sketchfab's export flattens (below); puts
// the nose toward +Z at real length with the origin on the ground; joins meshes by material (fewer draw
// calls, less CPU per frame); and writes the shipping files:
//   public/models/<slug>.glb       the showroom and listing file (hero: 400k triangles, 2K textures)
//   public/models/<slug>.lod1.glb  the phone variant (40k triangles, 512 px textures)
// Lab-only files go to public/lab (gitignored), for /lab comparisons:
//   --lab          also writes <slug>.budget.glb (110k triangles, 1K textures)
//   --checkpoints  writes showroom files at rising triangle caps (<slug>.b110.glb …) instead
//   --raw          also writes the unreduced file (<slug>.glb)
// Usage: node scripts/models/optimize.mjs [--lab] [--checkpoints] [--raw] [slug ...]
import { existsSync, statSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { center, cloneDocument, dedup, flatten, join, meshopt, prune, simplifyPrimitive, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const LINEUP = JSON.parse(await readFile('content/lineup.json', 'utf8'));

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);

// Paint is simplified last, since denting its panels shows in reflections; everything else gives up
// triangles first. The desktop file is the hero (the site runs on desktops and is screen-recorded, so
// quality wins over the old 120k cap); the budget file stays for lab comparisons.
const SHIPPING = [
  { suffix: '', dir: 'public/models', triangles: 400_000, texture: 2048 },
  { suffix: '.lod1', dir: 'public/models', triangles: 40_000, texture: 512 },
];
const BUDGET = { suffix: '.budget', dir: 'public/lab', triangles: 110_000, texture: 1024 };
const CHECKPOINTS = [110, 150, 200, 260].map((k) => ({ suffix: `.b${k}`, dir: 'public/lab', triangles: k * 1000, texture: 1024 }));

let prims = (doc) => doc.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives());
const tris = (prim) => (prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION').getCount()) / 3;
const sum = (list) => list.reduce((total, prim) => total + tris(prim), 0);
// Area-weighted normals from the simplified faces; stale normals show as creases in reflections.
function smoothNormals(prim, doc) {
  const pos = prim.getAttribute('POSITION');
  const idx = prim.getIndices();
  if (!idx) return;
  let normal = prim.getAttribute('NORMAL');
  if (!normal) {
    normal = doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos.getCount() * 3)).setBuffer(doc.getRoot().listBuffers()[0]);
    prim.setAttribute('NORMAL', normal);
  }
  const acc = new Float32Array(pos.getCount() * 3);
  const a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0];
  for (let i = 0; i < idx.getCount(); i += 3) {
    const k = [idx.getScalar(i), idx.getScalar(i + 1), idx.getScalar(i + 2)];
    pos.getElement(k[0], a); pos.getElement(k[1], b); pos.getElement(k[2], c);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    for (const j of k) for (let d = 0; d < 3; d++) acc[j * 3 + d] += n[d];
  }
  for (let j = 0; j < pos.getCount(); j++) {
    const len = Math.hypot(acc[j * 3], acc[j * 3 + 1], acc[j * 3 + 2]);
    if (len) normal.setElement(j, [acc[j * 3] / len, acc[j * 3 + 1] / len, acc[j * 3 + 2] / len]);
  }
}

// HSL of a linear colour, as three's Color.getHSL and setHSL compute it in the working colour space.
function getHSL([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (min + max) / 2;
  if (min === max) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l <= 0.5 ? d / (max + min) : d / (2 - max - min);
  const h = (max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4) / 6;
  return { h, s, l };
}
function fromHSL(h, s, l) {
  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);
    return p;
  };
  const q = l <= 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)];
}

/**
 * Repairs what Sketchfab's export flattens, baked into the file so the showroom, listings, lab and
 * stills all draw the same car. The listing paint is applied at runtime (lib/materials.ts).
 */
function repairMaterials(doc) {
  for (const material of doc.getRoot().listMaterials()) {
    const name = material.getName().toLowerCase();
    const color = material.getBaseColorFactor();
    const setAlpha = (alpha) => material.setAlphaMode('BLEND').setBaseColorFactor([...material.getBaseColorFactor().slice(0, 3), alpha]);
    // Transmission makes three.js render the scene a second time each frame; a clear, glossy lens reads
    // the same at showroom distance for a fraction of the cost.
    const transmission = material.getExtension('KHR_materials_transmission');
    if (transmission?.getTransmissionFactor() > 0) {
      material.setExtension('KHR_materials_transmission', null);
      material.setExtension('KHR_materials_volume', null);
      // A coloured lens (the Integra's textured tail lights) carries its colour in the map or the tint: nearly
      // opaque keeps it deep over the reflector behind. Clear lenses stay see-through.
      const hsl = getHSL(color);
      const map = Boolean(material.getBaseColorTexture());
      setAlpha(map || hsl.s > 0.5 ? 0.9 : 0.25);
      material.setRoughnessFactor(Math.min(material.getRoughnessFactor(), 0.05));
      // A dark tint at 0.9 hides the reflector behind it (the Gallardo's tail lights): lift the red and let
      // the reflector show through.
      if (!map && hsl.s > 0.5 && hsl.l < 0.25) material.setBaseColorFactor([...fromHSL(hsl.h, 0.9, 0.38), 0.6]);
    }
    // An opaque black "glass" cover over a headlight (the Gallardo's glass_trans) hides the lamp inside.
    if (/glass_trans/.test(name) && material.getAlphaMode() !== 'BLEND') setAlpha(0.22);
    const clearcoat = material.getExtension('KHR_materials_clearcoat');
    // Sketchfab exports often leave rubber glossy, metallic or clear-coated; real tyres are matte.
    if (/tire|tyre|rubber|pneu/.test(name)) {
      material.setMetallicFactor(0).setRoughnessFactor(Math.max(material.getRoughnessFactor(), 0.85));
      material.setExtension('KHR_materials_clearcoat', null);
    }
    // Black trim, roof and interior arrive with a clear coat from the export, which throws white streaks
    // across the MX-5 NC's roof; plastics and fabrics have no lacquer.
    if (/^(black|interior)|plastic|trim|fabric|cloth/.test(name) && clearcoat?.getClearcoatFactor() > 0) {
      material.setExtension('KHR_materials_clearcoat', null);
      material.setRoughnessFactor(Math.max(material.getRoughnessFactor(), 0.85));
    }
    // Near-opaque exported glass (author tuning that lived in Sketchfab's viewer) becomes see-through again.
    const alpha = material.getBaseColorFactor()[3];
    if (name !== 'paint' && /glass/.test(name) && material.getAlphaMode() === 'BLEND' && alpha > 0.6 && !/red|orange|light/.test(name)) {
      setAlpha(0.28);
      material.setMetallicFactor(0);
    }
  }
}

// Paint and wheels keep protected shares of the budget (the body's reflections and the tyres' texture
// coordinates both break when crushed); every other part is reduced by visual error first, so dense trim
// (the Datsun's 645k triangles of chrome) gives way before the parts people look at.
// Parts whose triangles share no vertices (split normals, flat shading) can't be simplified at all: drop
// their normals so welding can join them, and rebuild smooth normals afterwards.
// `force` (per car, content/lineup.json "unlock") names parts split just under the ratio (the MX-5 NC's black
// trim at 1.12 vertices per triangle) that otherwise refuse to shrink.
async function unlockSplitParts(doc, keep = [], force = []) {
  const split = prims(doc).filter((prim) => !keep.includes(prim.getMaterial()?.getName()) && prim.getAttribute('NORMAL') && tris(prim) > 2000 && (force.includes(prim.getMaterial()?.getName()) || prim.getAttribute('POSITION').getCount() / tris(prim) > 1.2));
  for (const prim of split) {
    prim.setAttribute('NORMAL', null);
    prim.setAttribute('TANGENT', null);
  }
  if (split.length) await doc.transform(weld());
  return new Set(split.map((prim) => prim.getMaterial()?.getName()));
}
function toBudget(doc, BUDGET, rebuilt = new Set(), protect = [], keep = [], keepNormals = false) {
  const all = prims;
  // Kept parts are invisible to the budget: they neither count nor get reduced.
  prims = (d) => all(d).filter((prim) => !keep.includes(prim.getMaterial()?.getName()));
  try { return reduce(doc, BUDGET, rebuilt, protect, keepNormals); } finally { prims = all; }
}
function reduce(doc, BUDGET, rebuilt, protect, keepNormals) {
  const name = (prim) => prim.getMaterial()?.getName() ?? '';
  const isPaint = (prim) => /paint/i.test(name(prim)) && !/black/i.test(name(prim));
  const isWheel = (prim) => /tire|tyre|rubber|rim|alloy|wheel/i.test(name(prim));
  // keepNormals (per car): a dense, smooth source body keeps its authored normals through simplification;
  // rebuilding them from the reduced faces shows every millimetre dent as a crease (the 550's bumper).
  const isSmooth = (prim) => isPaint(prim) && !keepNormals;
  const run = (list, ratio, error) => { for (const prim of list) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: Math.min(1, Math.max(0.01, ratio)), error }); };
  // A car's signature detail (the MX-5 NC's chrome rims) can be protected per car in
  // content/lineup.json: { "materials": [...], "share": 0.2 }. Paint and wheels shrink to make room.
  const extra = protect.map((rule) => ({ ...rule, test: (p) => rule.materials.includes(name(p)) }));
  const isExtra = (p) => extra.some((rule) => rule.test(p));
  const extraShare = extra.reduce((total, rule) => total + rule.share, 0);
  const groups = [
    { list: prims(doc).filter((p) => isPaint(p) && !isExtra(p)), share: 0.38 * (1 - extraShare), error: 0.001 },
    { list: prims(doc).filter((p) => !isPaint(p) && !isExtra(p) && isWheel(p)), share: 0.22 * (1 - extraShare), error: 0.002 },
    ...extra.map((rule) => ({ list: prims(doc).filter(rule.test), share: rule.share, error: 0.001 })),
  ];
  const rest = prims(doc).filter((p) => !groups.some((group) => group.list.includes(p)));
  if (sum(prims(doc)) <= BUDGET) return;
  // Protected groups only shrink to their share; whatever they don't need is left for the rest.
  for (const group of groups) if (sum(group.list) > BUDGET * group.share) run(group.list, (BUDGET * group.share) / sum(group.list), group.error);
  const room = BUDGET - groups.reduce((total, group) => total + sum(group.list), 0);
  for (const error of [0.002, 0.004, 0.008, 0.016]) {
    if (sum(rest) <= room) break;
    run(rest, room / sum(rest), error);
  }
  // Some models carry parts the simplifier won't touch under a tight error (a 433k-triangle underbody):
  // loosen step by step until the car fits, paint last.
  for (const error of [0.03, 0.06, 0.12, 0.25, 0.5]) {
    if (sum(prims(doc)) <= BUDGET * 1.02) break;
    const others = prims(doc).filter((p) => !isPaint(p) && !isExtra(p));
    const paintNow = sum(prims(doc).filter(isPaint));
    run(others, Math.max(0.01, (BUDGET - Math.min(paintNow, BUDGET * 0.38)) / sum(others)), error);
    // Paint never drops below a quarter of the budget: the body is what people look at.
    if (sum(prims(doc)) > BUDGET * 1.02) run(prims(doc).filter(isPaint), Math.max(BUDGET * 0.25, BUDGET - sum(others)) / Math.max(1, paintNow), error / 3);
  }
  for (const prim of prims(doc)) {
    if (tris(prim) === 0) prim.dispose();
    else if (isSmooth(prim) || rebuilt.has(prim.getMaterial()?.getName()) || !prim.getAttribute('NORMAL')) smoothNormals(prim, doc);
  }
}
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const args = process.argv.slice(2);
const only = args.filter((arg) => !arg.startsWith('--'));
const checkpoints = args.includes('--checkpoints');
const variants = checkpoints ? CHECKPOINTS : [...SHIPPING, ...(args.includes('--lab') ? [BUDGET] : [])];
for (const dir of new Set(variants.map((variant) => variant.dir))) await mkdir(dir, { recursive: true });
if (args.includes('--raw')) await mkdir('public/lab', { recursive: true });

for (const [slug, cfg] of Object.entries(LINEUP)) {
  if (only.length && !only.includes(slug)) continue;
  const raw = `raw/${slug}.glb`;
  if (!existsSync(raw)) { console.log(`${slug}: ${raw} missing (run npm run models:fetch)`); continue; }
  const doc = await io.read(raw);
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];

  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    const removeNode = cfg.removeNodes.some((re) => new RegExp(re, 'i').test(node.getName()));
    if (removeNode || mesh?.listPrimitives().some((prim) => cfg.removeMaterials.includes(prim.getMaterial()?.getName()))) node.dispose();
  }
  for (const material of root.listMaterials()) if (cfg.paint.includes(material.getName())) material.setName('paint');
  repairMaterials(doc);

  const pivot = doc.createNode('arcade-root');
  for (const child of scene.listChildren()) { scene.removeChild(child); pivot.addChild(child); }
  scene.addChild(pivot);
  const half = (cfg.rotateY * Math.PI) / 360;
  pivot.setRotation([0, Math.sin(half), 0, Math.cos(half)]);
  const b = getBounds(scene);
  const scale = cfg.lengthMm / 1000 / (b.max[2] - b.min[2]);
  pivot.setScale([scale, scale, scale]);

  await doc.transform(center({ pivot: 'below' }), dedup(), prune());
  const outputs = variants.map((variant) => ({ ...variant, doc: cloneDocument(doc) }));
  if (args.includes('--raw')) outputs.unshift({ suffix: '', dir: 'public/lab', triangles: Infinity, texture: 2048, doc });
  for (const { suffix, dir, triangles, texture, doc: target } of outputs) {
    await target.transform(weld(), flatten(), join({ keepNamed: false }));
    // budgetScale lifts only the lab's budget file for dense signature detail; the other caps are absolute.
    const limit = suffix === '.budget' ? Math.round(triangles * (cfg.budgetScale ?? 1)) : triangles;
    // keepDetail: parts the desktop file keeps at full detail with their own normals (a wire grille whose
    // shading breaks once its normals are rebuilt). They stay out of every reduction there.
    const keep = dir === 'public/models' && suffix === '' ? (cfg.keepDetail ?? []) : [];
    if (triangles !== Infinity && sum(prims(target)) > limit) {
      const kept = prims(target).filter((prim) => keep.includes(prim.getMaterial()?.getName()));
      const keptTris = sum(kept);
      toBudget(target, Math.max(limit * 0.4, limit - keptTris), await unlockSplitParts(target, keep, cfg.unlock), (cfg.protect ?? []).filter((rule) => !rule.materials.some((m) => keep.includes(m))), keep, cfg.keepNormals);
    }
    await target.transform(prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [texture, texture] }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
    const file = `${dir}/${slug}${suffix}.glb`;
    await io.write(file, target);
    console.log(`${file}: ${(statSync(file).size / 1048576).toFixed(2)} MB, ${Math.round(sum(prims(target)))} triangles, ${prims(target).length} draw calls`);
  }
}
