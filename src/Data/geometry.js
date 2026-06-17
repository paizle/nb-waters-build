import { dbPromise, STORE_CELLS } from './db';
import { loadManifest, loadAvailableCells } from './manifest';

const CELL_FALLBACK_SIZE = 0.25;

let cellSizePromise = null;
const cellPromises = new Map();

async function getCellSize() {
  if (!cellSizePromise) {
    cellSizePromise = loadManifest().then((m) => m?.cellSize ?? CELL_FALLBACK_SIZE);
  }
  return cellSizePromise;
}

export async function cellKeyForPoint(lat, lng) {
  const size = await getCellSize();
  return `${Math.floor(lat / size)}_${Math.floor(lng / size)}`;
}

/**
 * Returns the cell keys covering a Leaflet bounds object, restricted to cells
 * that actually exist in the manifest.
 */
export async function cellKeysForBounds(bounds) {
  const [size, available] = await Promise.all([getCellSize(), loadAvailableCells()]);
  const south = Math.floor(bounds.getSouth() / size);
  const north = Math.floor(bounds.getNorth() / size);
  const west = Math.floor(bounds.getWest() / size);
  const east = Math.floor(bounds.getEast() / size);

  const keys = [];
  for (let y = south; y <= north; y++) {
    for (let x = west; x <= east; x++) {
      const key = `${y}_${x}`;
      if (available.has(key)) keys.push(key);
    }
  }
  return keys;
}

/** Loads (and caches in IDB) a single geometry shard. */
function getCell(key) {
  if (!cellPromises.has(key)) cellPromises.set(key, loadCell(key));
  return cellPromises.get(key);
}

async function loadCell(key) {
  const db = await dbPromise;
  const cached = await db.get(STORE_CELLS, key);
  if (cached) return cached;

  const res = await fetch(`/data/geometry/${key}.json`);
  const features = res.ok ? await res.json() : [];
  await db.put(STORE_CELLS, features, key);
  return features;
}

/** Loads and flattens the geometry features for several cells. */
export async function getCellsFeatures(keys) {
  const groups = await Promise.all(keys.map(getCell));
  return groups.flat();
}

/** Geometry for a single feature, found via the cell containing its centroid. */
export async function getFeatureGeometry(id, lat, lng) {
  const key = await cellKeyForPoint(lat, lng);
  const features = await getCell(key);
  return features.find((f) => f.id === id) ?? null;
}
