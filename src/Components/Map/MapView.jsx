import 'leaflet/dist/leaflet.css'
import './Map.scss'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import useGeolocation from '../../Hooks/useGeolocation'
import useDeviceProperties from '../../Hooks/useDeviceProperties'
import WaterMarkers from './WaterMarkers'
import ViewportOutlines from './ViewportOutlines'
import SelectedWater from './SelectedWater'
import PositionPin from './PositionPin'
import MapToolbar from './MapToolbar'
import { NearestWatersPanel, NearestWatersOverlay } from './NearestWaters'

const MAP_CONFIG = {
  bounds: [
    [48.2, -69.4],
    [44.7, -63.5],
  ],
  center: [46.45, -66.45],
  zoom: 7,
  minZoom: 6,
  maxZoom: 16,
}

/** Reports the current bounds + zoom whenever the map settles. */
function MapViewState({ onChange }) {
  const map = useMapEvents({
    moveend: () => onChange({ bounds: map.getBounds(), zoom: map.getZoom() }),
    zoomend: () => onChange({ bounds: map.getBounds(), zoom: map.getZoom() }),
  })

  useEffect(() => {
    onChange({ bounds: map.getBounds(), zoom: map.getZoom() })
  }, [map, onChange])

  return null
}

/** Publishes the Leaflet map instance to the parent once the container is ready. */
function MapBridge({ onMap }) {
  const map = useMap()

  useEffect(() => {
    onMap(map)
    return () => onMap(null)
  }, [map, onMap])

  return null
}

export default function MapView({ items, selectedItem, onSelect }) {
  const [map, setMap] = useState(null)
  const [mapView, setMapView] = useState({ bounds: null, zoom: null })
  const [focusToken, setFocusToken] = useState(0)
  const [nearestActive, setNearestActive] = useState(false)

  const geolocation = useGeolocation()
  const deviceProperties = useDeviceProperties()
  const isTouch = deviceProperties?.isTouch ?? false

  return (
    <div className="MapView">
      <MapContainer
        preferCanvas
        maxBounds={MAP_CONFIG.bounds}
        center={MAP_CONFIG.center}
        zoom={MAP_CONFIG.zoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />

        <MapBridge onMap={setMap} />
        <MapViewState onChange={setMapView} />

        <WaterMarkers
          items={items}
          mapView={mapView}
          selectedId={selectedItem?.id ?? null}
          onSelect={onSelect}
          isTouch={isTouch}
        />

        <ViewportOutlines
          mapView={mapView}
          selectedId={selectedItem?.id ?? null}
          onSelect={onSelect}
          isTouch={isTouch}
        />

        <SelectedWater item={selectedItem} focusToken={focusToken} />

        <PositionPin position={geolocation.isEnabled ? geolocation.position : null} />
      </MapContainer>

      <NearestWatersOverlay
        map={map}
        mapView={mapView}
        items={items}
        active={nearestActive}
        onSelect={onSelect}
      />

      <div className="MapControls-right">
        <NearestWatersPanel
          mapView={mapView}
          items={items}
          selectedId={selectedItem?.id ?? null}
          onSelect={onSelect}
          isTouch={isTouch}
          active={nearestActive}
          onActiveChange={setNearestActive}
        />

        <MapToolbar
          map={map}
          geolocation={geolocation}
          selectedItem={selectedItem}
          mapView={mapView}
          isTouch={isTouch}
          onFocusSelected={() => setFocusToken((token) => token + 1)}
          onClearSelected={() => onSelect(null)}
        />
      </div>
    </div>
  )
}
