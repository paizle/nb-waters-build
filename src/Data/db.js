import { openDB } from 'idb';

const DB_NAME = 'nb-waters';
const DB_VERSION = 1;

export const STORE_META = 'meta';
export const STORE_INDEX = 'waterIndex';
export const STORE_CELLS = 'geometryCells';

// Single shared connection. All stores are simple key/value stores so the
// data layer can decide its own keys (the water index lives under one key,
// geometry shards are keyed by their cell key).
export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
    if (!db.objectStoreNames.contains(STORE_INDEX)) db.createObjectStore(STORE_INDEX);
    if (!db.objectStoreNames.contains(STORE_CELLS)) db.createObjectStore(STORE_CELLS);
  },
});
