import { useEffect, useState, useCallback } from 'react';
import {
  getSortedWaterNames,
  dbPromise,
  waterFeaturesTable,
  featureCentroidsTable,
} from '../IDB/index';

import { haversineDistance } from '../Util/coordinates';

export default function useRecords() {
  const [sortedWaters, setSortedWaters] = useState([]);

  useEffect(() => {
    getSortedWaterNames().then(setSortedWaters);
  }, []);

  // Lookup a single water feature by OBJECTID
  const getFeatureById = useCallback(async (id) => {
    const db = await dbPromise;
    return db.get(waterFeaturesTable, Number(id));
  }, []);

  // Find all features within X meters of a given point
  const getFeaturesWithinDistance = useCallback(
    async (center, maxDistanceMeters) => {
      const db = await dbPromise;
      const centroids = await db.getAll(featureCentroidsTable);
      return Promise.all(
        centroids
          .filter(({ centroid }) => haversineDistance(center, centroid) <= maxDistanceMeters)
          .map((record) => getFeatureById(record.OBJECTID))
      );
    },
    [getFeatureById]
  );

  return {
    sortedWaters,
    getFeatureById,
    getFeaturesWithinDistance,
  };
}
