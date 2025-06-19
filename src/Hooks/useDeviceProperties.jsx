import { useState, useEffect } from 'react'

export default function useDeviceProperties() {

  const [deviceProperties, setDeviceProperties] = useState()

  const isUsingTouch = () => {
    return window.matchMedia('(pointer: coarse)').matches;
  };

  useEffect(() => {
    const properties = {
      isTouch: isUsingTouch()
    }
    setDeviceProperties(properties)
  }, [])

  return deviceProperties
}