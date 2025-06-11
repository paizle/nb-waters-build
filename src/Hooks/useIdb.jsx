import { useEffect, useState } from 'react';
import {
  getSortedWaterNames,
  dbPromise,
  waterFeaturesTable,
  featureCentroidsTable,
} from '../IDB/index';

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

  // Haversine distance in meters between two points (lat/lng)
  function haversineDistance(a, b) {
    const R = 6371e3; // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;

    const φ1 = toRad(a.lat);
    const φ2 = toRad(b.lat);
    const Δφ = toRad(b.lat - a.lat);
    const Δλ = toRad(b.lng - a.lng);

    const aVal =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));

    const distance = R * c;
    console.log(distance)
    return distance
  }


  // Find all feature OBJECTIDs within X meters of a given point
  async function getFeaturesWithinDistance(center, maxDistanceMeters) {
    const db = await dbPromise;
    const centroids = await db.getAll(featureCentroidsTable);
    console.log('Loaded centroids:', centroids.length); // <-- Add this
    console.log('Centroid:', centroids[0]); // <-- Add this
    console.log(center)

    return await Promise.all(
      centroids
        .filter(({ centroid }) => haversineDistance(center, centroid) <= maxDistanceMeters)
        .map(({ OBJECTID }) => getFeatureById(OBJECTID))
    );
  }

  return {
    sortedWaters,
    getFeatureById,
    getFeaturesWithinDistance,
  };
}
