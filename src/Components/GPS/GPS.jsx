

export default function GPS({isGeolocationAvailable, useGps, setUseGps, position}) {

  const handleClick = () => {
    setUseGps(!useGps)
  }

  console.log({position})

  return isGeolocationAvailable && position
    ? (
      <button className="min-w-8 border" onClick={handleClick}>
        {useGps ? 'GPS: ' : null}{position?.latitude}, {position?.longitude}
      </button>
    )
    : null
}