import { useEffect, useRef } from 'react'
import {
  MapPinIcon,
  ViewfinderCircleIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { bearing } from '../../Util/coordinates'
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
 * 2. Snap to GPS (tracking)
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
  const { isAvailable, isEnabled, enable, isTracking, setIsTracking, position } = geolocation
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
    if (!map) return
    if (position) {
      panToGps(map, position)
    } else {
      pendingPanRef.current = true
    }
  }

  const handleSnapToGps = () => {
    if (!isEnabled) enable()
    setIsTracking(true)
    requestPan()
  }

  const handleMoveToLocation = () => {
    if (!isEnabled) enable()
    setIsTracking(false)
    requestPan()
  }

  const bounds = mapView?.bounds
  const showIndicator = selectedItem && bounds
  const inView = showIndicator && bounds.contains([selectedItem.lat, selectedItem.lng])
  const angle = showIndicator && !inView ? bearing(bounds.getCenter(), selectedItem) : 0

  return (
    <div className="MapToolbar">
      {showIndicator && (
        <div className="MapToolbar-selection">
          <button
            type="button"
            className="MapToolbar-pointer"
            onClick={onFocusSelected}
            aria-label={`Go to ${selectedItem.name}`}
            title={inView ? `${selectedItem.name} is in view` : `Go to ${selectedItem.name}`}
          >
            {inView ? (
              <CheckCircleIcon className="MapToolbar-here" />
            ) : (
              <ArrowUpIcon className="MapToolbar-arrow" style={{ transform: `rotate(${angle}deg)` }} />
            )}
            <span className="MapToolbar-name">{selectedItem.name}</span>
          </button>
          <button
            type="button"
            className="MapToolbar-cancel"
            onClick={onClearSelected}
            aria-label="Clear selected water"
            title="Clear selection"
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
            label="Snap to GPS"
            active={isTracking}
            isTouch={isTouch}
            onAction={handleSnapToGps}
            labelPosition="below"
            ariaLabel="Snap to GPS"
          />
          <MapControlButton
            icon={ViewfinderCircleIcon}
            label="Move to my location"
            active={false}
            isTouch={isTouch}
            onAction={handleMoveToLocation}
            labelPosition="below"
            ariaLabel="Move to my location"
          />
        </div>
      )}
    </div>
  )
}
