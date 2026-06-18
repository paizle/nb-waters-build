import { bearing } from '../../Util/coordinates'

export const ARROW_RADIUS_PX = 78
export const NAME_RADIUS_PX = 128

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

/** Offset from map center in container pixels along a compass bearing. */
export function offsetFromBearing(bearingDeg, radiusPx) {
  const rad = (bearingDeg * Math.PI) / 180
  return {
    x: Math.sin(rad) * radiusPx,
    y: -Math.cos(rad) * radiusPx,
  }
}

export function computeNearestOverlays(map, mapView, nearest) {
  if (!map || !nearest.length) return []

  const center = mapView?.bounds?.getCenter()
  if (!center) return []

  const centerPt = map.latLngToContainerPoint(center)
  const from = { lat: center.lat, lng: center.lng }
  const maxDist = Math.max(...nearest.map((w) => w.distance), 1)

  return nearest.map((item) => {
    const angle = bearing(from, item)
    const arrowOff = offsetFromBearing(angle, ARROW_RADIUS_PX)
    const nameOff = offsetFromBearing(angle, NAME_RADIUS_PX)

    return {
      item,
      angle,
      arrowLeft: centerPt.x + arrowOff.x,
      arrowTop: centerPt.y + arrowOff.y,
      nameLeft: centerPt.x + nameOff.x,
      nameTop: centerPt.y + nameOff.y,
      zIndex: 920 + Math.round((1 - item.distance / maxDist) * 79),
    }
  })
}
