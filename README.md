# New Brunswick Waters

An offline-capable PWA for browsing New Brunswick's ~17k named waters on a map,
with a searchable picker and GPS direction-finding.

## Getting started

```bash
npm install
npm run prepare-data   # one-time: build the optimized data artifacts (see below)
npm run dev
```

## Architecture

The app never loads the raw 82 MB GeoJSON in the browser. Instead a build-time
script turns it into small static artifacts that are fetched lazily and cached
in IndexedDB.

### Data pipeline (`npm run prepare-data`)

[`scripts/prepare-data.mjs`](scripts/prepare-data.mjs) reads the raw GeoJSON and
emits to `public/data/`:

- `index.json` — `[{ id, name, lat, lng }]` for every water, sorted by name
  (~1 MB). Powers the search combobox and the map point markers.
- `geometry/{cell}.json` — simplified polygons grouped into 0.25° grid cells,
  loaded only for the current viewport / selected water.
- `manifest.json` — version + list of available cells (used for cache
  invalidation and to avoid 404s).

Place the raw source at `data-src/waters.geojson` (preferred) or
`public/waters.geojson`. The `data-src/` folder is git-ignored and never served.
Re-run `npm run prepare-data` whenever the source data changes.

### Runtime layers

- **`src/Data/`** — the only place that touches `fetch` / IndexedDB. Handles
  caching, version invalidation, and lazy shard loading.
  - `waterIndex.js` — shared, cached index load.
  - `geometry.js` — viewport cell math + per-cell lazy loading.
  - `manifest.js`, `db.js` — manifest + IndexedDB setup.
- **`src/Hooks/`** — thin React wrappers over the data layer:
  `useWaterIndex`, `useWaterSearch`, `useViewportGeometry`,
  `useFeatureGeometry`, and `useGeolocation`. UI components only use these and
  never deal with caching directly.
- **`src/Components/`** — UI:
  - `Map/` — `MapView` composes canvas point markers (`WaterMarkers`),
    viewport outlines (`ViewportOutlines`), the selected outline
    (`SelectedWater`), and the GPS toolbar (`MapToolbar`).
  - `Footer/` + `SelectWater/` — the centered, virtualized search combobox
    overlaying the map.

### Map rendering strategy

- Every water shows as a lightweight canvas point marker, viewport-culled and
  clustered in screen space so the marker count stays bounded at any zoom.
- Real (simplified) outlines fade in for the viewport once zoomed in
  (zoom ≥ 12) and are loaded per grid cell on demand.
- The selected water's outline is loaded from its shard and the map fits to it.

### GPS

`useGeolocation` does not request permission until the GPS button is tapped.
Once enabled, the toolbar shows a direction arrow + name pointing from the
user's position to the selected water, and the snap button centers the map on
the current location.
