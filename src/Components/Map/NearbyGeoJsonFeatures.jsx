import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { flipCoords } from '../../Util/coordinates'
import { getFeatureId, getFeatureName } from '../../Util/featureGetters'

import useRecords from '../../Hooks/useIdb'
import useDeviceProperties from '../../Hooks/useDeviceProperties'

export default function NearbyGeoJsonFeatures({ position, selectFeature }) {

  const { getFeaturesWithinDistance } = useRecords()

  const map = useMap()

  const layersRef = useRef(new Map())

  const deviceProperties = useDeviceProperties()

  useEffect(() => {

    (async () => {
      let incomingIds = []

      if (position && map.getZoom() > 11) {
        const center = {
          lat: parseFloat(position.lat),
          lng: parseFloat(position.lng)
        };
        const features = await getFeaturesWithinDistance(center, 10000)

        // Create and add the polygon layer from geoJson
        if (features.length) {
          features.forEach((feature) => {
            const featureId = getFeatureId(feature)
            incomingIds.push(featureId)
            if (!layersRef.current.has(featureId)) {
              const layer = L.polygon(
                flipCoords(feature.geometry.coordinates),
                { weight: 2, color: 'rgba(0, 200, 200, 1)',  fillColor: 'rgba(0, 200, 150, 0.4)' }
              )
              layer.on('click', () => {
                selectFeature({id: getFeatureId(feature), name: getFeatureName(feature)})
              })
              if (!deviceProperties.isTouch) {
                layer.on('mouseover', (e) => {
                  const tooltipContent = `<strong>${getFeatureName(feature)}</strong><br>`;

                  layer.bindTooltip(tooltipContent, {
                    permanent: false,
                    sticky: true,    // follows the cursor
                    direction: 'top',
                    opacity: 0.9
                  }).openTooltip(e.latlng);
                })
              }

              layer.on('mouseout', () => {
                layer.closeTooltip();
              });
              layer.addTo(map)
              layersRef.current.set(featureId, layer)
            }
          })
        }
      }
      for (const id of layersRef.current.keys()) {
          if (!incomingIds.includes(id)) {
            const layer = layersRef.current.get(id)
            map.removeLayer(layer)
            layersRef.current.delete(id)
          }
        }
    })()

  }, [position])
}
