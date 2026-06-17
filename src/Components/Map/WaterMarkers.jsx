import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

const CLUSTER_CELL_PX = 34
const MARKER_MAX_ZOOM = 12
const NAME_LIMIT = 3
const TAP_AGAIN_MS = 600

function blobRadius(count) {
  return Math.round(14 + Math.log2(count + 1) * 6)
}

/** Screen-space cell for staggered (brick) binning — odd rows shift half a cell right. */
function staggeredCell(p) {
  const row = Math.floor(p.y / CLUSTER_CELL_PX)
  const stagger = (row & 1) * (CLUSTER_CELL_PX / 2)
  const col = Math.floor((p.x - stagger) / CLUSTER_CELL_PX)
  return { col, row }
}

function staggeredCellCenter(map, col, row) {
  const stagger = (row & 1) * (CLUSTER_CELL_PX / 2)
  const x = (col + 0.5) * CLUSTER_CELL_PX + stagger
  const y = (row + 0.5) * CLUSTER_CELL_PX
  return map.containerPointToLatLng(L.point(x, y))
}

function groupIntoClusters(map, items, paddedBounds) {
  const buckets = new Map()
  for (const item of items) {
    if (!paddedBounds.contains([item.lat, item.lng])) continue
    const p = map.latLngToContainerPoint([item.lat, item.lng])
    const { col, row } = staggeredCell(p)
    const key = `${col}_${row}`
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { col, row, items: [], sumLat: 0, sumLng: 0 }
      buckets.set(key, bucket)
    }
    bucket.items.push(item)
    bucket.sumLat += item.lat
    bucket.sumLng += item.lng
  }
  return [...buckets.values()].map((b) => {
    const count = b.items.length
    const focusLat = b.sumLat / count
    const focusLng = b.sumLng / count
    const cell = staggeredCellCenter(map, b.col, b.row)
    return {
      items: b.items,
      count,
      lat: cell.lat,
      lng: cell.lng,
      focusLat,
      focusLng,
    }
  })
}

function clusterKey(cluster) {
  return `${cluster.lat.toFixed(5)}_${cluster.lng.toFixed(5)}_${cluster.count}`
}

/**
 * Renders waters as soft, overlapping cyan gradient blobs (clustered in
 * screen space). Desktop: hover popup. Touch: tap opens popup; tap again zooms/selects.
 */
export default function WaterMarkers({ items, mapView, selectedId, onSelect, isTouch }) {
  const map = useMap()
  const groupRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  const lastTapRef = useRef({ key: null, time: 0 })
  onSelectRef.current = onSelect

  if (!groupRef.current) groupRef.current = L.layerGroup()

  useEffect(() => {
    groupRef.current.addTo(map)
    return () => groupRef.current.remove()
  }, [map])

  useEffect(() => {
    const group = groupRef.current
    group.clearLayers()

    const { bounds, zoom } = mapView
    if (!bounds || zoom == null || zoom >= MARKER_MAX_ZOOM || !items.length) return

    const zoomToCluster = (cluster) => {
      map.setView([cluster.focusLat, cluster.focusLng], Math.min(map.getZoom() + 2, map.getMaxZoom()), {
        animate: true,
      })
    }

    const clusters = groupIntoClusters(map, items, bounds.pad(0.2))

    for (const cluster of clusters) {
      const radius = blobRadius(cluster.count)
      const size = radius * 2
      const hit = Math.max(28, Math.min(size + 12, 44))
      const isSelected = cluster.count === 1 && cluster.items[0].id === selectedId
      const key = clusterKey(cluster)

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

      if (!isTouch) {
        marker.on('mouseover', () => marker.openPopup())
      } else {
        marker.on('touchstart', () => {
          marker.getElement()?.classList.add('tapped')
        })
        marker.on('touchend touchcancel', () => {
          window.setTimeout(() => marker.getElement()?.classList.remove('tapped'), 200)
        })
      }

      marker.on('click', () => {
        const now = Date.now()
        const last = lastTapRef.current
        const isRepeat = last.key === key && now - last.time < TAP_AGAIN_MS

        if (isTouch) {
          if (isRepeat) {
            if (cluster.count === 1) onSelectRef.current(cluster.items[0].id)
            else zoomToCluster(cluster)
            marker.closePopup()
            lastTapRef.current = { key: null, time: 0 }
          } else {
            marker.openPopup()
            lastTapRef.current = { key, time: now }
          }
          return
        }

        if (cluster.count === 1) onSelectRef.current(cluster.items[0].id)
        else zoomToCluster(cluster)
      })

      marker.addTo(group)
    }
  }, [map, items, mapView, selectedId, isTouch])

  return null
}

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
    link.textContent = 'Tap again to zoom in'
    L.DomEvent.on(link, 'click', (e) => {
      L.DomEvent.preventDefault(e)
      zoomToCluster(cluster)
    })
  }

  return root
}
