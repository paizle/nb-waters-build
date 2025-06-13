import { useEffect, useState } from 'react';
import {
  getSortedWaterNames,
  dbPromise,
  waterFeaturesTable,
  featureCentroidsTable,
} from '../IDB/index';

import { getFeatureId } from '../Util/featureGetters';

import { haversineDistance } from '../Util/coordinates';

export default function useRecords() {
  const [sortedWaters, setSortedWaters] = useState([]);

  useEffect(() => {
    getSortedWaterNames().then(setSortedWaters);
  }, []);

  // Lookup a single water feature by OBJECTID
  async function getFeatureById(id) {
    const db = await dbPromise;
    return db.get(waterFeaturesTable, Number(id)); // Ensure numeric ID
  }

  // Find all features within X meters of a given point
  async function getFeaturesWithinDistance(center, maxDistanceMeters) {
    const db = await dbPromise;
    const centroids = await db.getAll(featureCentroidsTable);
    return await Promise.all(
      centroids
        .filter(({ centroid }) => haversineDistance(center, centroid) <= maxDistanceMeters)
        .map((record) => getFeatureById(record.OBJECTID))
    )
  }

  return {
    sortedWaters,
    getFeatureById,
    getFeaturesWithinDistance,
  };
}
