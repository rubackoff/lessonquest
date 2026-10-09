import { describe, expect, it } from 'vitest'
import { AnimationClip, AnimationMixer, Box3, SkinnedMesh, Texture, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createAvatar, playerAvatarDefinition } from '../lib/avatar/avatar.ts'
import { avatarSkins } from '../lib/avatar/profile.ts'

const outfits = ['hoodie', 'hook', 'phantom']
const manifest = JSON.parse(readFileSync('public/game-assets/avatars/blocky-provenance.json', 'utf8'))
// Node has no image canvas. Geometry/animation tests use a texture object;
// the embedded image bytes are checked below and pixels are checked in the browser.
const loadAsset = (data) => new GLTFLoader().register(() => ({
  name: 'HeadlessTexture', loadTexture: () => Promise.resolve(new Texture()),
})).parseAsync(new Uint8Array(data).buffer, '')
const loadShipped = (outfit) => loadAsset(readFileSync(`public/game-assets/avatars/blocky-${outfit}.glb`))
const models = await Promise.all(outfits.map(async (id, index) => ({ ...manifest.files[index], ...await loadShipped(id) })))
const rig = (scene) => {
  const nodes = []
  scene.traverse((node) => { if (node.isBone) nodes.push([node.name, node.parent.name, node.position.toArray()]) })
  return nodes
}

