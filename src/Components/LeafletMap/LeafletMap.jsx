import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useMap, MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import * as turf from '@turf/turf'

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapComponent({feature, highlightedFeature}) {

  console.log(feature, highlightedFeature)

  const [highlightedFeatureCenter, setHighlightedFeatureCenter] = useState(null)

  return (
    <MapContainer>
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {feature && (
        <GeoJSON
          key={feature.properties.OBJECTID} // Use a unique key for each feature
          data={feature}
          style={{
            fillColor: 'blue',
            color: 'white',
            weight: 1,
          }}
        />
      )}
      <FeatureContent feature={feature} highlightedFeature={highlightedFeature} highlightedFeatureCenter={highlightedFeatureCenter} setHighlightedFeatureCenter={setHighlightedFeatureCenter} />
      {highlightedFeatureCenter && (
        <Marker position={highlightedFeatureCenter}>
          <Popup>
            test
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

const FeatureContent = React.memo(({feature, highlightedFeature, highlightedFeatureCenter, setHighlightedFeatureCenter}) => {

    const map = useMap(); // Get the Leaflet map instance

    const fitMapToFeature = useCallback(() => {
      if (feature) {
        // Create a temporary Leaflet GeoJSON layer to calculate bounds
        const geojsonLayer = new L.geoJSON(feature);

        // Get the bounds of the GeoJSON layer
        const bounds = geojsonLayer.getBounds();

        // Fit the map view to the bounds
        if (bounds.isValid()) {  // Check if bounds are valid (not empty)
          map.fitBounds(bounds);
        } else {
          console.warn("Invalid bounds: GeoJSON data may be empty or malformed.");
        }
      } else {
        // Default bounds when no feature is provided
        const defaultBounds = L.latLngBounds([49.28, -68.065], [43.28, -64.065]);  // Example default bounds
        map.fitBounds(defaultBounds);
      }
    }, [feature]);


    useEffect(() => {
        fitMapToFeature();
    }, [fitMapToFeature, feature]);

    // Function to calculate the centroid
    const calculateCentroid = useCallback(() => {
      if (highlightedFeature) {
          try {
              const centroid = turf.centroid(highlightedFeature);
              if (!highlightedFeatureCenter || (highlightedFeatureCenter[0] !== centroid.geometry.coordinates[1] && highlightedFeatureCenter[1] !== centroid.geometry.coordinates[0])) {
                setHighlightedFeatureCenter([centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]]);
              }
              
          } catch (error) {
              console.error("Error calculating centroid:", error);
              setHighlightedFeatureCenter(null); // Reset the center point
          }
      } else {
          setHighlightedFeatureCenter(null); // Reset the center point
      }
     }, [highlightedFeature]);

     useEffect(() => {
         calculateCentroid();
     }, [calculateCentroid]);
  })

export default MapComponent;