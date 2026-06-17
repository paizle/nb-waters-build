import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import useFeatureGeometry from '../../Hooks/useFeatureGeometry'

const SELECTED_STYLE = {
  weight: 3,
  color: '#b45309',
  fillColor: '#f59e0b',
  fillOpacity: 0.35,
}

/**
 * Draws the outline for the currently selected water (geometry loaded on
 * demand from its shard). It does NOT move the map on selection; the map only
 * re-frames the water when `focusToken` changes (i.e. when the toolbar
 * indicator is clicked).
 */
export default function SelectedWater({ item, focusToken }) {
  const map = useMap()
  const layerRef = useRef(null)
  const feature = useFeatureGeometry(item)
  const pendingFocusRef = useRef(false)

  const fitToLayer = () => {
    if (layerRef.current) {
      map.fitBounds(layerRef.current.getBounds(), { maxZoom: 14, padding: [40, 40] })
    }
  }

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
    if (!feature) return

    const layer = L.geoJSON(
      { type: 'Feature', geometry: feature.geometry, properties: {} },
      { style: SELECTED_STYLE }
    )
    layer.addTo(map)
    layerRef.current = layer

    // Honour a focus request that arrived before the geometry finished loading.
    if (pendingFocusRef.current) {
      pendingFocusRef.current = false
      fitToLayer()
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, feature])

  useEffect(() => {
    if (!focusToken) return // ignore the initial render
    if (layerRef.current) {
      fitToLayer()
    } else {
      pendingFocusRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusToken])

  return null
}
