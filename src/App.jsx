import './App.scss'
import { useState, useEffect, useMemo } from 'react'
import Layout from './Components/Layout/Layout'
import Sidebar from './Components/Sidebar/Sidebar'
import LoadingSpinner from './Components/LoadingSpinner/LoadingSpinner'
import InstallButton from './Components/InstallAppButton'

import MapView from './Components/Map/MapView'

import FeatureSelect from './Components/FeatureSelect/FeatureSelect'

import { getKey, getName } from './Util/featureGetters'

export default function App() {
  const [geoJson, setGeoJson] = useState()
	const [selectedFeature, setSelectedFeature] = useState()

  useEffect(() => {
    const load = async () => {
      const data = await fetch('/waters.geojson', { cache: 'default' }).then((r) => r.json())
      const localFeatures = new Map(data.features.map(f => [getKey(f), f]));
      setGeoJson(localFeatures)
    }
    load()
    
  }, [])

  const sortFeatures = (a, b) => {
    const nameA = getName(a)
    const nameB = getName(b)
    if (nameA === '' && nameB !== '') return 1;
    if (nameA !== '' && nameB === '') return -1;
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' })
  }
  
  const sortedFeatures = useMemo(() => {
    if (geoJson) {
      const test = [...geoJson.values()].sort(sortFeatures)
      return test
    } else {
      return []
    }
  }, [geoJson]);

  const sortNames = (a, b) => {
    if (a.name === '' && b.name !== '') return 1;
    if (a.name !== '' && b.name === '') return -1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  }

  /*
  const sortedItems = useMemo(() => {
    if (geoJson) {
      const items = [...geoJson.values()].map((value) => {
        const item = {
          key: getKey(value),
          name: getName(value)
        }
        return item
      }) 
      const test = items.sort(sortNames)
      return test
    } else {
      return []
    }
  }, [geoJson]);
  */
  
	const selectItem = (item) => {
    if (geoJson && geoJson.has(item.key)) {
      const feature = geoJson.get(item.key)
      setSelectedFeature(feature)
    }
	}

	return (
		<Layout className="WatersMap">

      <MapView selectedFeature={selectedFeature} />
      <Sidebar>
        <InstallButton />
        {geoJson 
          ? <FeatureSelect
              items={sortedFeatures}
              selectItem={setSelectedFeature}
              getName={getName}
              getKey={getKey}
            />
          : <LoadingSpinner />
        }
      </Sidebar>
		</Layout>
	)
}
