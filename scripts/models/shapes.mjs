// Measures every shipped car's bounding box and convex hull from public/models/<slug>.glb and writes
// content/shapes.json, which the detail page's camera solver reads (lib/choreography.ts), so nothing is
// measured in the browser. Usage: node scripts/models/shapes.mjs [slug ...]   (npm run shapes)
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { Matrix4, Vector3 } from 'three';
// Node strips the types; the module imports only three, so the app and this script share one measurement.
import { shapeOf, toData } from '../../lib/shape.ts';

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const lineup = JSON.parse(await readFile('content/lineup.json', 'utf8'));
const only = process.argv.slice(2);
const out = existsSync('content/shapes.json') ? JSON.parse(await readFile('content/shapes.json', 'utf8')) : {};

for (const slug of Object.keys(lineup)) {
  if (only.length && !only.includes(slug)) continue;
  const file = `public/models/${slug}.glb`;
  if (!existsSync(file)) { console.log(`${slug}: no model, skipped`); continue; }
  const scene = (await io.read(file)).getRoot().listScenes()[0];
  const parts = [];
  let total = 0;
  scene.traverse((node) => {
    const mesh = node.getMesh();
    if (!mesh) return;
    const matrix = new Matrix4().fromArray(node.getWorldMatrix());
    for (const primitive of mesh.listPrimitives()) {
      const position = primitive.getAttribute('POSITION');
      parts.push({ position, matrix });
      total += position.getCount();
    }
  });
  function* vertices() {
    const element = [0, 0, 0];
    const v = new Vector3();
    for (const { position, matrix } of parts) {
      for (let i = 0; i < position.getCount(); i++) {
        position.getElement(i, element);
        yield v.set(element[0], element[1], element[2]).applyMatrix4(matrix);
      }
    }
  }
  const data = toData(shapeOf(vertices(), total));
  out[slug] = data;
  const size = data.max.map((m, i) => (m - data.min[i]).toFixed(2)).join(' x ');
  console.log(`${slug}: box ${size} m, ${data.hull.length} hull points`);
}

// Node writes JSON without a BOM, unlike PowerShell.
await writeFile('content/shapes.json', JSON.stringify(out));
console.log('wrote content/shapes.json');
