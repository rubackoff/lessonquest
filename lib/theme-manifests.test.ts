import { describe, expect, it } from 'vitest'
import { THEME_MANIFESTS, resolveThemeManifest } from './theme-manifests'
import { defaultVisualThemeId, visualThemes } from './visual-themes'

describe('theme manifests', () => {
  it('resolves corgi-classic with its existing metadata and procedural background', () => {
    const manifest = resolveThemeManifest('corgi-classic')

    expect(manifest).toBe(THEME_MANIFESTS['corgi-classic'])
    expect(manifest.metadata).toBe(visualThemes.find((theme) => theme.id === 'corgi-classic'))
    expect(manifest.palette.accent).toBe('#0b918d')
    expect(manifest.motion.ambientPreset).toBe('soft-drift')
    expect(manifest.background.assetUrls).toEqual([])
  })

  it('resolves deep-sea with its existing background asset', () => {
    const manifest = resolveThemeManifest('deep-sea')

    expect(manifest).toBe(THEME_MANIFESTS['deep-sea'])
    expect(manifest.metadata).toBe(visualThemes.find((theme) => theme.id === 'deep-sea'))
    expect(manifest.palette.accent).toBe('#2ed6c4')
    expect(manifest.motion.ambientPreset).toBe('bubbles')
    expect(manifest.background.assetUrls).toEqual(['/theme-underwater-v1.png'])
  })

  it.each(['space-station', 'missing-theme', null, undefined, {}])(
    'falls back safely for unsupported value %p',
    (themeId) => {
      expect(resolveThemeManifest(themeId)).toBe(resolveThemeManifest(defaultVisualThemeId))
    },
  )
})
