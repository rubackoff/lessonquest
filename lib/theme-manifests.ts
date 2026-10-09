import {
  defaultVisualThemeId,
  visualThemes,
  type VisualTheme,
  type VisualThemeId,
} from './visual-themes'

export const themeManifestIds = ['corgi-classic', 'deep-sea'] as const satisfies readonly VisualThemeId[]

export type ThemeManifestId = (typeof themeManifestIds)[number]

export type ThemeManifest = Readonly<{
  id: ThemeManifestId
  metadata: VisualTheme
  palette: Readonly<{
    background: string
    floor: string
    grid: string
    panel: string
    panelBorder: string
    panelInk: string
    surface: string
    surfaceInk: string
    copy: string
    accent: string
    accentAlt: string
    success: string
    danger: string
    warning: string
    shadow: string
  }>
  motion: Readonly<{
    ambientPreset: 'soft-drift' | 'bubbles'
    ambientSpeed: number
    feedbackDurationMs: number
  }>
  background: Readonly<{
    assetUrls: readonly string[]
  }>
}>

function getThemeMetadata(id: ThemeManifestId): VisualTheme {
  const metadata = visualThemes.find((theme) => theme.id === id)
  if (!metadata) throw new Error(`Missing visual theme metadata for "${id}".`)
  return metadata
}

export const THEME_MANIFESTS = {
  'corgi-classic': {
    id: 'corgi-classic',
    metadata: getThemeMetadata('corgi-classic'),
    palette: {
      background: '#f3fafb',
      floor: 'rgba(213, 238, 241, 0.46)',
      grid: 'rgba(44, 126, 139, 0.14)',
      panel: 'rgba(255, 255, 255, 0.9)',
      panelBorder: 'rgba(31, 105, 122, 0.2)',
      panelInk: '#172033',
      surface: '#f8fcfd',
      surfaceInk: '#172033',
      copy: '#607085',
      accent: '#0b918d',
      accentAlt: '#ef8b55',
      success: '#24945a',
      danger: '#d94a4e',
      warning: '#d88a25',
      shadow: 'rgba(31, 105, 122, 0.18)',
    },
    motion: {
      ambientPreset: 'soft-drift',
      ambientSpeed: 1,
      feedbackDurationMs: 420,
    },
    background: {
      assetUrls: [],
    },
  },
  'deep-sea': {
    id: 'deep-sea',
    metadata: getThemeMetadata('deep-sea'),
    palette: {
      background: '#062b3a',
      floor: 'rgba(1, 47, 62, 0.28)',
      grid: 'rgba(171, 243, 239, 0.18)',
      panel: 'rgba(4, 48, 65, 0.88)',
      panelBorder: 'rgba(122, 231, 222, 0.42)',
      panelInk: '#f2feff',
      surface: 'rgba(247, 254, 253, 0.95)',
      surfaceInk: '#103143',
      copy: '#bde7eb',
      accent: '#2ed6c4',
      accentAlt: '#73cdf7',
      success: '#72d998',
      danger: '#ff7e79',
      warning: '#ffd064',
      shadow: 'rgba(0, 21, 31, 0.3)',
    },
    motion: {
      ambientPreset: 'bubbles',
      ambientSpeed: 0.72,
      feedbackDurationMs: 480,
    },
    background: {
      assetUrls: ['/theme-underwater-v1.png'],
    },
  },
} as const satisfies Record<ThemeManifestId, ThemeManifest>

function isThemeManifestId(value: unknown): value is ThemeManifestId {
  return themeManifestIds.some((id) => id === value)
}

const fallbackThemeManifestId: ThemeManifestId = isThemeManifestId(defaultVisualThemeId)
  ? defaultVisualThemeId
  : 'corgi-classic'

export function resolveThemeManifest(themeId: unknown): ThemeManifest {
  return isThemeManifestId(themeId)
    ? THEME_MANIFESTS[themeId]
    : THEME_MANIFESTS[fallbackThemeManifestId]
}
