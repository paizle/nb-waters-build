import { useState, useEffect, useRef } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

export default function GeoJsonFeatureArrow({ geoJson, position }) {

  const markerRef = useRef(null)

  const map = useMap()

  function isPointInView(latlng) {
    return map.getBounds().pad(-.4).contains(latlng)
  }

  function getAngleToPoint(latlng) {
    const centerPoint = map.latLngToContainerPoint(position)
    const targetPoint = map.latLngToContainerPoint(latlng)

    const dx = targetPoint.x - centerPoint.x
    const dy = targetPoint.y - centerPoint.y

    return Math.atan2(dy, dx) // in radians
  }

  // Effect to handle marker positioning based on geoJson
  useEffect(() => {
    const removeArrow = () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
    }
    const updateArrow = () => {
      removeArrow()
      // If no geoJson is provided, do not add arrow
      if (geoJson) {
        
        // Create a temporary Leaflet layer from geoJsona to get its bounds
        const tempLayer = L.geoJSON(geoJson)
        const featureCenter = tempLayer.getBounds().getCenter()

        if (!isPointInView(featureCenter)) {

          const angle = getAngleToPoint(featureCenter)
          const centerMap = map.getSize().divideBy(2) // center in screen pixels

          const RADIUS = 100 // distance from center in pixels
          const x = centerMap.x + RADIUS * Math.cos(angle)
          const y = centerMap.y + RADIUS * Math.sin(angle)

          const edgeLatLng = map.containerPointToLatLng([x, y])

          // You can customize the icon to be an arrow or triangle pointing in the correct direction
          const icon = L.divIcon({
            className: 'direction-arrow',
            html: '➤',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })

          const marker = L.marker(edgeLatLng, { icon }).addTo(map)

          // Optional: Rotate the marker to point in the right direction
          marker._icon.style.transform += `rotate(${angle}rad)`
          markerRef.current = marker
        }
      }
    }

    map.on('moveend', updateArrow);
    map.on('zoomend', updateArrow);
    map.on('zoomstart', removeArrow)

    updateArrow()

    return () => {
      map.off('moveend', updateArrow);
      map.off('zoomend', updateArrow);
      map.on('zoomstart', removeArrow)
      
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
    }
  }, [geoJson, map, position])

}


  