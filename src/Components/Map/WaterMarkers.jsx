import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { formatWaterName } from '../../Util/waterName'

const MARKER_MAX_ZOOM = 12
const NAME_LIMIT = 3
const TAP_AGAIN_MS = 600
const HEAT_ZOOM_MIN = 6
const HEAT_ZOOM_MAX = 11

/** 0 at min zoom (zoomed out), 1 near heat-map cutoff. */
function heatZoomFactor(zoom) {
  return Math.max(0, Math.min(1, (zoom - HEAT_ZOOM_MIN) / (HEAT_ZOOM_MAX - HEAT_ZOOM_MIN)))
}

/** Smaller bin cells when zoomed out — fewer waters merge into one blob. */
function clusterCellPx(zoom) {
  const t = heatZoomFactor(zoom)
  return Math.round(20 + t * 16)
}

const BLOB_R_MIN = 10
const BLOB_R_MAX = 92

/**
 * Shared 0–1 strength from water body area (m²). Drives blob radius and blue opacity.
 * Calibrated so ~Thorne Pond (~60k m²) stays tiny and ~Grand Lake (~100M+ m²) reads large.
 */
const AREA_LOG_MIN = 4.65 // ~45k m²
const AREA_LOG_MAX = 8.15 // ~140M m²

function areaStrength(maxAreaM2) {
  if (!maxAreaM2 || maxAreaM2 <= 0) return 0
  const t = (Math.log10(maxAreaM2 + 1) - AREA_LOG_MIN) / (AREA_LOG_MAX - AREA_LOG_MIN)
  return Math.max(0, Math.min(1, t))
}

/** Size-only boost so small waters read ~2× larger; large lakes stay at BLOB_R_MAX. */
function areaStrengthForSize(maxAreaM2) {
  const s = areaStrength(maxAreaM2)
  return Math.min(1, s * 1.25 + 0.04)
}

/** Blob radius from largest water body area in the cluster (m² via turf.area at build time). */
function blobRadius(maxAreaM2, zoom) {
  const zoomScale = 0.32 + heatZoomFactor(zoom) * 0.68
  const s = maxAreaM2 ? areaStrengthForSize(maxAreaM2) : 0
  const base = BLOB_R_MIN + s * (BLOB_R_MAX - BLOB_R_MIN)
  return Math.max(6, Math.round(base * zoomScale))
}

/** Screen-space cell for staggered (brick) binning — odd rows shift half a cell right. */
function staggeredCell(p, cellPx) {
  const row = Math.floor(p.y / cellPx)
  const stagger = (row & 1) * (cellPx / 2)
  const col = Math.floor((p.x - stagger) / cellPx)
  return { col, row }
}

function staggeredCellCenter(map, col, row, cellPx) {
  const stagger = (row & 1) * (cellPx / 2)
  const x = (col + 0.5) * cellPx + stagger
  const y = (row + 0.5) * cellPx
  return map.containerPointToLatLng(L.point(x, y))
}

const COUNT_FULL_GREEN = 10

function countColorIntensity(count) {
  const t = Math.min(1, count / COUNT_FULL_GREEN)
  return Math.pow(t, 1.35)
}

/** Color opacity scale: faint when zoomed out, full strength when zoomed in. */
function heatIntensityScale(zoom) {
  const t = heatZoomFactor(zoom)
  return 0.28 + t * 0.72
}

/** Water heat map: blue layer = area (same strength as blob size); green = count. */
function clusterHeatStyle(cluster, zoom) {
  const intensity = heatIntensityScale(zoom)
  const areaS = areaStrength(cluster.areaMax)
  const areaCenterPct = areaS * 52 * intensity
  const areaEdgePct = areaS * 22 * intensity

  const countT = countColorIntensity(cluster.count)
  const countCenterPct = countT * 34 * intensity
  const countEdgePct = countT * 14 * intensity

  return [
    `--heat-area-center:${areaCenterPct / 100}`,
    `--heat-area-edge:${areaEdgePct / 100}`,
    `--heat-count-center:${countCenterPct / 100}`,
    `--heat-count-edge:${countEdgePct / 100}`,
  ].join(';')
}

