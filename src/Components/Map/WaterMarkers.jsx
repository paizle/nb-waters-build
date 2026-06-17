import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

// Pixel size of the screen-space clustering grid. Smaller cells -> more, more
// densely overlapping blobs, which is what produces the "bleeding" density look.
const CLUSTER_CELL_PX = 34
// Above this zoom the real outlines (ViewportOutlines) take over, so the blobs
// are hidden to avoid clutter.
const MARKER_MAX_ZOOM = 12
// At most this many names are listed in a hover popup before we offer "Zoom in".
const NAME_LIMIT = 3

/** Radius in pixels for a blob representing `count` waters. */
function blobRadius(count) {
  return Math.round(14 + Math.log2(count + 1) * 6)
}

function groupIntoClusters(map, items, paddedBounds) {
  const buckets = new Map()
  for (const item of items) {
    if (!paddedBounds.contains([item.lat, item.lng])) continue
    const p = map.latLngToContainerPoint([item.lat, item.lng])
    const key = `${Math.floor(p.x / CLUSTER_CELL_PX)}_${Math.floor(p.y / CLUSTER_CELL_PX)}`
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { items: [], sumLat: 0, sumLng: 0 }
      buckets.set(key, bucket)
    }
    bucket.items.push(item)
    bucket.sumLat += item.lat
    bucket.sumLng += item.lng
  }
  return [...buckets.values()].map((b) => ({
    items: b.items,
    count: b.items.length,
    lat: b.sumLat / b.items.length,
    lng: b.sumLng / b.items.length,
  }))
}

/**
 * Renders waters as soft, overlapping orange gradient blobs (clustered in
 * screen space). Overlap intensifies the colour, so denser areas read as a
 * darker orange. Hovering reveals the blob outline and a popup that lists the
 * water names (<= 3) or offers a "Zoom in" link.
 */
export default function WaterMarkers({ items, mapView, selectedId, onSelect }) {
  const map = useMap()
  const groupRef = useRef(null)
  // Keep the latest onSelect without forcing a full rebuild when it changes.
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  if (!groupRef.current) groupRef.current = L.layerGroup()

  useEffect(() => {
    const group = groupRef.current
    group.addTo(map)
    return () => group.remove()
  }, [map])

  useEffect(() => {
    const group = groupRef.current
    group.clearLayers()

    const { bounds, zoom } = mapView
    if (!bounds || zoom == null || zoom >= MARKER_MAX_ZOOM || !items.length) return

    const zoomToCluster = (cluster) => {
      map.setView([cluster.lat, cluster.lng], Math.min(map.getZoom() + 2, map.getMaxZoom()), {
        animate: true,
      })
    }

    const clusters = groupIntoClusters(map, items, bounds.pad(0.2))

    for (const cluster of clusters) {
      const radius = blobRadius(cluster.count)
      const size = radius * 2
      // The visible blob is decorative (pointer-events: none) and may overlap
      // neighbours freely; only this small centered core captures hover/click,
      // which prevents overlapping blobs from fighting over the hover state.
      const hit = Math.max(16, Math.min(size, 26))
      const isSelected = cluster.count === 1 && cluster.items[0].id === selectedId

      const icon = L.divIcon({
        className: 'water-blob-icon',
        html:
          `<span class="water-blob-hit" style="width:${hit}px;height:${hit}px">` +
          `<span class="water-blob${isSelected ? ' is-selected' : ''}" style="width:${size}px;height:${size}px"></span>` +
          `</span>`,
        iconSize: [hit, hit],
        iconAnchor: [hit / 2, hit / 2],
      })

      const marker = L.marker([cluster.lat, cluster.lng], { icon, keyboard: false })

      marker.bindPopup(buildPopupContent(cluster, zoomToCluster, onSelectRef), {
        closeButton: false,
        autoPan: false,
        offset: [0, -radius + 4],
        className: 'water-popup-wrap',
      })

      marker.on('mouseover', () => marker.openPopup())
      marker.on('click', () => {
        if (cluster.count === 1) onSelectRef.current(cluster.items[0].id)
        else zoomToCluster(cluster)
      })

      marker.addTo(group)
    }
  }, [map, items, mapView, selectedId])

  return null
}

/** Builds interactive popup DOM for a cluster (names list or "Zoom in" link). */
function buildPopupContent(cluster, zoomToCluster, onSelectRef) {
  const root = L.DomUtil.create('div', 'water-popup')

  if (cluster.count <= NAME_LIMIT) {
    const list = L.DomUtil.create('ul', '', root)
    for (const item of cluster.items) {
      const li = L.DomUtil.create('li', '', list)
      const link = L.DomUtil.create('a', 'water-popup-name', li)
      link.href = '#'
      link.textContent = item.name
      L.DomEvent.on(link, 'click', (e) => {
        L.DomEvent.preventDefault(e)
        onSelectRef.current(item.id)
      })
    }
  } else {
    const label = L.DomUtil.create('div', 'water-popup-count', root)
    label.textContent = `${cluster.count} waters`
    const link = L.DomUtil.create('a', 'water-popup-zoom', root)
    link.href = '#'
    link.textContent = 'Zoom in'
    L.DomEvent.on(link, 'click', (e) => {
      L.DomEvent.preventDefault(e)
      zoomToCluster(cluster)
    })
  }

  return root
}
