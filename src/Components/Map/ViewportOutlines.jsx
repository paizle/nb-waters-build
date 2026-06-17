import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import useViewportGeometry from '../../Hooks/useViewportGeometry'

const OUTLINE_STYLE = {
  weight: 1.5,
  color: '#0891b2',
  fillColor: '#22d3ee',
  fillOpacity: 0.25,
}

/**
 * Draws actual (simplified) water outlines for the current viewport once the
 * user has zoomed in far enough. Geometry is lazily fetched and cached by the
 * data layer via `useViewportGeometry`.
 */
export default function ViewportOutlines({ mapView, selectedId, onSelect, isTouch }) {
  const map = useMap()
  const layerRef = useRef(null)
  const features = useViewportGeometry(mapView.bounds, mapView.zoom)

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
    if (!features.length) return

    const collection = {
      type: 'FeatureCollection',
      features: features
        .filter((f) => f.id !== selectedId)
        .map((f) => ({
          type: 'Feature',
          geometry: f.geometry,
          properties: { id: f.id, name: f.name },
        })),
    }

    const layer = L.geoJSON(collection, {
      style: OUTLINE_STYLE,
      onEachFeature: (feature, lyr) => {
        lyr.on('click', () => onSelect(feature.properties.id))
        if (!isTouch) lyr.bindTooltip(feature.properties.name, { sticky: true })
      },
    })
    layer.addTo(map)
    layerRef.current = layer

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, features, selectedId, onSelect, isTouch])

  return null
}
