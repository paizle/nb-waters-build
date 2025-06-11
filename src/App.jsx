import './App.scss'
import { useState, useEffect, useMemo } from 'react'
import Layout from './Components/Layout/Layout'
import Sidebar from './Components/Sidebar/Sidebar'
import LoadingSpinner from './Components/LoadingSpinner/LoadingSpinner'
import InstallButton from './Components/InstallAppButton'
import MapView from './Components/Map/MapView'
import FeatureSelect from './Components/FeatureSelect/FeatureSelect'
import { getKey, getName } from './Util/featureGetters'

import useRecords from './Hooks/useIdb'

export default function App() {
  const [selectedFeature, setSelectedFeature] = useState()

  const { sortedWaters, getFeatureById, getFeaturesWithinDistance } = useRecords();

  console.log(sortedWaters)

	const selectFeature = async (item) => {
    const feature = await getFeatureById(item.id)
    setSelectedFeature(feature)
	}

	return (
		<Layout className="WatersMap">

      <MapView 
        selectedFeature={selectedFeature}
        getFeaturesWithinDistance={getFeaturesWithinDistance}
      />
      <Sidebar>
        <InstallButton />
        {sortedWaters.length 
          ? <FeatureSelect
              items={sortedWaters}
              selectItem={selectFeature}
              getName={getName}
              getKey={getKey}
            />
          : <LoadingSpinner />
        }
      </Sidebar>
		</Layout>
	)
}
