import { useEffect, useRef } from 'react'
import {
  MapPinIcon,
  ViewfinderCircleIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { bearing } from '../../Util/coordinates'
import { formatWaterName } from '../../Util/waterName'
import MapControlButton from './MapControlButton'

const TRACKING_MIN_ZOOM = 13

function panToGps(map, position) {
  map.setView([position.lat, position.lng], Math.max(map.getZoom(), TRACKING_MIN_ZOOM), {
    animate: true,
  })
}

/**
 * On-map control area (top-right). Stack order:
 * 1. Selected-water indicator + cancel
 * 2. Lock to GPS (tracking)
 * 3. Move to my location (one-shot)
 */
export default function MapToolbar({
  map,
  geolocation,
  selectedItem,
  mapView,
  isTouch,
  onFocusSelected,
  onClearSelected,
}) {
  const { isAvailable, requestFix, isTracking, setIsTracking, position } = geolocation
  const pendingPanRef = useRef(false)

  useEffect(() => {
    if (!map || !position || !pendingPanRef.current) return
    pendingPanRef.current = false
    panToGps(map, position)
  }, [map, position])

  useEffect(() => {
    if (!map || !isTracking || !position) return
    panToGps(map, position)
  }, [map, isTracking, position])

  useEffect(() => {
    if (!map) return
    const stop = () => setIsTracking(false)
    map.on('dragstart', stop)
    return () => {
      map.off('dragstart', stop)
    }
  }, [map, setIsTracking])

  const requestPan = () => {
    pendingPanRef.current = true
    if (map && position) {
      pendingPanRef.current = false
      panToGps(map, position)
    }
  }

  const handleLockToGps = () => {
    if (isTracking) {
      setIsTracking(false)
      return
    }
    requestFix()
    setIsTracking(true)
    requestPan()
  }

  const handleMoveToLocation = () => {
    setIsTracking(false)
    requestFix()
    requestPan()
  }

  const bounds = mapView?.bounds
  const showIndicator = selectedItem && bounds
  const inView = showIndicator && bounds.contains([selectedItem.lat, selectedItem.lng])
  const angle = showIndicator && !inView ? bearing(bounds.getCenter(), selectedItem) : 0

  const displayName = selectedItem ? formatWaterName(selectedItem) : ''

  return (
    <div className="MapToolbar">
      {showIndicator && (
        <div className="MapToolbar-selection">
          <button
            type="button"
            className="MapToolbar-pointer"
            onClick={onFocusSelected}
            aria-label={inView ? `${displayName} is in view` : `Go to ${displayName}`}
          >
            {inView ? (
              <CheckCircleIcon className="MapToolbar-here" />
            ) : (
              <ArrowUpIcon className="MapToolbar-arrow" style={{ transform: `rotate(${angle}deg)` }} />
            )}
            <span className="MapToolbar-name">{displayName}</span>
          </button>
          <button
            type="button"
            className="MapToolbar-cancel"
            onClick={onClearSelected}
            aria-label="Clear selected water"
          >
            <XMarkIcon />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {isAvailable && (
        <div className="MapToolbar-buttons">
          <MapControlButton
            icon={MapPinIcon}
            label="Lock to GPS"
            active={isTracking}
            isTouch={isTouch}
            onAction={handleLockToGps}
            labelPosition="left"
            actionOnFirstTap
            ariaLabel="Lock to GPS"
          />
          <MapControlButton
            icon={ViewfinderCircleIcon}
            label="Move to my location"
            active={false}
            isTouch={isTouch}
            onAction={handleMoveToLocation}
            labelPosition="left"
            actionOnFirstTap
            ariaLabel="Move to my location"
          />
        </div>
      )}
    </div>
  )
}
