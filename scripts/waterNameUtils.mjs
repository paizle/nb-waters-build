/** Shared name resolution for prepare-data and audit scripts. */

export const NAME_FIELDS = [
  'NAME1',
  'NAME2',
  'LOCALNAME',
  'NAMEID1',
  'NAMEID2',
  'LOCALNAMEID',
]

const UUID_LIKE = /^[0-9A-F]{32}$/i

function isUuidLike(value) {
  const s = String(value).trim().replace(/-/g, '')
  return UUID_LIKE.test(s)
}

const UUID_ID_FIELDS = new Set(['NAMEID1', 'NAMEID2', 'LOCALNAMEID'])

function isTruthyName(value, field) {
  if (value == null) return false
  const trimmed = String(value).trim()
  if (!trimmed) return false
  if (UUID_ID_FIELDS.has(field) && isUuidLike(trimmed)) return false
  return true
}

export function hasKnownName(props) {
  if (!props) return false
  return NAME_FIELDS.some((field) => isTruthyName(props[field], field))
}

export function getNameFromProps(props) {
  if (!props) return ''
  for (const field of NAME_FIELDS) {
    const value = props[field]
    if (isTruthyName(value, field)) return String(value).trim()
  }
  return ''
}
