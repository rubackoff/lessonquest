import { readFileSync } from 'node:fs'
import { Box3, SkinnedMesh, Texture } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { describe, expect, it } from 'vitest'
import { createAvatar, playerAvatarDefinition } from './avatar'
import { avatarSkins } from './profile'

const bounds = (root: ReturnType<typeof createAvatar>['root']) => {
  root.updateMatrixWorld(true)
  root.traverse(object => { if (object instanceof SkinnedMesh) { object.skeleton.update(); object.computeBoundingBox() } })
  return new Box3().setFromObject(root)
}

describe('shared avatar action poses', () => {
  it('keeps the run active after repeated idle/run and pause/resume transitions', async () => {
    const bytes = readFileSync('public/game-assets/avatars/blocky-hoodie.glb')
    const asset = await new GLTFLoader().register(() => ({ name: 'HeadlessTexture', loadTexture: () => Promise.resolve(new Texture()) }))
      .parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
    const actor = createAvatar(asset, playerAvatarDefinition({version:1, skinId:'hoodie'}))
    const thigh = actor.root.getObjectByName('ThighL')!
    for (let repeat = 0; repeat < 4; repeat++) {
      for (let frame = 0; frame < 30; frame++) actor.update(1/60, false, 0)
      for (let frame = 0; frame < 30; frame++) actor.update(1/60, true, 0)
      const before = thigh.quaternion.clone()
      for (let frame = 0; frame < 10; frame++) actor.update(1/60, true, 0)
      expect(before.angleTo(thigh.quaternion)).toBeGreaterThan(.03)
      const paused = thigh.quaternion.clone()
      for (let frame = 0; frame < 10; frame++) actor.update(0, true, 0)
      expect(thigh.quaternion.toArray()).toEqual(paused.toArray())
    }
    actor.dispose()
  })
  for (const skin of avatarSkins) it(`${skin.id}: fits under the beam, stays grounded and does not drift on pause`, async () => {
    const bytes = readFileSync(`public${skin.source}`)
    const asset = await new GLTFLoader().register(() => ({ name: 'HeadlessTexture', loadTexture: () => Promise.resolve(new Texture()) }))
      .parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
    const definition = playerAvatarDefinition({ version: 1, skinId: skin.id }, 2.1)
    const actor = createAvatar(asset, definition), other = createAvatar(asset, definition)
    actor.update(.1, true, Math.PI)
    const original = bounds(actor.root), independent = bounds(other.root)
    actor.update(0, true, Math.PI, definition.runSpeed, { kind: 'slide', progress: .5 })
    const crouched = bounds(actor.root)
    expect(crouched.min.y).toBeCloseTo(0, 5)
    expect(crouched.max.y).toBeLessThan(1.29)
    for (let i = 0; i < 30; i++) actor.update(0, true, Math.PI, definition.runSpeed, { kind: 'slide', progress: .5 })
    expect(bounds(actor.root).min.distanceTo(crouched.min)).toBeLessThan(1e-6)
    expect(bounds(actor.root).max.distanceTo(crouched.max)).toBeLessThan(1e-6)
    expect(bounds(other.root).min.distanceTo(independent.min)).toBeLessThan(1e-6)
    actor.update(0, true, Math.PI)
    expect(bounds(actor.root).max.y).toBeCloseTo(original.max.y, 5)
    actor.dispose(); other.dispose()
  })
})
