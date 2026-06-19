import './App.scss'
import { useMemo, useState } from 'react'
import MapView from './Components/Map/MapView'
import Footer from './Components/Footer/Footer'
import SelectWater from './Components/SelectWater/SelectWater'
import LoadingSpinner from './Components/LoadingSpinner/LoadingSpinner'
import InstallButton from './Components/InstallAppButton'
import useWaterIndex from './Hooks/useWaterIndex'

export default function App() {
  const { items, isLoading } = useWaterIndex()
  const [selectedId, setSelectedId] = useState(null)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  )

  return (
    <div className="App">
      <MapView items={items} selectedItem={selectedItem} onSelect={setSelectedId} />

      <Footer>
        {isLoading ? (
          <div className="App-loading">
            <LoadingSpinner />
            <span>Loading waters…</span>
          </div>
        ) : (
          <SelectWater items={items} selectedId={selectedId} onSelect={setSelectedId} />
        )}
        <div className="App-install">
          <InstallButton />
        </div>
      </Footer>

      
    </div>
  )
}
