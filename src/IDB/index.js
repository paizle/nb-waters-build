import { openDB } from 'idb';
import { getFeatureId, getFeatureName } from '../Util/featureGetters';
import { polygonCentroid } from '../Util/coordinates'

const dbName = 'waters';
export const waterFeaturesTable = 'water-features';
export const sortedWatersTable = 'sorted-waters';
export const featureCentroidsTable = 'feature-centroids';

export const dbPromise = openDB(dbName, 1, {
  async upgrade(db) {
    console.log('one')
    if (!db.objectStoreNames.contains(waterFeaturesTable)) {
      db.createObjectStore(waterFeaturesTable, { keyPath: 'properties.OBJECTID' });
    }

    console.log('two')
    
    if (!db.objectStoreNames.contains(sortedWatersTable)) {
      db.createObjectStore(sortedWatersTable, { autoIncrement: true });
    }

    console.log('three')
    
    if (!db.objectStoreNames.contains(featureCentroidsTable)) {
      db.createObjectStore(featureCentroidsTable, { keyPath: 'OBJECTID' });
    }
  },
}).then(async (db) => {
  // Populate waterFeaturesTable if empty
  const count = await db.count(waterFeaturesTable);
  if (count === 0) {
    console.log('test')
    const response = await fetch('/waters.geojson', { cache: 'default' });
    console.log('hi!!!')
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
      .map((item) => ({ id: getFeatureId(item), name: getFeatureName(item) }))
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
