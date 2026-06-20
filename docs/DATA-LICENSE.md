# Data licensing and attribution

## Why this document exists

New Brunswick Waters displays hydrography from the provincial open-data catalogue. That data is offered under the [Open Government Licence – New Brunswick](https://www.snb.ca/e/2000/data-E.html) (OGL-NB).

Using the data — including the processed shards this app serves from `public/data/` — is permitted only if we comply with the licence. The OGL-NB **“You must”** section requires:

1. **Source acknowledgment** — credit the Information Provider and, where specified, the dataset.
2. **Licence statement** — include the standard line *“Contains information licensed under the Open Government Licence – New Brunswick.”* and link to the licence where possible.

If we fail to comply, the rights granted under the licence end automatically.

This document records what we use, who we credit, and how the app satisfies those terms.

## What data we use

| Item | Detail |
|------|--------|
| **Dataset** | New Brunswick Hydrographic Network (NBHN) |
| **Publisher** | Government of New Brunswick |
| **Maintaining department** | Department of Natural Resources and Energy Development (DNRED) |
| **Infrastructure** | Service New Brunswick / GeoNB open-data programme |
| **Features** | ~17,000 waterbody polygons with names, national IDs (`NID`), and area (`SHAPEAREA`) |
| **Raw source** | `data-src/waters.geojson` or `public/waters.geojson` (gitignored, never served) |
| **Processed artifacts** | `public/data/index.json`, `public/data/geometry/*.json`, `public/data/manifest.json` |

Reference pages:

- [NBHN open-data page (GNB)](https://www2.gnb.ca/content/gnb/en/departments/erd/open-data/nbhn.html)
- [NBHN on Open Government Portal (Canada)](https://open.canada.ca/data/en/dataset/be3bcf7c-64f5-9c6f-84d4-18bdad897ea7)

The build script [`scripts/prepare-data.mjs`](../scripts/prepare-data.mjs) derives the served files from the raw GeoJSON. Derived data is still “Information” under the licence.

## What we display in the app

A bottom-left map overlay ([`MapView.jsx`](../src/Components/Map/MapView.jsx)) shows:

> New Brunswick Hydrographic Network (NBHN) — Government of New Brunswick, Department of Natural Resources and Energy Development. Contains information licensed under the [Open Government Licence – New Brunswick](https://www.snb.ca/e/2000/data-E.html).

That text satisfies both the **source** and **licence** attribution requirements.

## What we must not do

Per the OGL-NB:

- **Non-endorsement** — do not suggest official status or that the Province endorses this app.
- **Exemptions** — do not use government crests, logos, or other official symbols.
- **No warranty** — the Information is licensed “as is”; this app does not guarantee the accuracy of provincial records.

## Updates

- Re-check attribution if the OGL-NB is revised (currently version 2).
- If we add datasets from other providers, update the map attribution and this document accordingly.

## Related files

- Licence text: https://www.snb.ca/e/2000/data-E.html
- Data pipeline: [`scripts/prepare-data.mjs`](../scripts/prepare-data.mjs)
- Display helper: [`src/Util/waterName.js`](../src/Util/waterName.js)
