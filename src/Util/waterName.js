/** Display-friendly water name (runtime; index may still store raw build names). */
export function formatWaterName(item) {
  const name = item?.name
  if (!name) return 'Unknown water'

  const unnamed = name.match(/^Unnamed \(ID: (\d+)\)$/)
  if (unnamed) return `Water body #${unnamed[1]}`

  return name
}
