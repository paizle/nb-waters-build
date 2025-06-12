import { openDB } from 'idb';
import { getKey, getName } from '../Util/featureGetters';

const dbName = 'waters';
export const waterFeaturesTable = 'water-features';
export const sortedWatersTable = 'sorted-waters';
export const featureCentroidsTable = 'feature-centroids';

export const dbPromise = openDB(dbName, 1, {
  async upgrade(db) {
    if (!db.objectStoreNames.contains(waterFeaturesTable)) {
      db.createObjectStore(waterFeaturesTable, { keyPath: 'properties.OBJECTID' });
    }

    if (!db.objectStoreNames.contains(sortedWatersTable)) {
      db.createObjectStore(sortedWatersTable, { autoIncrement: true });
    }

    if (!db.objectStoreNames.contains(featureCentroidsTable)) {
      db.createObjectStore(featureCentroidsTable, { keyPath: 'OBJECTID' });
    }
  },
}).then(async (db) => {
  // Populate waterFeaturesTable if empty
  const count = await db.count(waterFeaturesTable);
  if (count === 0) {
    const response = await fetch('/waters.geojson', { cache: 'default' });
    const data = await response.json();
    const tx = db.transaction(waterFeaturesTable, 'readwrite');
    for (const feature of data.features) {
      const centroid = polygonCentroid(feature.geometry.coordinates[0]);
      feature.centroid = centroid;
      tx.store.put(feature);
    }
    await tx.done;
  }
  return db;
}).then(async (db) => {
  // Populate sortedWatersTable if empty
  const count = await db.count(sortedWatersTable);
  if (count === 0) {
    const allRecords = await db.getAll(waterFeaturesTable);

    const sortFeatures = (a, b) => {
      if (a.name === '' && b.name !== '') return 1;
      if (a.name !== '' && b.name === '') return -1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    };

    const sorted = allRecords
      .slice()
      .map((item) => ({ id: getKey(item), name: getName(item) }))
      .sort(sortFeatures)
      .map((item, index) => ({ ...item, order: index }))

    const tx = db.transaction(sortedWatersTable, 'readwrite');
    for (const record of sorted) {
      tx.store.add(record);
    }
    await tx.done;
  }
  return db;
}).then(async (db) => {
  // Populate featureCentroidsTable if empty
  const count = await db.count(featureCentroidsTable);
  if (count === 0) {
    const allRecords = await db.getAll(waterFeaturesTable);
    const tx = db.transaction(featureCentroidsTable, 'readwrite');

    for (const feature of allRecords) {
      tx.store.put({
        OBJECTID: feature.properties.OBJECTID,
        WATERSHEDCODE: feature.properties.WATERSHEDCODE,
        centroid: feature.centroid, // already calculated on insert
      });
    }
    await tx.done;
  }

  return db;
});

export async function getWaterFeatures() {
  const db = await dbPromise;
  return db.getAll(waterFeaturesTable);
}

export async function getSortedWaterNames() {
  const db = await dbPromise;
  return db.getAll(sortedWatersTable);
}

export async function getFeatureCentroids() {
  const db = await dbPromise;
  return db.getAll(featureCentroidsTable);
}

function polygonCentroid(points) {
  let area = 0;
  let x = 0;
  let y = 0;
  const n = points.length;

  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    x += (x0 + x1) * cross;
    y += (y0 + y1) * cross;
  }

  area = area / 2;
  x = x / (6 * area);
  y = y / (6 * area);

  return { lat: y, lng: x };
}
