import { useEffect, useMemo, useState } from 'react'
import { MapIcon, ArrowUpIcon } from '@heroicons/react/24/outline'
import MapControlButton from './MapControlButton'
import useNearestWaters from '../../Hooks/useNearestWaters'
import { bearing } from '../../Util/coordinates'
import { computeNearestOverlays, formatDistance } from './nearestWatersUtils'

/** Full-map overlay: directional arrows + labels when nearest-waters is active. */
export function NearestWatersOverlay({ map, mapView, items, active, onSelect }) {
  const [mapTick, setMapTick] = useState(0)
  const nearest = useNearestWaters(items, mapView)

  useEffect(() => {
    if (!map || !active) return
    const bump = () => setMapTick((t) => t + 1)
    map.on('move zoom', bump)
    return () => {
      map.off('move zoom', bump)
    }
  }, [map, active])

  const overlays = useMemo(() => {
    void mapTick
    if (!active) return []
    return computeNearestOverlays(map, mapView, nearest)
  }, [active, map, mapView, nearest, mapTick])

  if (!active || !overlays.length) return null

  return (
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
  )
}

/** Right-side control: popper + list; toggles map arrows on click / second tap. */
export function NearestWatersPanel({
  mapView,
  items,
  selectedId,
  onSelect,
  isTouch,
  active,
  onActiveChange,
}) {
  const nearest = useNearestWaters(items, mapView)
  const center = mapView?.bounds?.getCenter()

  const handleAction = () => {
    onActiveChange(!active)
  }

  const list = (
    <ul className="NearestWaters-list-items">
      {nearest.map((item) => {
        const angle = center ? bearing({ lat: center.lat, lng: center.lng }, item) : 0
        return (
          <li key={item.id}>
            <button
              type="button"
              className={item.id === selectedId ? 'selected' : ''}
              onClick={() => onSelect(item.id)}
            >
              <ArrowUpIcon className="dir-arrow" style={{ transform: `rotate(${angle}deg)` }} />
              <span className="name">{item.name}</span>
              <span className="dist">{formatDistance(item.distance)}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="NearestWaters-panel">
      <MapControlButton
        icon={MapIcon}
        label="Nearest Waters"
        active={active}
        isTouch={isTouch}
        onAction={handleAction}
        labelPosition="left"
        childrenPosition="left"
        ariaLabel="Nearest waters to map center"
      >
        {list}
      </MapControlButton>
    </div>
  )
}
