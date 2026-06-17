import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import useViewportGeometry from '../../Hooks/useViewportGeometry'

const OUTLINE_STYLE = {
  weight: 2.5,
  color: '#0891b2',
  fillColor: '#22d3ee',
  fillOpacity: 0.25,
}

const HOVER_STYLE = {
  weight: 4,
  color: '#0d9488',
  fillColor: '#2dd4bf',
  fillOpacity: 0.35,
}

/**
 * Draws actual (simplified) water outlines for the current viewport once the
 * user has zoomed in far enough. Thicker strokes improve hit targets; hover
 * highlights with the selected-water teal to show clickability.
 */
export default function ViewportOutlines({ mapView, selectedId, onSelect, isTouch }) {
  const map = useMap()
  const layerRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
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
        lyr.on('click', () => onSelectRef.current(feature.properties.id))
        if (!isTouch) {
          lyr.on('mouseover', () => lyr.setStyle(HOVER_STYLE))
          lyr.on('mouseout', () => lyr.setStyle(OUTLINE_STYLE))
          lyr.bindTooltip(feature.properties.name, { sticky: true })
        }
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
  }, [map, features, selectedId, isTouch])

  return null
}
