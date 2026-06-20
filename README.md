# New Brunswick Waters

An offline-capable PWA for browsing New Brunswick's ~17k named waters on a map,
with a searchable picker and GPS direction-finding.

## Getting started

```bash
npm install
npm run prepare-data   # one-time: build the optimized data artifacts (see below)
npm run dev
```

## Branches and deployment

| Branch | Purpose |
|--------|---------|
| `main` | Source code (React app, scripts, data pipeline) |
| `deployment` | Flat `dist/` output for Hostinger |

Deploy without touching your working tree:

```bash
npm run deploy
```

This runs `npm run build`, copies `dist/` into a git worktree on `deployment`, commits, and pushes to `origin/deployment`. Hostinger should pull from the **`deployment`** branch.

## Architecture

The app never loads the raw 82 MB GeoJSON in the browser. Instead a build-time
script turns it into small static artifacts that are fetched lazily and cached
in IndexedDB.

### Data pipeline (`npm run prepare-data`)

[`scripts/prepare-data.mjs`](scripts/prepare-data.mjs) reads the raw GeoJSON and
emits to `public/data/`:

- `index.json` — `[{ id, name, nid, lat, lng, area }]` for every water, sorted by name
  (~1 MB). Powers the search combobox and the map **water heat map**.
- `geometry/{cell}.json` — simplified polygons grouped into 0.25° grid cells,
  loaded only for the current viewport / selected water.
- `manifest.json` — version + list of available cells (used for cache
  invalidation and to avoid 404s).

Place the raw source at `data-src/waters.geojson` (preferred) or
`public/waters.geojson`. The `data-src/` folder is git-ignored and never served.
Re-run `npm run prepare-data` whenever the source data changes.

Area values come from the source `SHAPEAREA` property. Names are resolved from
`NAME1`, `NAME2`, `LOCALNAME`, then non-UUID `NAMEID*` / `LOCALNAMEID` fields;
features without a name store an empty string and display `National ID: {NID}` in
the app.

See [`docs/DATA-LICENSE.md`](docs/DATA-LICENSE.md) for data licensing and
attribution requirements.

Audit unnamed-water property keys:

```bash
npm run audit-water-names
```

### Runtime layers

- **`src/Data/`** — the only place that touches `fetch` / IndexedDB. Handles
  caching, version invalidation, and lazy shard loading.
- **`src/Hooks/`** — thin React wrappers over the data layer.
- **`src/Components/`** — UI:
  - `Map/` — `MapView` composes the **water heat map** (`WaterMarkers`),
    viewport outlines, selected outline, GPS overlays, nearest-waters arrows,
    and toolbar.
  - `Footer/` + `SelectWater/` — virtualized search combobox.

### Map rendering strategy

- **Water heat map** (zoom &lt; 12): staggered screen-space blobs whose opacity
  and green tint scale with water count and precomputed area (when index includes
  `area`). See [`WaterMarkers.jsx`](src/Components/Map/WaterMarkers.jsx).
- Real outlines fade in at zoom ≥ 12, loaded per grid cell.
- Selected water outline loads from its shard; map fits to it.

### Interaction patterns

See [`docs/INTERACTION-PATTERNS.md`](docs/INTERACTION-PATTERNS.md) for hover/tap
equivalence, `MapControlButton` usage, and `aria-label` vs `title` guidance.

### GPS

`useGeolocation` does not request permission until a GPS button is tapped.
Lock to GPS shows a green direction arrow and accuracy circle; Move to my
location pans once without follow mode.

### Theme

Dark mode toggles via the bottom-left gear menu and swaps the basemap to ArcGIS
Dark Gray Canvas. Preference is stored in `localStorage`.
