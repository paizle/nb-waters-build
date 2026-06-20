/** Display-friendly water name (runtime; index may still store raw build names). */
export function formatWaterName(item) {
  const name = item?.name?.trim()
  if (name) return name
  if (item?.nid) return `National ID: ${item.nid}`
  return 'Unknown water'
}
