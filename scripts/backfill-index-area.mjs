/**
 * Add `area` (m²) to public/data/index.json from existing geometry shards.
 * Use when index was built before prepare-data wrote area, or source GeoJSON is absent.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as turf from '@turf/turf';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_PATH = resolve(ROOT, 'public/data/index.json');
const GEOMETRY_DIR = resolve(ROOT, 'public/data/geometry');
const MANIFEST_PATH = resolve(ROOT, 'public/data/manifest.json');

const index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
const areaById = new Map();

for (const file of readdirSync(GEOMETRY_DIR)) {
  if (!file.endsWith('.json')) continue
  const shard = JSON.parse(readFileSync(resolve(GEOMETRY_DIR, file), 'utf8'))
  for (const item of shard) {
    let area = 0
    try {
      area = Math.round(
        turf.area({ type: 'Feature', geometry: item.geometry, properties: {} })
      )
    } catch {
      /* ignore */
    }
    areaById.set(item.id, area)
  }
}

for (const entry of index) {
  entry.area = areaById.get(entry.id) ?? 0
}

writeFileSync(INDEX_PATH, JSON.stringify(index))

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
manifest.version = String(Date.now())
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest))

const withArea = index.filter((e) => e.area > 0).length
const maxArea = index.reduce((m, e) => Math.max(m, e.area ?? 0), 0)
const sample = index.find((e) => e.name === 'Millstream Lake')

console.log(`Updated ${index.length} index entries (${withArea} with area > 0).`)
console.log(`Max area: ${maxArea.toLocaleString()} m²`)
if (sample) console.log(`Sample — ${sample.name}: ${sample.area.toLocaleString()} m²`)
console.log(`Manifest version bumped → clients will refetch index.`)
