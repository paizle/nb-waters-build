import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import useFeatureGeometry from '../../Hooks/useFeatureGeometry'

const SELECTED_STYLE = {
  weight: 3,
  color: '#0d9488',
  fillColor: '#2dd4bf',
  fillOpacity: 0.4,
}

/**
 * Draws the outline for the currently selected water and pans the map to fit it
 * whenever the selection changes (combobox, map click, or nearest-waters pick).
 * `focusToken` allows re-framing from the toolbar indicator button.
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

    if (pendingFocusRef.current || item) {
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

  // Re-frame when selection changes before geometry has loaded.
  useEffect(() => {
    if (!item) return
    if (layerRef.current) {
      fitToLayer()
    } else {
      pendingFocusRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id])

  useEffect(() => {
    if (!focusToken) return
    if (layerRef.current) {
      fitToLayer()
    } else {
      pendingFocusRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusToken])

  return null
}
