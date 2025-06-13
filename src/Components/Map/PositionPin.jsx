import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import icon from '../../assets/marker-icon.png'
import iconShadow from '../../assets/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41], // Size of the marker icon
  iconAnchor: [12.5, 41], // Anchor point (tip of the marker) to align with the center
  shadowSize: [41, 41], // Size of the shadow
  shadowAnchor: [12.5, 41], // Anchor point of the shadow
})

export default function PositionPin({position}) {
  const map = useMap()

  const markerRef = useRef(null)

  useEffect(() => {
    if (position) {
      const marker = L.marker(position, { icon: DefaultIcon }).addTo(map)
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
      markerRef.current = marker
    }
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
    }
  }, [map, position])
  return null
}