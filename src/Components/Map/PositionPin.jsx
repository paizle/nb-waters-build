import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import icon from '../../assets/marker-icon.png'
import iconShadow from '../../assets/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12.5, 41],
  shadowSize: [41, 41],
  shadowAnchor: [12.5, 41],
})

export default function PositionPin({ position }) {
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
    L.marker(latlng, { icon: DefaultIcon }).addTo(group)
    if (position.accuracy) {
      L.circle(latlng, {
        radius: position.accuracy,
        weight: 1,
        color: '#2563eb',
        fillColor: '#3b82f6',
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
  }, [map, position])

  return null
}
