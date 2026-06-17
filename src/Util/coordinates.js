// flips the co-ordinates from lat/lng to lng/lat (for translating GeoJSON features format)
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

export function polygonCentroid(points) {
  let area = 0;
  let x = 0;
  let y = 0;
  const n = points.length;

  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    x += (x0 + x1) * cross;
    y += (y0 + y1) * cross;
  }

  area = area / 2;
  x = x / (6 * area);
  y = y / (6 * area);

  return { lat: y, lng: x };
}

export function toPoint(latLng) {
  return [latLng.lat, latLng.lng]
}

// Initial compass bearing in degrees (0 = north, clockwise) from `from` to `to`.
export function bearing(from, to) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const toDeg = (rad) => (rad * 180) / Math.PI

  const φ1 = toRad(from.lat)
  const φ2 = toRad(to.lat)
  const Δλ = toRad(to.lng - from.lng)

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  return (toDeg(Math.atan2(y, x)) + 360) % 360
}