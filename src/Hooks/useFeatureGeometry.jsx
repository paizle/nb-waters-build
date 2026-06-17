import { useEffect, useState } from 'react';
import { getFeatureGeometry } from '../Data/geometry';

/**
 * Loads the full (simplified) geometry for a single selected water. Accepts an
 * index item `{ id, lat, lng }` so the data layer can find the right shard.
 */
export default function useFeatureGeometry(item) {
  const [feature, setFeature] = useState(null);

  useEffect(() => {
    let active = true;

    if (!item) {
      setFeature(null);
      return;
    }

    getFeatureGeometry(item.id, item.lat, item.lng).then((result) => {
      if (active) setFeature(result);
    });

    return () => {
      active = false;
    };
  }, [item]);

  return feature;
}
