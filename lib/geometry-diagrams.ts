export const geometryDiagramKinds = [
  'triangle',
  'quadrilateral',
  'circle',
  'angle',
  'plot',
  'solid',
] as const

export type GeometryDiagramKind = (typeof geometryDiagramKinds)[number]

export type GeometryDiagramSpec = {
  kind: GeometryDiagramKind
  variant: string
  label: string
}

const allowedVariants: Record<GeometryDiagramKind, readonly string[]> = {
  triangle: ['equilateral', 'isosceles', 'scalene', 'right'],
  quadrilateral: ['square', 'rectangle', 'rhombus', 'trapezoid'],
  circle: ['radius', 'diameter', 'chord', 'sector'],
  angle: ['acute', 'right', 'obtuse', 'straight'],
  plot: ['linear-up', 'linear-down', 'quadratic', 'inverse'],
  solid: ['cube', 'prism', 'cylinder', 'cone'],
}

export function isGeometryDiagramSpec(value: unknown): value is GeometryDiagramSpec {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  if (typeof record.kind !== 'string' || !geometryDiagramKinds.includes(record.kind as GeometryDiagramKind)) {
    return false
  }
  if (typeof record.variant !== 'string' || typeof record.label !== 'string') return false
  return allowedVariants[record.kind as GeometryDiagramKind].includes(record.variant)
}
