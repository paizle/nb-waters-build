import { useEffect, useRef } from 'react'
import {
  MapPinIcon,
  ViewfinderCircleIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { bearing } from '../../Util/coordinates'

const TRACKING_MIN_ZOOM = 13

/**
 * On-map control area (rendered as an HTML overlay, not a Leaflet control).
 * - GPS button: requests location permission only on first click, then toggles
 *   continuous tracking.
 * - Snap button: centers the map on the current position.
 * - Direction indicator: when a water is selected, shows an arrow pointing from
 *   the current map center toward it (or a "located" icon when it is already in
 *   view), plus its name. Clicking the indicator re-frames the map onto it.
 */
export default function MapToolbar({ map, geolocation, selectedItem, mapView, onFocusSelected, onClearSelected }) {
  const { isAvailable, isEnabled, enable, isTracking, setIsTracking, position } = geolocation
  const pendingSnapRef = useRef(false)

  // Follow the user while tracking is on.
  useEffect(() => {
    if (!map || !isTracking || !position) return
    map.setView([position.lat, position.lng], Math.max(map.getZoom(), TRACKING_MIN_ZOOM), {
      animate: true,
    })
  }, [map, isTracking, position])

  // Center once when a snap was requested before the first fix arrived.
  useEffect(() => {
    if (!map || !position || !pendingSnapRef.current) return
    pendingSnapRef.current = false
    map.setView([position.lat, position.lng], Math.max(map.getZoom(), TRACKING_MIN_ZOOM), {
      animate: true,
    })
  }, [map, position])

  // Dragging the map stops tracking.
  useEffect(() => {
    if (!map) return
    const stop = () => setIsTracking(false)
    map.on('dragstart', stop)
    return () => {
      map.off('dragstart', stop)
    }
  }, [map, setIsTracking])

  const handleGps = () => {
    if (!isEnabled) {
      enable()
      setIsTracking(true)
    } else {
      setIsTracking(!isTracking)
    }
  }

  const handleSnap = () => {
    if (!isEnabled) {
      enable()
      pendingSnapRef.current = true
    } else if (position) {
      map?.setView([position.lat, position.lng], Math.max(map.getZoom(), TRACKING_MIN_ZOOM), {
        animate: true,
      })
    }
  }

  // Direction indicator, relative to the current map center.
  const bounds = mapView?.bounds
  const showIndicator = selectedItem && bounds
  const inView = showIndicator && bounds.contains([selectedItem.lat, selectedItem.lng])
  const angle = showIndicator && !inView ? bearing(bounds.getCenter(), selectedItem) : 0

  return (
    <div className="MapToolbar">
      {isAvailable && (
        <div className="MapToolbar-buttons">
          <button
            type="button"
            className={`MapToolbar-button ${isTracking ? 'active' : ''}`}
            onClick={handleGps}
            aria-pressed={isTracking}
            aria-label={isEnabled ? 'Toggle GPS tracking' : 'Enable GPS'}
            title={isEnabled ? 'Toggle GPS tracking' : 'Enable GPS'}
          >
            <MapPinIcon />
          </button>
          <button
            type="button"
            className="MapToolbar-button"
            onClick={handleSnap}
            aria-label="Snap to my location"
            title="Snap to my location"
          >
            <ViewfinderCircleIcon />
          </button>
        </div>
      )}

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
    </div>
  )
}
