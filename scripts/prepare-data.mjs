/**
 * Build-time data pipeline.
 *
 * Converts the large raw `waters.geojson` (~82MB, 17k features) into small
 * static artifacts the app can load quickly and cache:
 *
 *   public/data/index.json            -> [{ id, name, lat, lng, area }] sorted by name
 *   public/data/geometry/{cell}.json  -> [{ id, name, lat, lng, geometry }] per grid cell
 *   public/data/manifest.json         -> { version, cellSize, cells: [{ key, count }] }
 *
 * The raw source lives outside the served `public/` folder so it is never
 * shipped to the browser. Run with: `npm run prepare-data`.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as turf from '@turf/turf';
import { getNameFromProps } from './waterNameUtils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Candidate input locations (first existing wins).
const INPUT_CANDIDATES = [
  resolve(ROOT, 'data-src/waters.geojson'),
  resolve(ROOT, 'public/waters.geojson'),
];

const OUT_DIR = resolve(ROOT, 'public/data');
const GEOMETRY_DIR = resolve(OUT_DIR, 'geometry');

// Grid cell size in degrees. 0.25deg cells keep shard sizes small while
// limiting the number of files.
const CELL_SIZE = 0.25;
// Douglas-Peucker tolerance in degrees (~10m). Shrinks geometry a lot while
// staying visually faithful at the zoom levels where outlines are shown.
const SIMPLIFY_TOLERANCE = 0.0001;
const COORD_PRECISION = 5;

function findInput() {
  const found = INPUT_CANDIDATES.find((p) => existsSync(p));
  if (!found) {
    console.error(
      'No source GeoJSON found. Place it at one of:\n' +
        INPUT_CANDIDATES.map((p) => `  - ${p}`).join('\n')
    );
    process.exit(1);
  }
  return found;
}

const getName = getNameFromProps;

function roundCoords(coords) {
  if (typeof coords[0] === 'number') {
    return [
      Number(coords[0].toFixed(COORD_PRECISION)),
      Number(coords[1].toFixed(COORD_PRECISION)),
    ];
  }
  return coords.map(roundCoords);
}

function cellKey(lat, lng) {
  return `${Math.floor(lat / CELL_SIZE)}_${Math.floor(lng / CELL_SIZE)}`;
}

function main() {
  const input = findInput();
  console.log(`Reading ${input} ...`);
  const raw = JSON.parse(readFileSync(input, 'utf8'));
  const features = raw.features ?? [];
  console.log(`Parsed ${features.length} features.`);

  const index = [];
  const cells = new Map(); // cellKey -> array of shard features

  let skipped = 0;
  for (const feature of features) {
    const props = feature.properties ?? {};
    const id = props.OBJECTID;
    if (id == null || !feature.geometry) {
      skipped++;
      continue;
    }
    const name = getName(props);

    let centroid;
    try {
      centroid = turf.centroid(feature).geometry.coordinates; // [lng, lat]
    } catch {
      skipped++;
      continue;
    }
    const lng = Number(centroid[0].toFixed(COORD_PRECISION));
    const lat = Number(centroid[1].toFixed(COORD_PRECISION));

    let area = 0;
    try {
      area = Math.round(turf.area(feature));
    } catch {
      /* ignore */
    }

    index.push({ id, name, lat, lng, area });

    let geometry = feature.geometry;
    try {
      geometry = turf.simplify(feature, {
        tolerance: SIMPLIFY_TOLERANCE,
        highQuality: false,
        mutate: false,
      }).geometry;
    } catch {
      // Fall back to the original geometry if simplification fails.
    }
    geometry = { ...geometry, coordinates: roundCoords(geometry.coordinates) };

    const key = cellKey(lat, lng);
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push({ id, name, lat, lng, geometry });
  }

  const sortFeatures = (a, b) => {
    const aUnnamed = a.name.startsWith('Unnamed');
    const bUnnamed = b.name.startsWith('Unnamed');
    if (aUnnamed !== bUnnamed) return aUnnamed ? 1 : -1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  };
  index.sort(sortFeatures);

  // Fresh output dir.
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(GEOMETRY_DIR, { recursive: true });

  writeFileSync(resolve(OUT_DIR, 'index.json'), JSON.stringify(index));

  const manifestCells = [];
  for (const [key, shard] of cells) {
    writeFileSync(resolve(GEOMETRY_DIR, `${key}.json`), JSON.stringify(shard));
    manifestCells.push({ key, count: shard.length });
  }

  const manifest = {
    version: String(Date.now()),
    cellSize: CELL_SIZE,
    coordPrecision: COORD_PRECISION,
    featureCount: index.length,
    cells: manifestCells,
  };
  writeFileSync(resolve(OUT_DIR, 'manifest.json'), JSON.stringify(manifest));

  console.log(
    `Wrote ${index.length} index entries, ${manifestCells.length} geometry shards` +
      (skipped ? `, skipped ${skipped} features.` : '.')
  );
}

main();
