import './FeaturesMap.scss'
import React, { useEffect, useRef } from 'react'
import { useMap, MapContainer, TileLayer, Marker, Rectangle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

import FeaturesContent from './FeaturesContent'

// Configure the default marker icon with proper centering
const DefaultIcon = L.icon({
	iconUrl: icon,
	shadowUrl: iconShadow,
	iconSize: [25, 41], // Size of the marker icon
	iconAnchor: [12.5, 41], // Anchor point (tip of the marker) to align with the center
	shadowSize: [41, 41], // Size of the shadow
	shadowAnchor: [12.5, 41], // Anchor point of the shadow
})

L.Marker.prototype.options.icon = DefaultIcon

const mapConfig = {
	bounds: [
		[48.2, -69.4],
		[44.7, -63.5],
	],
	minZoom: 6,
	maxZoom: 16,
}

export default function FeaturesMap({ geoJson, highlightedGeoJson }) {
	const handleMapCreated = (map) => {
		//mapRef.current = map;

		console.log('test')
		console.log('test 2')

		// Explicitly apply constraints here
		map.setMinZoom(mapConfig.minZoom)
		map.setMaxZoom(mapConfig.maxZoom)
		//map.setMaxBounds(mapConfig.maxBounds);
		//map.options.maxBoundsViscosity = mapConfig.maxBoundsViscosity;
	}

	return (
		<MapContainer
			whenCreated={handleMapCreated}
			maxBounds={mapConfig.bounds}
			center={[46.45, -66.45]}
			zoom={5}
      minZoom={mapConfig.minZoom}
      maxZoom={mapConfig.maxZoom}
			style={{ height: '100vh', width: '100%' }}
		>
			<FeaturesContent geoJson={geoJson} highlightedGeoJson={highlightedGeoJson} />
			<Rectangle bounds={mapConfig.bounds} pathOptions={{ color: 'red' }} />
		</MapContainer>
	)
}
