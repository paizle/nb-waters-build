import { useCallback, useEffect, useRef, useState } from 'react'

const FAST_OPTIONS = {
  enableHighAccuracy: false,
  maximumAge: 600000,
  timeout: 8000,
}

const ACCURATE_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 15000,
  timeout: 20000,
}

function coordsFromPosition(pos) {
  const { latitude, longitude, accuracy } = pos.coords
  return { lat: latitude, lng: longitude, accuracy, timestamp: pos.timestamp }
}

/**
 * Geolocation that does NOT request permission on mount. Permission is only
 * requested after `enable()` or `requestFix()` (GPS button clicks). Uses a
 * fast cached/low-accuracy fix first, then refines with watchPosition.
 */
export default function useGeolocation() {
  const isAvailable = 'geolocation' in navigator

  const [isEnabled, setIsEnabled] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(null)
  const watchIdRef = useRef(null)

  const onSuccess = useCallback((pos) => {
    setPosition(coordsFromPosition(pos))
    setError(null)
  }, [])

  const onError = useCallback((err) => setError(err), [])

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  const startWatch = useCallback(() => {
    stopWatch()
    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      ACCURATE_OPTIONS
    )
  }, [onSuccess, onError, stopWatch])

  useEffect(() => {
    if (!isEnabled || !isAvailable) return

    navigator.geolocation.getCurrentPosition(onSuccess, () => {}, FAST_OPTIONS)
    startWatch()

    return stopWatch
  }, [isEnabled, isAvailable, onSuccess, startWatch, stopWatch])

  const enable = useCallback(() => setIsEnabled(true), [])

  /** Request permission if needed and actively poll for a fix (fast, then accurate). */
  const requestFix = useCallback(() => {
    if (!isAvailable) return
    setIsEnabled(true)
    navigator.geolocation.getCurrentPosition(onSuccess, () => {}, FAST_OPTIONS)
    navigator.geolocation.getCurrentPosition(onSuccess, onError, ACCURATE_OPTIONS)
    if (watchIdRef.current == null) startWatch()
  }, [isAvailable, onSuccess, onError, startWatch])

  return {
    isAvailable,
    isEnabled,
    enable,
    requestFix,
    isTracking,
    setIsTracking,
    position,
    error,
  }
}
