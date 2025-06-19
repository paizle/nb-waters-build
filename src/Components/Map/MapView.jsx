import './Map.scss'
import { MapContainer as LeafletMapContainer, useMap, TileLayer } from 'react-leaflet'
import { useState, useEffect, createContext, useContext } from 'react'
import useGeolocation from '../../Hooks/useGeolocation'
import PositionPin from './PositionPin'
import GeoJsonFeature from './GeoJsonFeature'
import GpsControl from './GpsControl'
import GeoJsonFeatureArrow from './GeoJsonFeatureArrow'
import NearbyGeoJsonFeatures from './NearbyGeoJsonFeatures'
import { haversineDistance } from '../../Util/coordinates'

export const MapContext = createContext();

export default function MapView({selectedFeature, getFeaturesWithinDistance, selectFeature}) {

  const geoLocation = useGeolocation()

  const [position, setPosition] = useState(null)
  const [center, setCenter] = useState(null)

  useEffect(() => {
    if (!geoLocation.position) return
    const fromGeoLocation = (geoLocation) => ({lat: geoLocation.position.latitude, lng: geoLocation.position.longitude})
    
    if (!position) {
      setPosition(fromGeoLocation(geoLocation))
    } else {
      const currentPosition = fromGeoLocation(geoLocation)
      const distance = haversineDistance(position, currentPosition)
      if (distance > 15) {
        setPosition(currentPosition)
      }
    }
  }, [geoLocation.position])

  const value = {
    selectedFeature,
    selectFeature,
    geoLocation,
    position,
    getFeaturesWithinDistance,
    center,
    setCenter
  }

  return (
    <MapContext.Provider value={value}>
      <MapContainer>
        
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />

        <ControlMap 
          geoLocation={geoLocation}
          position={position}
          selectedFeature={selectedFeature}
          setCenter={setCenter}
        />

        <GpsControl 
          isTracking={geoLocation.isTracking}
          setIsTracking={geoLocation.setIsTracking}
          position={position}
        />
        
        <PositionPin isTracking={geoLocation?.isTracking} position={position} />

        <NearbyGeoJsonFeatures 
          position={center}
          selectFeature={selectFeature}
        />

				<GeoJsonFeature 
          feature={selectedFeature}
          selectFeature={selectFeature}
          setIsTracking={geoLocation.setIsTracking}
        />

        <GeoJsonFeatureArrow geoJson={selectedFeature} position={center} />
        
      </MapContainer>
    </MapContext.Provider>
  );
}

export const useMapContext = () => useContext(MapContext);

function ControlMap({geoLocation, selectedFeature, position, setCenter}) {

  const [trackingZoom, setTrackingZoom] = useState()

  const map = useMap()

  const turnOffTracking = () => {
    geoLocation.setIsTracking(false)
  }

  useEffect(() => {
    map.on('dragstart', turnOffTracking);
    return () => {
      map.off('dragstart', turnOffTracking)
    }
  }, [])

  useEffect(() => {

    setTrackingZoom(map.getMaxZoom())

    const handleMoveEnd = () => setCenter(map.getCenter())
    if (map) {
      map.on('moveend', handleMoveEnd)
      handleMoveEnd()
    }
    
    return () => {
      if (map) {
        map.off('moveend', handleMoveEnd)
      } 
    }
  }, [map])

  useEffect(() => {
    
    // if tracking is turned on then pan to the current position
    if (map && geoLocation.isTracking && position) {
      map.setView(position, trackingZoom, {
        animate: true
      })
    }

    const handleZoom = () => {
      if (geoLocation.isTracking) {
        setTrackingZoom(map.getZoom())
      }
    }

    if (map) {
      map.on('zoom', handleZoom)
    }

    return () => {
      if (map) {
        map.off('zoom', handleZoom)
      } 
    }
  }, [map, geoLocation.isTracking, position, trackingZoom])

  useEffect(() => {
    // turn tracking off if a new feature is selected
    if (map && selectedFeature) {
      geoLocation.setIsTracking(false)
    }
  }, [map, selectedFeature])

  useEffect(() => {
    // zoom to GPS point if tracking is on otherwise use default zoom (mouse position) 
    
    const wheelHandler = (e) => {
      // if tracking then override zoom behavior to use GPS point
      if (map && geoLocation.isTracking) {
        e.preventDefault();

        const zoom = map.getZoom();
        const delta = e.deltaY > 0 ? -1 : 1; // scroll up = zoom in
        const newZoom = zoom + delta;

        map.setView([geoLocation.position.latitude, geoLocation.position.longitude], newZoom, {
          animate: true
        });
      }
    } 

    if (map) {
      if (!geoLocation.isTracking) {
        map.scrollWheelZoom.enable()
      } else {
        map.scrollWheelZoom.disable();  
      }
    }
    map.getContainer().addEventListener('wheel', wheelHandler);

    return () => {
      map?.getContainer()?.removeEventListener('wheel', wheelHandler);
    }
  }, [map, geoLocation.isTracking])
}

function MapContainer({children}) {
  const mapConfig = {
    bounds: [
      [48.2, -69.4],
      [44.7, -63.5],
    ],
    minZoom: 6,
    maxZoom: 16,
  }

  return (  
    <LeafletMapContainer
      maxBounds={mapConfig.bounds}
      center={[46.45, -66.45]}
      zoom={5}
      minZoom={mapConfig.minZoom}
      maxZoom={mapConfig.maxZoom}
      style={{ height: '100vh', width: '100%' }}
    >
      {children}
    </LeafletMapContainer>
  )
}