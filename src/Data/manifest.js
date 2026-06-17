const MANIFEST_URL = '/data/manifest.json';

let manifestPromise = null;

/**
 * Loads the data manifest once and memoizes it. Resolves to `null` when the
 * manifest is unreachable (e.g. offline) so callers can fall back to cache.
 */
export function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL, { cache: 'no-cache' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return manifestPromise;
}

/** Set of cell keys that actually have a geometry shard, to avoid 404s. */
export async function loadAvailableCells() {
  const manifest = await loadManifest();
  return new Set((manifest?.cells ?? []).map((c) => c.key));
}
