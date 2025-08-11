import './App.scss'
import { useState, useEffect } from 'react'
import Layout from './Components/Layout/Layout'
import Sidebar from './Components/Sidebar/Sidebar'
import LoadingSpinner from './Components/LoadingSpinner/LoadingSpinner'
import InstallButton from './Components/InstallAppButton'
import MapView from './Components/Map/MapView'
import SelectWater from './Components/SelectWater/SelectWater'
import useRecords from './Hooks/useIdb'

export default function App() {

  const [selectedFeatureId, setSelectedFeatureId] = useState()

  const [selectedFeature, setSelectedFeature] = useState()

  const { sortedWaters, getFeatureById, getFeaturesWithinDistance } = useRecords();

  useEffect(() => {
    const selectFeature = async (featureId) => {
      if (featureId) {
        const feature = await getFeatureById(featureId)
        setSelectedFeature(feature)
      } else {
        setSelectedFeature(null)
      }
    }
    selectFeature(selectedFeatureId)
  }, [selectedFeatureId, getFeatureById])

	return (
		<Layout className="WatersMap">
      <MapView 
        selectedFeature={selectedFeature}
        selectFeature={(item) => setSelectedFeatureId(item.id)}
        getFeaturesWithinDistance={getFeaturesWithinDistance}
      />
      <Sidebar>
        <InstallButton />
        {sortedWaters.length 
          ? <SelectWater
              items={sortedWaters}
              selectItemId={(id) => setSelectedFeatureId(id)}
              selectedItemId={selectedFeatureId}
            />
          : <LoadingSpinner />
        }
      </Sidebar>
		</Layout>
	)
}
