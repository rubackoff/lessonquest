export const avatarSkins = [
  { id: 'hoodie', name: 'Hoodie', description: 'Casual', color: '#10b4bf', secondaryColor: '#34363c', source: '/game-assets/avatars/blocky-hoodie.glb' },
  { id: 'hook', name: 'Hook', description: 'Fantasy', color: '#793a30', secondaryColor: '#6f9439', source: '/game-assets/avatars/blocky-hook.glb' },
  { id: 'phantom', name: 'Phantom', description: 'Tactical', color: '#303137', secondaryColor: '#e0cfad', source: '/game-assets/avatars/blocky-phantom.glb' },
] as const

export type AvatarProfile = { version: 1; skinId: typeof avatarSkins[number]['id'] }
export const defaultAvatarProfile: AvatarProfile = { version: 1, skinId: 'hoodie' }
export const avatarStorageKey = 'corgi.avatar.v1'

export function parseAvatarProfile(raw: string | null): AvatarProfile {
  try {
    const value = JSON.parse(raw ?? 'null')
    if (value?.version === 1) {
      // Preserve old outfit slots when replacing the prototype's character art.
      if (value.skinId === 'explorer') return { version: 1, skinId: 'hoodie' }
      if (['pioneer', 'jacket', 'guardian'].includes(value.skinId)) return { version: 1, skinId: 'hook' }
      if (value.skinId === 'operator') return { version: 1, skinId: 'phantom' }
      if (avatarSkins.some((skin) => skin.id === value.skinId)) return { version: 1, skinId: value.skinId }
    }
  } catch { /* A local profile is optional and may be damaged or unavailable. */ }
  return { ...defaultAvatarProfile }
}
