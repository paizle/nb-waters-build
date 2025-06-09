import './App.scss'
import React, { useState, useEffect, useMemo } from 'react'
import Layout from './Components/Layout/Layout'
import FeaturesMap from './Components/FeaturesMap/FeaturesMap'
import Sidebar from './Components/Sidebar/Sidebar'
import LoadingSpinner from './Components/LoadingSpinner/LoadingSpinner'

import InstallButton from './Components/InstallAppButton'
import useGeolocation from './Hooks/useGeolocation'
import GPS from './Components/GPS/GPS'

export default function WatersMap() {
  const [geoJson, setGeoJson] = useState()
	const [selectedFeature, setSelectedFeature] = useState()
	const [hoveredFeature, setHovereadFeature] = useState()

  const geoLocation = useGeolocation({})

  const getName = (properties) => properties?.NAME1 || properties?.NAME2 || properties?.LOCALNAME || ''

  const getId = (properties) => {
    const fields = ['OBJECTID', 'NID', 'LOCALNAME', 'WATERDEFINITION', 'WATERID', 'DATASETNAME', 'WATERSHEDCODE']
    return fields.reduce((a, v) => {
      a[v] = properties?.[v]
      return a
    }, {})
  } 

  const getFeatureKey = (feature) => feature.properties.OBJECTID;

  useEffect(() => {
    const load = async () => {
      const data = await fetch('/waters.geojson', { cache: 'default' }).then((r) => r.json());
      const localFeatures = new Map(data.features.map(f => [getFeatureKey(f), f]));
      setGeoJson(localFeatures)
    }
    //load()
    
  }, [])

  async function getDetailedFeature(feature) {

    const data = await fetch('/waters-complete.geojson', { cache: 'default' }).then((r) => r.json());
    const localFeatures = new Map(data.features.map(f => [getFeatureKey(f), f]));
    setGeoJson(localFeatures)

    return localFeatures.get(getFeatureKey(feature))
  }

	const selectFeature = (id) => {
    if (geoJson && geoJson.has(id)) {
      const feature = geoJson.get(id)
      setSelectedFeature(feature)
      /*
      if (!feature.properties?.detail) {
        getDetailedFeature(feature)
          .then((detailedFeature) => {
            setSelectedFeature(detailedFeature)
          })
      }
          */
    }
	}

	const hoverFeature = (id) => {
		if (geoJson && geoJson.has(id)) {
      const feature = geoJson.get(id)
      setHovereadFeature(feature)
      /*
      if (!feature.properties?.detail) {
        getDetailedFeature(feature)
          .then((detailedFeature) => {
            setHovereadFeature(detailedFeature)
          })
      }
          */
    }
	}

  const sortFeatures = (a, b) => {
    const nameA = getName(a.properties)
    const nameB = getName(b.properties)
    if (nameA === '' && nameB !== '') return 1;
    if (nameA !== '' && nameB === '') return -1;
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' })
  }

  const sortedFeatures = useMemo(() => {
    if (geoJson) {
      const test = [...geoJson.values()].sort(sortFeatures)
      console.log({test})
      return test
    } else {
      return []
    }
  }, [geoJson]);

	return (
		<Layout className="WatersMap sm:flex-col">
				<FeaturesMap geoJson={selectedFeature} highlightedGeoJson={hoveredFeature} />
        <Sidebar>
          <InstallButton />
          <GPS
            isGeolocationAvailable={geoLocation.isGeolocationAvailable}
            useGps={geoLocation.isTracking}
            setUseGps={geoLocation.setIsTracking}
            position={geoLocation.position}
          />
          {geoJson ? (
            <ul onMouseLeave={() => setHovereadFeature(null)}>
              {sortedFeatures.map((feature) => (
                <li key={feature.properties.OBJECTID}>
                  <button
                    onClick={() => selectFeature(getFeatureKey(feature))}
                    onMouseEnter={() =>
                      hoverFeature(getFeatureKey(feature))
                    }
                    onMouseDown={() =>
                      hoverFeature(getFeatureKey(feature))
                    }
                  >
                    {getName(feature.properties) || (
                      <div className="text-xs">{
                        Object
                          .entries(getId(feature.properties))
                          .map(([key, value]) => (<div key={key}>{key}: {value}</div>))
                        }
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <LoadingSpinner />
          )}
				</Sidebar>
		</Layout>
	)
}
