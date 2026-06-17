import { useCallback, useEffect, useState } from 'react';

/**
 * Geolocation that does NOT request permission on mount. Permission is only
 * requested after `enable()` is called (i.e. when the user taps the GPS
 * button). Once enabled, the position is watched continuously.
 */
export default function useGeolocation() {
  const isAvailable = 'geolocation' in navigator;

  const [isEnabled, setIsEnabled] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEnabled || !isAvailable) return;

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    };

    const onSuccess = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setPosition({ lat: latitude, lng: longitude, accuracy, timestamp: pos.timestamp });
      setError(null);
    };

    const onError = (err) => setError(err);

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isEnabled, isAvailable]);

  const enable = useCallback(() => setIsEnabled(true), []);

  return {
    isAvailable,
    isEnabled,
    enable,
    isTracking,
    setIsTracking,
    position,
    error,
  };
}
