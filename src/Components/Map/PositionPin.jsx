import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

const RedPinIcon = L.divIcon({
  className: 'position-pin-icon',
  html: '<span class="position-pin-marker"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

export default function PositionPin({ position, isTracking }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
    if (!position) return

    const latlng = [position.lat, position.lng]
    const group = L.layerGroup()
    L.marker(latlng, { icon: RedPinIcon }).addTo(group)
    if (isTracking && position.accuracy) {
      L.circle(latlng, {
        radius: position.accuracy,
        weight: 1,
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.12,
      }).addTo(group)
    }
    group.addTo(map)
    layerRef.current = group

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, position, isTracking])

  return null
}
