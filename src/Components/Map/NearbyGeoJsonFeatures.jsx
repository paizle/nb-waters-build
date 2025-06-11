import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

export default function NearbyGeoJsonFeatures({ position, getFeaturesWithinDistance }) {
  const layerRef = useRef(null)

  const mapRef = React.useRef(useMap())
  const map = mapRef.current || null

  // Effect to handle geoJson (polygon layer)
  useEffect(() => {

    const go = async () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }

      if (position) {
        const center = {
          lat: parseFloat(position[0]),
          lng: parseFloat(position[1])
        };
        const features = await getFeaturesWithinDistance(center, 5000)
        console.log("Position", position)
        console.log(features)

        // Create and add the polygon layer from geoJson
        let layer
        if (features.length) {
          features.forEach((feature) => {
            console.log(feature)
            layer = L.polygon(flipCoords(feature.geometry.coordinates), { weight: 6, opacity: 0.5 })
            layer.addTo(map)
          })
          layerRef.current = layer
        }
      }
    }
    go()

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [position])

}

function flipCoords(coords) {
  return coords.map((point) => {
    if (Array.isArray(point[0])) {
      return flipCoords(point)
    }
    return [point[1], point[0]]
  })
}
