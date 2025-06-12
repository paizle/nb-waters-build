export function flipCoords(coords) {
  return coords.map((point) => {
    if (Array.isArray(point[0])) {
      return flipCoords(point)
    }
    return [point[1], point[0]]
  })
}

// Haversine distance in meters between two points (lat/lng)
export function haversineDistance(a, b) {
    const R = 6371e3; // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;

    const φ1 = toRad(a.lat);
    const φ2 = toRad(b.lat);
    const Δφ = toRad(b.lat - a.lat);
    const Δλ = toRad(b.lng - a.lng);

    const aVal =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));

    const distance = R * c;
    return distance
  }