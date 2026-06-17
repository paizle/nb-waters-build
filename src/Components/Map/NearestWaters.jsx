import { useEffect, useMemo, useState } from 'react'
import { MapIcon } from '@heroicons/react/24/solid'
import { bearing } from '../../Util/coordinates'
import useNearestWaters from '../../Hooks/useNearestWaters'

const ARROW_RADIUS_PX = 78
const NAME_RADIUS_PX = 128

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

/** Offset from map center in container pixels along a compass bearing. */
function offsetFromBearing(bearingDeg, radiusPx) {
  const rad = (bearingDeg * Math.PI) / 180
  return {
    x: Math.sin(rad) * radiusPx,
    y: -Math.cos(rad) * radiusPx,
  }
}

/**
 * Right-side toggle that lists the five waters nearest the map center and, when
 * active, draws directional arrows on the map pointing outward toward each one
 * (name label sits beyond the arrow tip, not under it).
 */
export default function NearestWaters({ map, items, mapView, selectedId, onSelect }) {
  const [open, setOpen] = useState(false)
  const [mapTick, setMapTick] = useState(0)
  const nearest = useNearestWaters(items, mapView)

  useEffect(() => {
    if (!map || !open) return
    const bump = () => setMapTick((t) => t + 1)
    map.on('move zoom', bump)
    return () => {
      map.off('move zoom', bump)
    }
  }, [map, open])

  const overlays = useMemo(() => {
    void mapTick
    if (!open || !map || !nearest.length) return []

    const center = mapView?.bounds?.getCenter()
    if (!center) return []

    const centerPt = map.latLngToContainerPoint(center)

    return nearest.map((item) => {
      const angle = bearing({ lat: center.lat, lng: center.lng }, item)
      const arrowOff = offsetFromBearing(angle, ARROW_RADIUS_PX)
      const nameOff = offsetFromBearing(angle, NAME_RADIUS_PX)

      return {
        item,
        angle,
        arrowLeft: centerPt.x + arrowOff.x,
        arrowTop: centerPt.y + arrowOff.y,
        nameLeft: centerPt.x + nameOff.x,
        nameTop: centerPt.y + nameOff.y,
      }
    })
  }, [open, map, mapView, nearest, mapTick])

  return (
    <>
      <div className="NearestWaters-panel">
        <button
          type="button"
          className={`NearestWaters-toggle ${open ? 'active' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-pressed={open}
          aria-label="Show nearest waters"
          title="Nearest waters to map center"
        >
          <MapIcon />
        </button>

        {open && (
          <div className="NearestWaters-list">
            <div className="NearestWaters-heading">Nearest waters</div>
            <ul>
              {nearest.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={item.id === selectedId ? 'selected' : ''}
                    onClick={() => onSelect(item.id)}
                  >
                    <span className="name">{item.name}</span>
                    <span className="dist">{formatDistance(item.distance)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {open && overlays.length > 0 && (
        <div className="NearestWaters-overlay" aria-hidden>
          {overlays.map(({ item, angle, arrowLeft, arrowTop, nameLeft, nameTop }) => (
            <div key={item.id}>
              <button
                type="button"
                className="NearestWaters-arrow"
                style={{
                  left: arrowLeft,
                  top: arrowTop,
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                }}
                onClick={() => onSelect(item.id)}
                aria-label={`Select ${item.name}`}
                title={item.name}
              />
              <button
                type="button"
                className="NearestWaters-label"
                style={{
                  left: nameLeft,
                  top: nameTop,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => onSelect(item.id)}
              >
                {item.name}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
