export const visualThemeIds = [
  'corgi-classic',
  'deep-sea',
  'space-station',
  'paper-workshop',
  'arcade-city',
] as const

export type VisualThemeId = (typeof visualThemeIds)[number]

export type VisualTheme = {
  id: VisualThemeId
  label: string
  description: string
  audience: string
}

export const visualThemes: VisualTheme[] = [
  {
    id: 'corgi-classic',
    label: 'Corgi classic',
    description: 'Light turquoise stage and signature corgi coach.',
    audience: 'universal',
  },
  {
    id: 'deep-sea',
    label: 'underwater world',
    description: 'Ocean depth, soft light and calm movement of bubbles.',
    audience: 'children and teenagers',
  },
  {
    id: 'space-station',
    label: 'Space station',
    description: 'Dark cabin, cool light and precise instrument accents.',
    audience: 'teenagers',
  },
  {
    id: 'paper-workshop',
    label: 'Paper workshop',
    description: 'Tactile paper, ink and calm educational presentation.',
    audience: 'adults',
  },
  {
    id: 'arcade-city',
    label: 'Arcade city',
    description: 'A contrasting scene with the energy of a modern mobile arcade.',
    audience: 'teenagers and adults',
  },
]

export const defaultVisualThemeId: VisualThemeId = 'corgi-classic'

export function isVisualThemeId(value: unknown): value is VisualThemeId {
  return typeof value === 'string' && visualThemeIds.includes(value as VisualThemeId)
}

export function getVisualThemeId(level: unknown): VisualThemeId {
  if (typeof level !== 'object' || level === null) return defaultVisualThemeId
  const value = (level as { visualThemeId?: unknown }).visualThemeId
  return isVisualThemeId(value) ? value : defaultVisualThemeId
}
