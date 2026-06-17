import { useMemo } from 'react'
import { haversineDistance } from '../Util/coordinates'

/** Returns the `count` index items closest to the current map center. */
export default function useNearestWaters(items, mapView, count = 5) {
  return useMemo(() => {
    if (!mapView?.bounds || !items.length) return []

    const center = mapView.bounds.getCenter()
    const from = { lat: center.lat, lng: center.lng }

    return items
      .map((item) => ({ ...item, distance: haversineDistance(from, item) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
  }, [items, mapView, count])
}
