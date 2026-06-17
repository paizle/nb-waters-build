import { useEffect, useState } from 'react';
import { loadWaterIndex } from '../Data/waterIndex';

/**
 * Loads the shared water index (id, name, centroid for every water).
 * Cached in IndexedDB by the data layer, so this is instant after first load.
 */
export default function useWaterIndex() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    loadWaterIndex()
      .then((data) => {
        if (!active) return;
        setItems(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { items, isLoading, error };
}
