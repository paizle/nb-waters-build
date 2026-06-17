import { dbPromise, STORE_INDEX, STORE_META } from './db';
import { loadManifest } from './manifest';

const INDEX_URL = '/data/index.json';
const INDEX_KEY = 'all';
const VERSION_KEY = 'indexVersion';

let indexPromise = null;

/**
 * Returns the lightweight water index: `[{ id, name, lat, lng }]` sorted by
 * name. Served from IndexedDB after the first load; only re-fetched when the
 * manifest version changes. Shared across the app via a module-level promise.
 */
export function loadWaterIndex() {
  if (!indexPromise) indexPromise = fetchAndCache();
  return indexPromise;
}

async function fetchAndCache() {
  const db = await dbPromise;
  const [manifest, cached, cachedVersion] = await Promise.all([
    loadManifest(),
    db.get(STORE_INDEX, INDEX_KEY),
    db.get(STORE_META, VERSION_KEY),
  ]);

  const isFresh = cached && (!manifest || manifest.version === cachedVersion);
  if (isFresh) return cached;

  const res = await fetch(INDEX_URL);
  if (!res.ok) {
    if (cached) return cached; // network failed but we have something usable
    throw new Error('Failed to load water index');
  }
  const items = await res.json();

  await db.put(STORE_INDEX, items, INDEX_KEY);
  if (manifest?.version) await db.put(STORE_META, manifest.version, VERSION_KEY);
  return items;
}
