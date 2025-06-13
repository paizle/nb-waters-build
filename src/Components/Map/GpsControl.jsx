import { useEffect, useRef } from "react"
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import ReactDOM from 'react-dom/client';

export default function GpsControl({ isTracking, setIsTracking, position }) {
  
  const map = useMap();
  const controlRef = useRef(null);
  const rootRef = useRef(null);

  const containerRef = useRef(null)

  const handleClick = () => {
    setIsTracking(!isTracking)
  }

  useEffect(() => {
    if (!map) return;

    const CustomControl = L.Control.extend({
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        containerRef.current = container
        L.DomEvent.disableClickPropagation(container);
        return container;
      },

      onRemove: function () {
        if (rootRef.current) {
          queueMicrotask(() => {
            rootRef?.current?.unmount();
            rootRef.current = null;
          });
        }
      }
    });

    const control = new CustomControl({ position: 'topright' });
    controlRef.current = control;
    map.addControl(control);

    return () => {
      map.removeControl(control);
    };
  }, [map]);

  useEffect(() => {
    if (containerRef.current) {
      // Safe: create root and render only when container exists
      if (!rootRef.current) {
        rootRef.current = ReactDOM.createRoot(containerRef.current);
      }
      rootRef.current.render(
        !!position && (
          <div className="leaflet-control-container ">
            <button 
              className={`leaflet-control-button GeoLocationStatus ${isTracking ? 'on' : ''}`}
              onClick={handleClick}
            >
              <div className="pin">📍</div>
              <strong>{position.lat}, {position.lng}</strong>
            </button>
          </div>
        )
      );
    }
  }, [containerRef.current, position, isTracking])

  return null;
}
