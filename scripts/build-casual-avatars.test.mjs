import { describe, expect, it } from 'vitest'
import { AnimationMixer, Box3, SkinnedMesh, Vector3 } from 'three'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { buildCasualAvatar } from './build-casual-avatars.mjs'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { characterDefinition, createAvatar } from '../lib/avatar/space-avatar.ts'

const models = ['hoodie', 'jacket'].map(buildCasualAvatar)
const manifest = JSON.parse(readFileSync('public/game-assets/avatars/provenance.json', 'utf8'))

describe('original casual avatar assets', () => {
  it('uses the same bone names, hierarchy and bind pose for both outfits', () => {
    const rig = (model) => {
      const nodes = []
      model.scene.traverse((node) => { if (node.isBone) nodes.push([node.name, node.parent.name, node.position.toArray()]) })
      return nodes
    }
    expect(rig(models[0])).toEqual(rig(models[1]))
    expect(models[0].bones).toBe(18)
  })
  it('has different clothing geometry, not just a recolored model', () => {
    expect(models[0].triangles).not.toBe(models[1].triangles)
    expect(manifest.files[0].sha256).not.toBe(manifest.files[1].sha256)
  })
  for (const [index, outfit] of ['hoodie', 'jacket'].entries()) {
    it(`${outfit}: exported GLB works with the actual game loader and independent animation instances`, async () => {
      const data = readFileSync(`public/game-assets/avatars/casual-${outfit}.glb`)
      const asset = await new GLTFLoader().parseAsync(new Uint8Array(data).buffer, '')
      const first = createAvatar(asset, characterDefinition)
      const second = createAvatar(asset, characterDefinition)
      first.root.updateMatrixWorld(true)
      const height = new Box3().setFromObject(first.root).getSize(new Vector3()).y
      expect(height).toBeCloseTo(characterDefinition.height, 3)
      expect(first.root.getObjectByName('Head')).not.toBe(second.root.getObjectByName('Head'))
      const unchanged = second.root.getObjectByName('KneeL').quaternion.clone()
      first.update(0.2, true, Math.PI / 2)
      expect(first.root.getObjectByName('KneeL').quaternion.equals(unchanged)).toBe(false)
      expect(second.root.getObjectByName('KneeL').quaternion.equals(unchanged)).toBe(true)
      first.update(0.2, false, 0)
      first.dispose()
      second.dispose()
    })
    it(`${outfit}: valid normalized weights and bounded mobile asset size`, () => {
      const model = models[index]
      expect(model.triangles).toBeLessThan(40000)
      model.scene.traverse((node) => {
        if (!(node instanceof SkinnedMesh)) return
        const weights = node.geometry.attributes.skinWeight
        const joints = node.geometry.attributes.skinIndex
        for (let i = 0; i < weights.count; i++) {
          expect(weights.getX(i) + weights.getY(i) + weights.getZ(i) + weights.getW(i)).toBeCloseTo(1, 5)
          expect(Math.max(joints.getX(i), joints.getY(i), joints.getZ(i), joints.getW(i))).toBeLessThan(model.bones)
        }
      })
      const data = readFileSync(`public/game-assets/avatars/casual-${outfit}.glb`)
      expect(data.length).toBeLessThan(1_500_000)
      expect(data.toString('utf8', 0, 4)).toBe('glTF')
      expect(data.readUInt32LE(4)).toBe(2)
      expect(data.readUInt32LE(8)).toBe(data.length)
      expect(createHash('sha256').update(data).digest('hex')).toBe(manifest.files[index].sha256)
      const gltf = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString())
      expect(gltf.animations.map((clip) => clip.name)).toEqual(['Idle', 'Run'])
      expect(gltf.skins).toHaveLength(1)
      expect(gltf.images).toBeUndefined()
      expect(gltf.buffers.every((buffer) => !buffer.uri)).toBe(true)
    })
    it(`${outfit}: Idle and Run are looped skeletal clips without root motion`, () => {
      const { scene, animations } = buildCasualAvatar(outfit)
      const mixer = new AnimationMixer(scene)
      for (const clip of animations) {
        for (const track of clip.tracks) {
          const stride = track.getValueSize()
          for (let component = 0; component < stride; component++) {
            expect(track.values[component]).toBeCloseTo(track.values[track.values.length - stride + component], 6)
          }
        }
        mixer.stopAllAction()
        mixer.clipAction(clip).reset().play()
        for (let sample = 0; sample < 12; sample++) {
          mixer.update(clip.duration / 12)
          scene.updateMatrixWorld(true)
          scene.traverse((node) => {
            if (node instanceof SkinnedMesh) { node.skeleton.update(); node.computeBoundingBox() }
          })
          const bounds = new Box3().setFromObject(scene)
          const size = bounds.getSize(new Vector3())
          expect(size.y).toBeGreaterThan(2)
          expect(size.y).toBeLessThan(3.3)
          expect(size.x).toBeLessThan(1.7)
          expect(bounds.min.y).toBeGreaterThan(-0.25)
          expect(scene.getObjectByName('Root').position.toArray()).toEqual([0, 0, 0])
        }
      }
      mixer.stopAllAction()
      mixer.uncacheRoot(scene)
    })
  }
})
