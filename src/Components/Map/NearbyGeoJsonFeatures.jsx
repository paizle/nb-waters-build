import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { flipCoords } from '../../Util/coordinates'
import { getKey, getName } from '../../Util/featureGetters'

export default function NearbyGeoJsonFeatures({ position, getFeaturesWithinDistance, selectFeature }) {
  const layersRef = useRef(null)

  const mapRef = React.useRef(useMap())
  const map = mapRef.current || null

  // Effect to handle geoJson (polygon layer)
  useEffect(() => {

    const removeOldLayers = () => {
      if (layersRef.current) {
        layersRef.current.forEach((layer) => {
          map.removeLayer(layer)
        })
      }
    }

    const go = async () => {
      removeOldLayers()

      if (position && map.getZoom() > 13) {
        const center = {
          lat: parseFloat(position[0]),
          lng: parseFloat(position[1])
        };
        const features = await getFeaturesWithinDistance(center, 5000)

        // Create and add the polygon layer from geoJson
        let layer
        let layers = []
        if (features.length) {
          features.forEach((feature) => {
            layer = L.polygon(flipCoords(feature.geometry.coordinates), { weight: 2, color: 'purple', fillColor: 'rgba(128, 0, 128, 0.3)' })
            layer.on('click', () => {
              selectFeature({id: getKey(feature), name: getName(feature)})
            })
            layer.addTo(map)
            layers.push(layer)
          })
          layersRef.current = layers
        }
      }
    }
    go()

    return () => {
      removeOldLayers()
    }
  }, [position])
}
