import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { flipCoords } from '../../Util/coordinates'
import { getFeatureId, getFeatureName } from '../../Util/featureGetters'

export default function FeaturesContent({ feature, selectFeature, setIsTracking }) {
  const layerRef = useRef(null)

  const mapRef = React.useRef(useMap())
  const map = mapRef.current || null

  // Effect to handle feature (polygon layer)
  useEffect(() => {

    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    // Create and add the polygon layer from feature
    let layer
    if (feature && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
      setIsTracking(false)
      layer = L.polygon(flipCoords(feature.geometry.coordinates), { weight: 5, opacity: 0.8 })
      layer.addTo(map)
      layer.on('click', () => {
        selectFeature({id: getFeatureId(feature), name: getFeatureName(feature)})
      })
      map.fitBounds(layer.getBounds())
      
      layerRef.current = layer
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [feature, map])

}
