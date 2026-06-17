import { useEffect, useState } from 'react';
import { cellKeysForBounds, getCellsFeatures } from '../Data/geometry';

/**
 * Lazily loads simplified outline geometry for the current viewport, but only
 * once zoomed in past `minZoom` (rendering every outline at low zoom is both
 * slow and visually noisy). Returns shard features: `{ id, name, lat, lng, geometry }`.
 */
export default function useViewportGeometry(bounds, zoom, minZoom = 12) {
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    let active = true;

    if (!bounds || zoom == null || zoom < minZoom) {
      setFeatures([]);
      return;
    }

    (async () => {
      const keys = await cellKeysForBounds(bounds);
      const all = await getCellsFeatures(keys);
      if (!active) return;
      // Restrict to features whose centroid is inside the padded viewport so
      // we don't draw a whole cell's worth of outlines off-screen.
      const padded = bounds.pad(0.25);
      setFeatures(all.filter((f) => padded.contains([f.lat, f.lng])));
    })();

    return () => {
      active = false;
    };
  }, [bounds, zoom, minZoom]);

  return features;
}
