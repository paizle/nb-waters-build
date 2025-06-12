export const getName = (feature) => feature.properties?.NAME1 || feature.properties?.NAME2 || feature.properties?.LOCALNAME || ('Unamed (ID: ' + feature.properties.OBJECTID + ')')

export const getKey = (feature) => feature.properties.OBJECTID;

export const getIds = (properties) => {
  const fields = ['OBJECTID', 'NID', 'LOCALNAME', 'WATERDEFINITION', 'WATERID', 'DATASETNAME', 'WATERSHEDCODE']
  return fields.reduce((a, v) => {
    a[v] = properties?.[v]
    return a
  }, {})
} 