describe('shared v5 character', () => {
  it('uses the pinned free CC0 locomotion source, not a paid library', () => {
    expect(manifest.externalAssets[0].license).toBe('CC0-1.0')
    expect(manifest.externalAssets[0].clips).toEqual({ Idle: 'Idle_Loop', Run: 'Jog_Fwd_Loop' })
    expect(manifest.externalAssets[0].mirror).toContain('e24c23cf2a1323488a3faa226ea7ea21f644b73e')
    for (const [file, hash] of [
      ['AnimationLibrary_Godot_Standard.gltf', '0ff075c7ad6855c5c2c37a171592ee8f0d6ab2f58259e2be77a9b63dd8027765'],
      ['AnimationLibrary_Godot_Standard.bin', '6e65377d81558333c4093dbb144a48fd19019343d82b1a3a7992a98ec0e0543c'],
    ]) expect(createHash('sha256').update(readFileSync(`assets/avatars/quaternius-ual-standard/${file}`)).digest('hex')).toBe(hash)
  })
  it('all three costumes use the same 23-bone hierarchy and bind pose', () => {
    expect(avatarSkins.map((skin) => skin.id)).toEqual(outfits)
    for (const model of models) {
      expect(model.bones).toBe(23)
      expect(rig(model.scene)).toEqual(rig(models[0].scene))
    }
    expect(new Set(manifest.files.map((file) => file.sha256)).size).toBe(3)
  })

  it('preserves the user-approved idle/run keys while changing the surface', () => {
    const approved = JSON.parse(readFileSync('assets/avatars/reference-v5/approved-motion.json', 'utf8'))
    const motion = clips => clips.map(clip => ({ name:clip.name, duration:clip.duration,
      tracks:clip.tracks.map(track => ({ name:track.name, times:[...track.times], values:[...track.values] })) }))
    for (const [index,outfit] of outfits.entries()) {
      expect(motion(models[index].animations), outfit).toEqual(motion(approved.clips[outfit].map(clip => AnimationClip.parse(clip))))
    }
  })

  it('uses matte lighting and flat polygon faces across the whole figure', () => {
    for (const [index,outfit] of outfits.entries()) {
      const mesh = models[index].scene.getObjectByName(`Avatar_${outfit}`), geometry = mesh.geometry
      expect(models[index].triangles, outfit).toBeLessThan(7000)
      expect(mesh.material.isMeshStandardMaterial).toBe(true)
      expect(mesh.material.roughness).toBe(1)
      expect(mesh.material.metalness).toBe(0)
      let maximumDifference = 0, alignmentError = 0
      for (let i = 0; i < geometry.index.count; i += 3) {
        const ids = [0,1,2].map(corner => geometry.index.getX(i + corner))
        const normals = ids.map(id => new Vector3().fromBufferAttribute(geometry.attributes.normal,id))
        maximumDifference = Math.max(maximumDifference,normals[0].distanceTo(normals[1]),normals[0].distanceTo(normals[2]))
        const [a,b,c] = ids.map(id => new Vector3().fromBufferAttribute(geometry.attributes.position,id))
        const face = b.sub(a).cross(c.sub(a))
        if (face.lengthSq() > 1e-12) alignmentError = Math.max(alignmentError,1 - face.normalize().dot(normals[0].normalize()))
      }
      expect(maximumDifference, outfit).toBeLessThan(.0001)
      expect(alignmentError, outfit).toBeLessThan(.001)
    }
  })

  it('the apron stays outside the thighs in both idle and running poses', async () => {
    const { scene, animations } = await loadShipped('hook')
    const mixer = new AnimationMixer(scene)
    const hips = scene.getObjectByName('Hips')
    for (const clip of animations) {
      mixer.stopAllAction()
      mixer.clipAction(clip).reset().play()
      for (let frame = 0; frame < 30; frame++) {
        mixer.update(clip.duration / 30)
        scene.updateMatrixWorld(true)
        for (const side of ['L', 'R']) for (const back of [false, true]) {
          const direction = back ? -1 : 1
          const cloth = scene.getObjectByName(`Cloth${back ? 'Back' : ''}${side}`)
          const thigh = scene.getObjectByName(`Thigh${side}`)
          const clothSurface = hips.worldToLocal(cloth.localToWorld(new Vector3(0, -.32, direction * .02)))
          const legSurface = hips.worldToLocal(thigh.localToWorld(new Vector3(0, -.32, direction * .19)))
          expect(direction * (clothSurface.z - legSurface.z)).toBeGreaterThan(.01)
        }
      }
    }
    mixer.stopAllAction(); mixer.uncacheRoot(scene)
  })

  it('the hook tip keeps its distance from the lower steel edge while running', async () => {
    const { scene, animations } = await loadShipped('hook')
    const mesh = scene.getObjectByName('Avatar_hook'), position = mesh.geometry.attributes.position
    const markers = [new Vector3(-.28,.438,.252), new Vector3(-.571,.377,.273), new Vector3(-.744,.634,.16)]
    const ids = markers.map((marker) => {
      let closest = -1, distance = Infinity
      for (let i = 0; i < position.count; i++) {
        const current = new Vector3().fromBufferAttribute(position,i).distanceTo(marker)
        if (current < distance) { closest = i; distance = current }
      }
      expect(distance).toBeLessThan(.05)
      return closest
    })
    const rest = ids.slice(1).map((id) => new Vector3().fromBufferAttribute(position,ids[0]).distanceTo(new Vector3().fromBufferAttribute(position,id)))
    const mixer = new AnimationMixer(scene)
    for (const clip of animations) {
      mixer.stopAllAction(); mixer.clipAction(clip).play()
      for (let frame = 0; frame < 30; frame++) {
        mixer.setTime(frame * clip.duration / 30); scene.updateMatrixWorld(true); mesh.skeleton.update()
        for (let marker = 1; marker < ids.length; marker++) {
          const distance = mesh.getVertexPosition(ids[0],new Vector3()).distanceTo(mesh.getVertexPosition(ids[marker],new Vector3()))
          expect(distance).toBeCloseTo(rest[marker - 1],3)
        }
      }
    }
    mixer.stopAllAction(); mixer.uncacheRoot(scene)
  })

  it('surface edges stay bounded during running without opening into triangular fans', async () => {
    for (const outfit of outfits) {
      const { scene, animations } = await loadShipped(outfit)
      const mesh = scene.getObjectByName(`Avatar_${outfit}`), geometry = mesh.geometry
      const edges = new Map(), welded = new Map(), vertexIds = [], remap = []
      const { position, skinIndex: joints, skinWeight: weights } = geometry.attributes
      // Flat normals duplicate each polygon corner; equal positions/weights
      // have equal motion and need only one skinning calculation per frame.
      for (let i = 0; i < position.count; i++) {
        const key = [position.getX(i),position.getY(i),position.getZ(i)].join(':') + ':' +
          [0,1,2,3].map(slot => `${joints.getComponent(i,slot)}:${weights.getComponent(i,slot)}`).join(':')
        if (!welded.has(key)) { welded.set(key,vertexIds.length); vertexIds.push(i) }
        remap.push(welded.get(key))
      }
      for (let i = 0; i < geometry.index.count; i += 3) for (let corner = 0; corner < 3; corner++) {
        const a = remap[geometry.index.getX(i + corner)], b = remap[geometry.index.getX(i + (corner + 1) % 3)]
        const length = new Vector3().fromBufferAttribute(position,vertexIds[a])
          .distanceTo(new Vector3().fromBufferAttribute(position,vertexIds[b]))
        edges.set(`${Math.min(a,b)}:${Math.max(a,b)}`, { a,b,rest: length })
      }
      const mixer = new AnimationMixer(scene), clip = animations.find((item) => item.name === 'Run')
      mixer.clipAction(clip).play()
      let longest = 0, growth = 0
      for (let frame = 0; frame < 24; frame++) {
        mixer.setTime(frame * clip.duration / 24); scene.updateMatrixWorld(true); mesh.skeleton.update()
        const vertices = vertexIds.map(id => mesh.getVertexPosition(id,new Vector3()))
        for (const { a,b,rest } of edges.values()) {
          const length = vertices[a].distanceTo(vertices[b])
          if (rest < .05) longest = Math.max(longest, length)
          growth = Math.max(growth, length - rest)
        }
      }
      expect(longest, outfit).toBeLessThan(.45)
      expect(growth, outfit).toBeLessThan(.38)
      mixer.stopAllAction(); mixer.uncacheRoot(scene)
    }
  })

  it('moving volumes stay closed across texture seams and never mix hands with legs or apron', () => {
    for (const outfit of outfits) {
      const mesh = models[outfits.indexOf(outfit)].scene.getObjectByName(`Avatar_${outfit}`)
      const { position, skinIndex: joints, skinWeight: weights } = mesh.geometry.attributes
      const welded = new Map(), ids = [], edges = new Map()
      let mixed = 0
      for (let i = 0; i < position.count; i++) {
        const active = [0,1,2,3].filter(slot => weights.getComponent(i,slot) > 0)
          .map(slot => mesh.skeleton.bones[joints.getComponent(i,slot)].name)
        if (active.some(name => /^(Arm|Elbow|Hand)[LR]$/.test(name)) &&
          active.some(name => /^(Thigh|Knee|Foot)[LR]$/.test(name) || name.startsWith('Cloth'))) mixed++
        if (active.some(name => name.startsWith('Cloth')) && active.some(name => /^(Thigh|Knee|Foot)[LR]$/.test(name))) mixed++
        const key = [position.getX(i),position.getY(i),position.getZ(i)].map(value => value.toFixed(6)).join(':') + ':' +
          [0,1,2,3].map(slot => `${joints.getComponent(i,slot)}:${Math.round(weights.getComponent(i,slot) * 255)}`).join(':')
        if (!welded.has(key)) welded.set(key,welded.size)
        ids.push(welded.get(key))
      }
      for (let i = 0; i < mesh.geometry.index.count; i += 3) for (let corner = 0; corner < 3; corner++) {
        const a = ids[mesh.geometry.index.getX(i + corner)], b = ids[mesh.geometry.index.getX(i + (corner + 1) % 3)]
        if (a === b) continue
        const key = `${Math.min(a,b)}:${Math.max(a,b)}`
        edges.set(key,(edges.get(key) ?? 0) + 1)
      }
      expect(mixed, outfit).toBe(0)
      expect([...edges.values()].filter(count => count === 1).length, outfit).toBe(0)
    }
  })

  it('running keeps the thigh swing below 66 degrees from the standing pose', async () => {
    for (const outfit of outfits) {
      const { scene, animations } = await loadShipped(outfit), mixer = new AnimationMixer(scene)
      mixer.clipAction(animations.find(clip => clip.name === 'Idle')).play(); mixer.setTime(0)
      const thighs = ['ThighL','ThighR'].map(name => scene.getObjectByName(name))
      const standing = thighs.map(bone => bone.quaternion.clone())
      mixer.stopAllAction()
      const clip = animations.find(clip => clip.name === 'Run'); mixer.clipAction(clip).play()
      let maximum = 0
      for (let frame = 0; frame < 60; frame++) {
        mixer.setTime(frame * clip.duration / 60)
        thighs.forEach((bone,index) => { maximum = Math.max(maximum,bone.quaternion.angleTo(standing[index])) })
      }
      expect(maximum, outfit).toBeLessThan(66 * Math.PI / 180)
      mixer.stopAllAction(); mixer.uncacheRoot(scene)
    }
  })

  for (const [index, outfit] of outfits.entries()) {
    it(`${outfit}: the shipped GLB loads in independently animated cabinet/game instances`, async () => {
      const data = readFileSync(`public${avatarSkins[index].source}`)
      const asset = await loadAsset(data)
      const profile = { version: 1, skinId: outfit }
      const definition = playerAvatarDefinition(profile)
      expect(definition.source).toBe(avatarSkins[index].source)
      const first = createAvatar(asset, definition)
      const second = createAvatar(asset, playerAvatarDefinition(profile, 2))
      for (const [actor, height] of [[first, 1.05], [second, 2]]) {
        actor.root.updateMatrixWorld(true)
        expect(new Box3().setFromObject(actor.root).getSize(new Vector3()).y).toBeCloseTo(height, 3)
      }
      const secondKnee = second.root.getObjectByName('KneeL')
      const resting = secondKnee.quaternion.clone()
      first.update(.2, true, Math.PI / 2)
      expect(first.root.getObjectByName('KneeL').quaternion.equals(resting)).toBe(false)
      expect(secondKnee.quaternion.equals(resting)).toBe(true)
      const forward = first.root.rotation.y
      first.update(.02, true, -Math.PI + .1)
      expect(Math.abs(first.root.rotation.y - forward)).toBeLessThan(Math.PI)
      first.dispose()
      second.update(.2, true, 0)
      expect(secondKnee.quaternion.equals(resting)).toBe(false)
      second.dispose()
    })

    it(`${outfit}: gait responds to game speed without owning world position or camera`, async () => {
      const data = readFileSync(`public${avatarSkins[index].source}`)
      const asset = await loadAsset(data)
      const definition = playerAvatarDefinition({ version: 1, skinId: outfit })
      const slow = createAvatar(asset, definition), fast = createAvatar(asset, definition)
      slow.root.position.set(4, 2, 7)
      fast.root.position.copy(slow.root.position)
      for (let i = 0; i < 30; i++) {
        slow.update(1 / 60, true, Math.PI / 3, .8)
        fast.update(1 / 60, true, Math.PI / 3, 3.2)
      }
      expect(slow.root.position.toArray()).toEqual([4, 2, 7])
      expect(fast.root.position.toArray()).toEqual([4, 2, 7])
      expect(slow.root.getObjectByName('KneeL').quaternion.angleTo(fast.root.getObjectByName('KneeL').quaternion)).toBeGreaterThan(.01)
      const phase = fast.root.getObjectByName('KneeL').quaternion.clone()
      fast.update(0, false, 0, 0)
      expect(fast.root.getObjectByName('KneeL').quaternion.angleTo(phase)).toBeLessThan(1e-6)
      slow.dispose(); fast.dispose()
    })

    it(`${outfit}: self-contained mobile asset with valid weights and matching provenance`, () => {
      const model = models[index]
      expect(model.triangles).toBeLessThanOrEqual(18000)
      expect(model.materials).toBe(1)
      let blended = 0, weightError = 0, maximumJoint = 0, minimumUV = Infinity, maximumUV = -Infinity
      model.scene.traverse((node) => {
        if (!(node instanceof SkinnedMesh)) return
        const weights = node.geometry.attributes.skinWeight
        const joints = node.geometry.attributes.skinIndex
        const uv = node.geometry.attributes.uv
        expect(uv.array).toBeInstanceOf(Uint16Array)
        expect(uv.normalized).toBe(true)
        for (let i = 0; i < weights.count; i++) {
          weightError = Math.max(weightError,Math.abs(weights.getX(i) + weights.getY(i) + weights.getZ(i) + weights.getW(i) - 1))
          maximumJoint = Math.max(maximumJoint,joints.getX(i),joints.getY(i),joints.getZ(i),joints.getW(i))
          if (weights.getX(i) > 0 && weights.getY(i) > 0) blended++
          minimumUV = Math.min(minimumUV,uv.getX(i),uv.getY(i))
          maximumUV = Math.max(maximumUV,uv.getX(i),uv.getY(i))
        }
      })
      expect(weightError).toBeLessThan(.000005)
      expect(maximumJoint).toBeLessThan(model.bones)
      expect(minimumUV).toBeGreaterThanOrEqual(0)
      expect(maximumUV).toBeLessThanOrEqual(1)
      expect(blended).toBeGreaterThan(100)
      const data = readFileSync(`public${avatarSkins[index].source}`)
      expect(data.length).toBeLessThan(1_100_000)
      expect(data.toString('utf8', 0, 4)).toBe('glTF')
      expect(data.readUInt32LE(4)).toBe(2)
      expect(data.readUInt32LE(8)).toBe(data.length)
      expect(data.length).toBe(manifest.files[index].bytes)
      expect(createHash('sha256').update(data).digest('hex')).toBe(manifest.files[index].sha256)
      const gltf = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString())
      expect(gltf.animations.map((clip) => clip.name)).toEqual(['Idle', 'Run'])
      expect(gltf.skins).toHaveLength(1)
      expect(gltf.images).toHaveLength(1)
      expect(gltf.images[0].mimeType).toBe('image/jpeg')
      const imageView = gltf.bufferViews[gltf.images[0].bufferView]
      const imageStart = 28 + data.readUInt32LE(12) + imageView.byteOffset
      const embedded = data.subarray(imageStart, imageStart + imageView.byteLength)
      expect(embedded.equals(readFileSync(`assets/avatars/reference-v5/${outfit}-atlas.jpg`))).toBe(true)
      expect(createHash('sha256').update(embedded).digest('hex')).toBe(manifest.files[index].atlasSha256)
      expect(gltf.extensionsUsed ?? []).not.toContain('KHR_materials_unlit')
      expect(createHash('sha256').update(readFileSync(manifest.files[index].sourceFile)).digest('hex')).toBe(manifest.files[index].sourceSha256)
      expect(gltf.buffers.every((buffer) => !buffer.uri)).toBe(true)
    })

    it(`${outfit}: looped idle/run clips keep the root still and bound accessory motion`, async () => {
      const { scene, animations } = await loadShipped(outfit)
      const mixer = new AnimationMixer(scene)
      for (const clip of animations) {
        for (const track of clip.tracks) {
          expect([...track.times, ...track.values].every(Number.isFinite)).toBe(true)
          const stride = track.getValueSize()
          for (let component = 0; component < stride; component++) {
            expect(track.values[component]).toBeCloseTo(track.values[track.values.length - stride + component], 6)
          }
        }
        mixer.stopAllAction()
        mixer.clipAction(clip).reset().play()
        for (let sample = 0; sample < 24; sample++) {
          mixer.update(clip.duration / 24)
          scene.updateMatrixWorld(true)
          scene.traverse((node) => {
            if (node instanceof SkinnedMesh) { node.skeleton.update(); node.computeBoundingBox() }
          })
          const bounds = new Box3().setFromObject(scene)
          const size = bounds.getSize(new Vector3())
          expect(size.y).toBeGreaterThan(2)
          expect(size.y).toBeLessThan(3)
          // The reference's large asymmetric pauldron extends beyond the sleeve.
          expect(size.x).toBeLessThan(outfit === 'hook' ? 1.95 : 1.8)
          expect(bounds.min.y).toBeGreaterThan(-.25)
          expect(scene.getObjectByName('Root').position.toArray()).toEqual([0, 0, 0])
        }
      }
      mixer.stopAllAction()
      mixer.uncacheRoot(scene)
    })

    it(`${outfit}: retargeted soles stay above the floor and return to contact`, async () => {
      const { scene, animations } = await loadShipped(outfit)
      const mesh = scene.getObjectByName(`Avatar_${outfit}`)
      const footIds = mesh.skeleton.bones.map((bone, id) => /^Foot[LR]$/.test(bone.name) ? id : -1).filter((id) => id >= 0)
      const position = mesh.geometry.attributes.position, joints = mesh.geometry.attributes.skinIndex
      mesh.geometry.computeBoundingBox()
      const soleLimit = mesh.geometry.boundingBox.min.y + .018
      const sole = Array.from({ length: position.count }, (_, id) => id).filter((id) => position.getY(id) < soleLimit && footIds.includes(joints.getX(id)))
      expect(sole.length).toBeGreaterThanOrEqual(8)
      const mixer = new AnimationMixer(scene), vertex = new Vector3()
      for (const clip of animations) {
        mixer.stopAllAction()
        mixer.clipAction(clip).reset().play()
        let contactFrames = 0
        for (let i = 0; i < 60; i++) {
          mixer.update(clip.duration / 60)
          scene.updateMatrixWorld(true)
          mesh.skeleton.update()
          const minimum = Math.min(...sole.map((id) => mesh.getVertexPosition(id, vertex).y))
          expect(minimum).toBeGreaterThan(-.01)
          expect(minimum).toBeLessThan(clip.name === 'Idle' ? .045 : .18)
          if (minimum < .045) contactFrames++
        }
        expect(contactFrames).toBeGreaterThan(clip.name === 'Idle' ? 50 : 8)
      }
      mixer.stopAllAction(); mixer.uncacheRoot(scene)
    })
  }
})
