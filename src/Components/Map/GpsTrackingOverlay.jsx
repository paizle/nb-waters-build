import { useEffect, useMemo, useState } from 'react'
import { bearing } from '../../Util/coordinates'
import { offsetFromBearing } from './nearestWatersUtils'

const ARROW_RADIUS_PX = 78

/** Green direction arrow toward selected water while lock-to-GPS is active. */
export default function GpsTrackingOverlay({ map, mapView, selectedItem, active }) {
  const [mapTick, setMapTick] = useState(0)

  useEffect(() => {
    if (!map || !active) return
    const bump = () => setMapTick((t) => t + 1)
    map.on('move zoom', bump)
    return () => {
      map.off('move zoom', bump)
    }
  }, [map, active])

  const style = useMemo(() => {
    void mapTick
    if (!active || !map || !selectedItem || !mapView?.bounds) return null

    const center = mapView.bounds.getCenter()
    const angle = bearing(center, selectedItem)
    const centerPt = map.latLngToContainerPoint(center)
    const off = offsetFromBearing(angle, ARROW_RADIUS_PX)

    return {
      angle,
      left: centerPt.x + off.x,
      top: centerPt.y + off.y,
    }
  }, [active, map, mapView, selectedItem, mapTick])

  if (!style) return null

  return (
    <div className="GpsTracking-overlay" aria-hidden>
      <div
        className="GpsTracking-arrow"
        style={{
          left: style.left,
          top: style.top,
          transform: `translate(-50%, -50%) rotate(${style.angle}deg)`,
        }}
      />
    </div>
  )
}
