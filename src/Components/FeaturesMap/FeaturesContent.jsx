import './FeaturesMap.scss'
import React, { useEffect, useRef } from 'react'
import { useMap, MapContainer, TileLayer, Marker, Rectangle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultBounds = [
	[48.2, -69.4],
	[44.7, -63.5],
]

const maxBounds = [
	[48.2, -69.4],
	[44.7, -63.5],
]

export default function FeaturesContent({ geoJson, highlightedGeoJson }) {
	const layerRef = useRef(null)
	const markerRef = useRef(null)

	const mapRef = React.useRef(useMap())
	const map = mapRef.current || null

	const handleMapCreated = (map) => {
		mapRef.current = map

		// Explicitly apply constraints here
		map.setMinZoom(mapConfig.minZoom)
		map.setMaxZoom(mapConfig.maxZoom)
		map.setMaxBounds(mapConfig.maxBounds)
		map.options.maxBoundsViscosity = mapConfig.maxBoundsViscosity
	}

	useEffect(() => {
		const handleZoom = () => {
			console.log('Current zoom level:', map.getZoom())
		}

		map.on('zoomend', handleZoom)

		// Log initial zoom
		handleZoom()

		return () => {
			map.off('zoomend', handleZoom)
		}
	}, [map])

	// Effect to handle geoJson (polygon layer)
	useEffect(() => {
		if (!geoJson) {
			//const defaultBounds = L.latLngBounds([49.28, -68.065], [43.28, -64.065])
			map.fitBounds(defaultBounds)
			return
		}

		// Remove existing layer if present
		if (layerRef.current) {
			map.removeLayer(layerRef.current)
		}

		// Create and add the polygon layer from geoJson
		let layer
		if (geoJson.geometry.type === 'Polygon' || geoJson.geometry.type === 'MultiPolygon') {
			layer = L.polygon(flipCoords(geoJson.geometry.coordinates), { weight: 6, opacity: 0.5 })
			layer.addTo(map)
			map.fitBounds(layer.getBounds())
			layerRef.current = layer
		}

		return () => {
			if (layerRef.current) {
				map.removeLayer(layerRef.current)
				layerRef.current = null
			}
		}
	}, [geoJson, map])

	function isPointInView(latlng) {
		return map.getBounds().contains(latlng)
	}

	function getAngleToPoint(latlng) {
		const center = map.getCenter()
		const centerPoint = map.latLngToContainerPoint(center)
		const targetPoint = map.latLngToContainerPoint(latlng)

		const dx = targetPoint.x - centerPoint.x
		const dy = targetPoint.y - centerPoint.y

		return Math.atan2(dy, dx) // in radians
	}

	// Effect to handle marker positioning based on highlightedGeoJson
	useEffect(() => {
		if (markerRef.current) {
			map.removeLayer(markerRef.current)
			markerRef.current = null
		}

		// If no highlightedGeoJson is provided, do not add a marker
		if (!highlightedGeoJson) return

		// Create a temporary Leaflet layer from highlightedGeoJson to get its bounds
		const tempLayer = L.geoJSON(highlightedGeoJson)
		const featureCenter = tempLayer.getBounds().getCenter()

		if (isPointInView(featureCenter)) {
			// Add the marker at the center of highlightedGeoJson
			const marker = L.marker(featureCenter).addTo(map)
			markerRef.current = marker
		} else {
			const angle = getAngleToPoint(featureCenter)
			const centerMap = map.getSize().divideBy(2) // center in screen pixels

			const RADIUS = 100 // distance from center in pixels
			const x = centerMap.x + RADIUS * Math.cos(angle)
			const y = centerMap.y + RADIUS * Math.sin(angle)

			const edgeLatLng = map.containerPointToLatLng([x, y])

			// You can customize the icon to be an arrow or triangle pointing in the correct direction
			const icon = L.divIcon({
				className: 'direction-arrow',
				html: '➤',
				iconSize: [20, 20],
				iconAnchor: [10, 10],
			})

			const marker = L.marker(edgeLatLng, { icon }).addTo(map)

			// Optional: Rotate the marker to point in the right direction
			marker._icon.style.transform += ` rotate(${angle}rad)`
			markerRef.current = marker
		}

		return () => {
			if (markerRef.current) {
				map.removeLayer(markerRef.current)
				markerRef.current = null
			}
		}
	}, [highlightedGeoJson, map])

	return (
		<>
			<TileLayer
				attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
			/>
		</>
	)
}

function flipCoords(coords) {
	return coords.map((point) => {
		if (Array.isArray(point[0])) {
			return flipCoords(point)
		}
		return [point[1], point[0]]
	})
}
