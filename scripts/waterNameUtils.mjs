/** Shared name resolution for prepare-data and audit scripts. */

export const NAME_FIELDS = ['NAME1', 'NAME2', 'LOCALNAME', 'WATNAME', 'ALTNAME', 'GNIS_NAME']

export function hasKnownName(props) {
  if (!props) return false
  return Boolean(
    (props.NAME1 && String(props.NAME1).trim()) ||
      (props.NAME2 && String(props.NAME2).trim()) ||
      (props.LOCALNAME && String(props.LOCALNAME).trim())
  )
}

export function getNameFromProps(props) {
  if (!props) return 'Unknown water'
  for (const field of NAME_FIELDS) {
    const value = props[field]
    if (value != null && String(value).trim()) return String(value).trim()
  }
  const id = props.OBJECTID
  return id != null ? `Unnamed (ID: ${id})` : 'Unknown water'
}
