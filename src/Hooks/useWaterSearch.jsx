import { useMemo } from 'react';
import useDebounce from './useDebounce';

/**
 * Debounced, case-insensitive filter over the in-memory water index.
 * Returns the full list when the query is empty. The list is virtualized by
 * the UI, so we can safely return every match.
 */
export default function useWaterSearch(items, query, delay = 200) {
  const debounced = useDebounce(query, delay);

  return useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, debounced]);
}