function groupIntoClusters(map, items, paddedBounds, zoom) {
  const cellPx = clusterCellPx(zoom)
  const buckets = new Map()
  for (const item of items) {
    if (!paddedBounds.contains([item.lat, item.lng])) continue
    const p = map.latLngToContainerPoint([item.lat, item.lng])
    const { col, row } = staggeredCell(p, cellPx)
    const key = `${col}_${row}`
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { col, row, items: [], sumLat: 0, sumLng: 0, areaMax: 0 }
      buckets.set(key, bucket)
    }
    bucket.items.push(item)
    bucket.sumLat += item.lat
    bucket.sumLng += item.lng
    const area = item.area ?? 0
    if (area > bucket.areaMax) bucket.areaMax = area
  }
  return [...buckets.values()].map((b) => {
    const count = b.items.length
    const focusLat = b.sumLat / count
    const focusLng = b.sumLng / count
    const cell = staggeredCellCenter(map, b.col, b.row, cellPx)
    return {
      items: b.items,
      count,
      areaMax: b.areaMax,
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

const HOVER_CLOSE_MS = 120

function setMarkerHovered(marker, hovered) {
  if (!marker) return
  marker.getElement()?.classList.toggle('is-hovered', hovered)
}

function attachPopupHoverBridge(marker, hoverState) {
  marker.on('popupopen', () => {
    if (hoverState.cancelled) return
    const popupEl = marker.getPopup()?.getElement()
    if (!popupEl) return

    const onPopupEnter = () => {
      if (hoverState.cancelled) return
      hoverState.popupHovered = true
      if (hoverState.hoverCloseTimer != null) {
        window.clearTimeout(hoverState.hoverCloseTimer)
        hoverState.hoverCloseTimer = null
      }
    }
    const onPopupLeave = () => {
      if (hoverState.cancelled) return
      hoverState.popupHovered = false
      scheduleHoverClose(hoverState)
    }

    L.DomEvent.on(popupEl, 'mouseenter', onPopupEnter)
    L.DomEvent.on(popupEl, 'mouseleave', onPopupLeave)
  })

  marker.on('popupclose', () => {
    hoverState.popupHovered = false
    setMarkerHovered(marker, false)
    if (hoverState.activeMarker === marker) hoverState.activeMarker = null
  })
}

function scheduleHoverClose(hoverState) {
  if (hoverState.cancelled) return
  if (hoverState.hoverCloseTimer != null) {
    window.clearTimeout(hoverState.hoverCloseTimer)
  }
  hoverState.hoverCloseTimer = window.setTimeout(() => {
    hoverState.hoverCloseTimer = null
    if (hoverState.cancelled || hoverState.popupHovered) return
    deactivateHover(hoverState)
  }, HOVER_CLOSE_MS)
}

function deactivateHover(hoverState) {
  if (hoverState.hoverCloseTimer != null) {
    window.clearTimeout(hoverState.hoverCloseTimer)
    hoverState.hoverCloseTimer = null
  }
  const prev = hoverState.activeMarker
  hoverState.activeMarker = null
  hoverState.popupHovered = false
  if (prev) {
    prev.closePopup()
    setMarkerHovered(prev, false)
  }
}

function activateHover(marker, hoverState) {
  if (hoverState.cancelled || !marker) return
  if (hoverState.hoverCloseTimer != null) {
    window.clearTimeout(hoverState.hoverCloseTimer)
    hoverState.hoverCloseTimer = null
  }
  if (hoverState.activeMarker === marker) return

  const prev = hoverState.activeMarker
  if (prev) {
    hoverState.activeMarker = null
    prev.closePopup()
    setMarkerHovered(prev, false)
  }

  hoverState.activeMarker = marker
  setMarkerHovered(marker, true)
  marker.openPopup()
}

/**
 * Water heat map — soft overlapping blobs showing areas that contain waters
 * (zoom &lt; 12). Desktop: hover popup. Touch: tap opens popup; tap again zooms/selects.
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
    const hoverState = {
      activeMarker: null,
      hoverCloseTimer: null,
      popupHovered: false,
      cancelled: false,
    }

    const cleanup = () => {
      hoverState.cancelled = true
      deactivateHover(hoverState)
    }

    group.clearLayers()

    const { bounds, zoom } = mapView
    if (!bounds || zoom == null || zoom >= MARKER_MAX_ZOOM || !items.length) {
      return cleanup
    }

    const zoomToCluster = (cluster) => {
      map.setView([cluster.focusLat, cluster.focusLng], Math.min(map.getZoom() + 2, map.getMaxZoom()), {
        animate: true,
      })
    }

    const clusters = groupIntoClusters(map, items, bounds.pad(0.2), zoom)

    for (const cluster of clusters) {
      const radius = blobRadius(cluster.areaMax, zoom)
      const size = radius * 2
      const hit = isTouch ? Math.max(28, size + 12) : size + 6
      const isSelected = cluster.count === 1 && cluster.items[0].id === selectedId
      const key = clusterKey(cluster)
      const heatStyle = clusterHeatStyle(cluster, zoom)
      const zIndexOffset = Math.round((1 - areaStrength(cluster.areaMax)) * 1000)

      const icon = L.divIcon({
        className: 'water-blob-icon',
        html:
          `<span class="water-blob-hit" style="width:${hit}px;height:${hit}px">` +
          `<span class="water-blob water-heat-map${isSelected ? ' is-selected' : ''}" style="width:${size}px;height:${size}px;${heatStyle}"></span>` +
          `</span>`,
        iconSize: [hit, hit],
        iconAnchor: [hit / 2, hit / 2],
      })

      const marker = L.marker([cluster.lat, cluster.lng], { icon, keyboard: false, zIndexOffset })

      marker.bindPopup(buildPopupContent(cluster, zoomToCluster, onSelectRef), {
        closeButton: false,
        autoPan: false,
        offset: [0, -radius + 4],
        className: 'water-popup-wrap',
      })

      if (!isTouch) {
        attachPopupHoverBridge(marker, hoverState)
        marker.on('mouseover', () => {
          if (hoverState.cancelled) return
          activateHover(marker, hoverState)
        })
        marker.on('mouseout', () => {
          if (hoverState.cancelled) return
          scheduleHoverClose(hoverState)
        })
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

    return cleanup
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
      link.textContent = formatWaterName(item)
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
