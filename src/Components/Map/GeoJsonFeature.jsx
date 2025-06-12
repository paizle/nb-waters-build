import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { flipCoords } from '../../Util/coordinates'

export default function FeaturesContent({ geoJson, setIsTracking }) {
  const layerRef = useRef(null)

  const mapRef = React.useRef(useMap())
  const map = mapRef.current || null

  // Effect to handle geoJson (polygon layer)
  useEffect(() => {

    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    // Create and add the polygon layer from geoJson
    let layer
    if (geoJson && (geoJson.geometry.type === 'Polygon' || geoJson.geometry.type === 'MultiPolygon')) {
      setIsTracking(false)
      layer = L.polygon(flipCoords(geoJson.geometry.coordinates), { weight: 6, opacity: 0.5 })
      layer.addTo(map)
      map.fitBounds(layer.getBounds())
      
      layerRef.current = layer
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [geoJson, map])

}
