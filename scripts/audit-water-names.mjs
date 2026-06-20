/**
 * Reports property keys on features with no resolved name from NAME_FIELDS.
 * Run: node scripts/audit-water-names.mjs
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hasKnownName, NAME_FIELDS } from './waterNameUtils.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const INPUT_CANDIDATES = [
  resolve(ROOT, 'data-src/waters.geojson'),
  resolve(ROOT, 'public/waters.geojson'),
]

function findInput() {
  const found = INPUT_CANDIDATES.find((p) => existsSync(p))
  if (!found) {
    console.error(
      'No source GeoJSON found. Place it at one of:\n' +
        INPUT_CANDIDATES.map((p) => `  - ${p}`).join('\n')
    )
    process.exit(1)
  }
  return found
}

function main() {
  const input = findInput()
  console.log(`Reading ${input} ...`)
  const raw = JSON.parse(readFileSync(input, 'utf8'))
  const features = raw.features ?? []

  const keyCounts = new Map()
  const samples = new Map()
  let unnamed = 0

  for (const feature of features) {
    const props = feature.properties ?? {}
    if (hasKnownName(props)) continue
    unnamed++

    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === '') continue
      keyCounts.set(key, (keyCounts.get(key) || 0) + 1)
      if (!samples.has(key)) samples.set(key, String(value).slice(0, 60))
    }
  }

  console.log(`\nFeatures without a resolved name (${NAME_FIELDS.join(', ')}): ${unnamed} / ${features.length}\n`)
  console.log('Property keys with non-empty values (frequency):')
  const sorted = [...keyCounts.entries()].sort((a, b) => b[1] - a[1])
  for (const [key, count] of sorted) {
    console.log(`  ${key.padEnd(20)} ${count}\t sample: ${samples.get(key)}`)
  }
}

main()
