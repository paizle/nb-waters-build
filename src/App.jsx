import './App.scss'
import { useState, useEffect, useMemo } from 'react'
import Layout from './Components/Layout/Layout'
import Sidebar from './Components/Sidebar/Sidebar'
import LoadingSpinner from './Components/LoadingSpinner/LoadingSpinner'
import InstallButton from './Components/InstallAppButton'
import MapView from './Components/Map/MapView'
import SelectWater from './Components/SelectWater/SelectWater'
import { getFeatureId, getFeatureName } from './Util/featureGetters'

import useRecords from './Hooks/useIdb'

export default function App() {
  const [selectedFeature, setSelectedFeature] = useState()

  const [selectedFeatureId, setSelectedFeatureId] = useState()

  const { sortedWaters, getFeatureById, getFeaturesWithinDistance } = useRecords();


	const selectFeature = async (item) => {
    if (item) {
      setSelectedFeatureId(item.id)
      const feature = await getFeatureById(item.id)
      setSelectedFeature(feature)
    } else {
      setSelectedFeatureId(null)
      setSelectedFeature(null)
    }
	}

	return (
		<Layout className="WatersMap">

      <MapView 
        selectedFeature={selectedFeature}
        selectFeature={selectFeature}
        getFeaturesWithinDistance={getFeaturesWithinDistance}
      />
      <Sidebar>
        <InstallButton />
        {sortedWaters.length 
          ? <SelectWater
              items={sortedWaters}
              selectItem={selectFeature}
              selectedItemId={selectedFeatureId}
            />
          : <LoadingSpinner />
        }
      </Sidebar>
		</Layout>
	)
}
