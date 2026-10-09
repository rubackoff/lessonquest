import { describe, expect, it } from 'vitest'
import { avatarSkins, defaultAvatarProfile, parseAvatarProfile } from './profile'

describe('portable avatar profile', () => {
  it('round-trips every skin without any maze-specific data', () => {
    for (const skin of avatarSkins) {
      expect(parseAvatarProfile(JSON.stringify({ version: 1, skinId: skin.id }))).toEqual({ version: 1, skinId: skin.id })
    }
  })
  it('migrates old astronaut and casual slots to the three-skin catalogue', () => {
    expect(parseAvatarProfile('{"version":1,"skinId":"explorer"}')).toEqual({ version: 1, skinId: 'hoodie' })
    expect(parseAvatarProfile('{"version":1,"skinId":"pioneer"}')).toEqual({ version: 1, skinId: 'hook' })
    expect(parseAvatarProfile('{"version":1,"skinId":"jacket"}')).toEqual({ version: 1, skinId: 'hook' })
    expect(parseAvatarProfile('{"version":1,"skinId":"guardian"}')).toEqual({ version: 1, skinId: 'hook' })
    expect(parseAvatarProfile('{"version":1,"skinId":"operator"}')).toEqual({ version: 1, skinId: 'phantom' })
    expect(parseAvatarProfile('{"version":1,"skinId":"hoodie"}')).toEqual({ version: 1, skinId: 'hoodie' })
  })
  it('rejects missing, damaged, unknown and future incompatible profiles', () => {
    for (const raw of [null, '{', 'null', '123', '{}', '{"version":2,"skinId":"explorer"}', '{"version":1,"skinId":"unknown"}']) {
      expect(parseAvatarProfile(raw)).toEqual(defaultAvatarProfile)
    }
  })
})
