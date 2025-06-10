

export default function GPS({isGeolocationAvailable, useGps, setUseGps, position}) {

  const handleClick = () => {
    setUseGps(!useGps)
  }

  return isGeolocationAvailable && position
    ? (
      <button className="min-w-8 border" onClick={handleClick}>
        {useGps ? 'Following: ' : null}{position?.latitude}, {position?.longitude}
      </button>
    )
    : null
}