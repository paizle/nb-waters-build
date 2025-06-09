import { useState, useEffect } from 'react';

function useGeolocation() {
  const [position, setPosition] = useState();

  const [isGeolocationAvailable, setIsGeolocationAvailable] = useState(
    'geolocation' in navigator
  );

  const [isTracking, setIsTracking] = useState(); // New state

  useEffect(() => {
    let watchId;

    const handleSuccess = (geoLocation) => {
      
      if (geoLocation) {

        const {latitude, longitude, accuracy, timestamp} = geoLocation.coords
        
        const test = {
          latitude,
          longitude,
          accuracy, 
          timestamp
        }

        console.log({test})

        setPosition({
          ...test,
          error: null,
        });
      }
    };

    const handleError = (error) => {
      setLocation((prevState) => ({
        ...prevState,
        error: error,
      }));
    };

    if (isGeolocationAvailable) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      };

      if (isTracking) {
        watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
      }
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isGeolocationAvailable, isTracking]);

  return { position, isGeolocationAvailable, isTracking, setIsTracking }; // Returning the setter
}

export default useGeolocation;