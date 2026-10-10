export const materials = [
  { id: 'water', name: 'Water', index: 1.333 },
  { id: 'glass', name: 'Glass', index: 1.5 },
  { id: 'diamond', name: 'Diamond', index: 2.42 },
] as const
export type MaterialId = typeof materials[number]['id']
export type Direction = { x: number; y: number }
const degrees = (radians: number) => radians * 180 / Math.PI

/** Screen y points down. Rotation is measured clockwise from the upper normal. */
export function refract(rotation: number, index: number) {
  const radians = rotation * Math.PI / 180
  const incident: Direction = { x: -Math.sin(radians), y: Math.cos(radians) }
  const inside = incident.y < 0
  const nIn = inside ? index : 1, nOut = inside ? 1 : index
  const cosineIn = Math.abs(incident.y), sineOut = nIn / nOut * Math.abs(incident.x)
  const incidence = degrees(Math.acos(Math.min(1, cosineIn)))
  const reflected: Direction = { x: incident.x, y: -incident.y }
  const criticalAngle = nIn > nOut ? degrees(Math.asin(nOut / nIn)) : null
  if (sineOut > 1) return { inside, nIn, nOut, incidence, refraction: null, incident, reflected, transmitted: null, reflectance: 1, transmittance: 0, totalReflection: true, criticalAngle }
  const cosineOut = Math.sqrt(Math.max(0, 1 - sineOut * sineOut))
  const transmitted: Direction = { x: nIn / nOut * incident.x, y: Math.sign(incident.y) * cosineOut }
  // Fresnel power coefficients for unpolarized light at an ideal lossless interface.
  const rs = (nIn * cosineIn - nOut * cosineOut) / (nIn * cosineIn + nOut * cosineOut)
  const rp = (nIn * cosineOut - nOut * cosineIn) / (nIn * cosineOut + nOut * cosineIn)
  const reflectance = (rs * rs + rp * rp) / 2
  return { inside, nIn, nOut, incidence, refraction: degrees(Math.asin(sineOut)), incident, reflected, transmitted, reflectance, transmittance: 1 - reflectance, totalReflection: false, criticalAngle }
}
export type Optics = ReturnType<typeof refract>
