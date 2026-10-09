// Reference reconstruction experiment: actual generated surface + projection colour.
// Original source PNGs are read, never modified. This is not the accepted final art.
import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { buildCasualAvatar } from './build-casual-avatars.mjs'

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.() }) }
}
const frontPath = 'docs/games/space-maze/avatar-hoodie-apose-v4.png'
const backPath = 'docs/games/space-maze/avatar-hoodie-back-v4.png'
const raw = await readFile('assets/avatars/source/hoodie-hunyuan-shape.glb')
const source = await new GLTFLoader().parseAsync(new Uint8Array(raw).buffer, '')
const surface = source.scene.getObjectByProperty('isMesh', true).geometry
surface.computeBoundingBox()
const originalBounds = surface.boundingBox.clone()
const originalHeight = originalBounds.max.y - originalBounds.min.y
surface.translate(-(originalBounds.max.x + originalBounds.min.x) / 2, -originalBounds.min.y, 0)
surface.scale(2.6 / originalHeight, 2.6 / originalHeight, 2.6 / originalHeight)
// Remove reconstruction grain with volume-preserving Taubin smoothing.
const neighbors = Array.from({ length: surface.attributes.position.count }, () => new Set())
for (let i = 0; i < surface.index.count; i += 3) {
  const a = surface.index.getX(i), b = surface.index.getX(i + 1), c = surface.index.getX(i + 2)
  neighbors[a].add(b).add(c); neighbors[b].add(a).add(c); neighbors[c].add(a).add(b)
}
for (let iteration = 0; iteration < 6; iteration++) for (const amount of [0.4, -0.42]) {
  const values = surface.attributes.position.array, next = values.slice()
  neighbors.forEach((set, i) => {
    if (!set.size) return
    for (let axis = 0; axis < 3; axis++) {
      let sum = 0
      for (const j of set) sum += values[j * 3 + axis]
      next[i * 3 + axis] += amount * (sum / set.size - values[i * 3 + axis])
    }
  })
  values.set(next)
}
surface.computeVertexNormals()

async function projection(filename) {
  const { data, info } = await sharp(filename).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const foreground = new Uint8Array(info.width * info.height)
  // Flood only exterior white pixels; white eyes and shoe panels are NOT background.
  const exterior = new Uint8Array(info.width * info.height)
  const queue = [0]
  exterior[0] = 1
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor], x = index % info.width, y = Math.floor(index / info.width)
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= info.width || ny >= info.height) continue
      const candidate = ny * info.width + nx, o = candidate * 3
      if (!exterior[candidate] && Math.min(data[o], data[o + 1], data[o + 2]) > 210) {
        exterior[candidate] = 1
        queue.push(candidate)
      }
    }
  }
  let left = info.width, right = 0, top = info.height, bottom = 0
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const offset = (y * info.width + x) * 3
    const r = data[offset], g = data[offset + 1], b = data[offset + 2]
    if (!exterior[y * info.width + x] && Math.min(r, g, b) < 249) {
      foreground[y * info.width + x] = 1
      left = Math.min(left, x); right = Math.max(right, x)
      top = Math.min(top, y); bottom = Math.max(bottom, y)
    }
  }
  const pixelScale = (bottom - top) / 2.6
  const center = (left + right) / 2
  return (x, y, reverse = false) => {
    let px = Math.round(center + (reverse ? -x : x) * pixelScale)
    let py = Math.round(bottom - y * pixelScale)
    px = T.MathUtils.clamp(px, 0, info.width - 1)
    py = T.MathUtils.clamp(py, 0, info.height - 1)
    // Silhouette mismatches must not paint the white studio background on the mesh.
    if (!foreground[py * info.width + px]) {
      let best = Infinity, bx = px
      for (let sx = 0; sx < info.width; sx++) {
        const distance = Math.abs(sx - px)
        if (distance >= best) continue
        if (foreground[py * info.width + sx]) { best = distance; bx = sx }
      }
      if (best < Infinity) px = bx
    }
    const offset = (py * info.width + px) * 3
    return new T.Color().setRGB(data[offset] / 255, data[offset + 1] / 255, data[offset + 2] / 255, T.SRGBColorSpace)
  }
}
const front = await projection(frontPath), back = await projection(backPath)
const positions = surface.attributes.position, normals = surface.attributes.normal
const colors = new Float32Array(positions.count * 3)
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i)
  const mix = T.MathUtils.smoothstep(z, -0.055, 0.055)
  const color = back(x, y, true).lerp(front(x, y), mix)
  color.toArray(colors, i * 3)
}
await MeshoptSimplifier.ready
const [indices, error] = MeshoptSimplifier.simplifyWithAttributes(
  new Uint32Array(surface.index.array), positions.array, 3, colors, 3, [0.2, 0.2, 0.2], null, 180000, 0.001,
)

// Compact the buffers after simplification; keep the reference facial colours.
const remap = new Map(), compactPositions = [], compactNormals = [], compactColors = []
const compactIndices = Array.from(indices, (old) => {
  if (!remap.has(old)) {
    remap.set(old, remap.size)
    compactPositions.push(positions.getX(old), positions.getY(old), positions.getZ(old))
    compactNormals.push(normals.getX(old), normals.getY(old), normals.getZ(old))
    compactColors.push(...colors.subarray(old * 3, old * 3 + 3))
  }
  return remap.get(old)
})
const geometry = new T.BufferGeometry()
geometry.setAttribute('position', new T.Float32BufferAttribute(compactPositions, 3))
geometry.setAttribute('normal', new T.Float32BufferAttribute(compactNormals, 3))
geometry.setAttribute('color', new T.Float32BufferAttribute(compactColors, 3))
geometry.setIndex(compactIndices)

const rig = buildCasualAvatar('hoodie')
const previous = rig.scene.getObjectByProperty('isSkinnedMesh', true)
const bones = previous.skeleton.bones
rig.scene.remove(previous)
const ids = Object.fromEntries(bones.map((bone, i) => [bone.name, i]))
const targets = {
  Root: [0, 0, 0], Hips: [0, 1.17, 0], Spine: [0, 1.41, 0], Head: [0, 2.0, 0],
}
for (const s of [-1, 1]) {
  const side = s === -1 ? 'L' : 'R'
  Object.assign(targets, {
    [`Arm${side}`]: [s * 0.285, 1.81, 0], [`Elbow${side}`]: [s * 0.475, 1.53, 0],
    [`Hand${side}`]: [s * 0.635, 1.245, 0], [`Thigh${side}`]: [s * 0.165, 1.17, 0],
    [`Knee${side}`]: [s * 0.235, 0.7, 0], [`Foot${side}`]: [s * 0.32, 0.22, 0.01],
    [`Eye${side}`]: [s * 0.1, 2.24, 0.21],
  })
}
for (const bone of bones) {
  bone.position.fromArray(targets[bone.name])
  if (targets[bone.parent.name]) bone.position.sub(new T.Vector3(...targets[bone.parent.name]))
}
rig.scene.updateMatrixWorld(true)
const skinIndices = new Uint16Array(remap.size * 4), skinWeights = new Float32Array(remap.size * 4)
function weights(i, first, second = first, secondWeight = 0) {
  skinIndices.set([ids[first], ids[second], 0, 0], i * 4)
  skinWeights.set([1 - secondWeight, secondWeight, 0, 0], i * 4)
}
for (let i = 0; i < remap.size; i++) {
  const x = compactPositions[i * 3], y = compactPositions[i * 3 + 1], side = x < 0 ? 'L' : 'R'
  if (y > 1.95) weights(i, 'Head')
  else if (Math.abs(x) > 0.3 && y > 0.96 && y < 1.92) {
    if (y < 1.32) weights(i, `Elbow${side}`, `Hand${side}`, 1 - T.MathUtils.smoothstep(y, 1.225, 1.305))
    else weights(i, `Arm${side}`, `Elbow${side}`, 1 - T.MathUtils.smoothstep(y, 1.43, 1.63))
  } else if (y > 1.17) weights(i, 'Spine', 'Head', T.MathUtils.smoothstep(y, 1.85, 1.96))
  else if (y < 0.3) weights(i, `Knee${side}`, `Foot${side}`, 1 - T.MathUtils.smoothstep(y, 0.20, 0.29))
  else weights(i, `Thigh${side}`, `Knee${side}`, 1 - T.MathUtils.smoothstep(y, 0.58, 0.80))
}
geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(skinIndices, 4))
geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(skinWeights, 4))
const mesh = new T.SkinnedMesh(geometry, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }))
mesh.name = 'ReferenceHoodie'
rig.scene.add(mesh)
mesh.bind(new T.Skeleton(bones))
for (const clip of rig.animations) for (const track of clip.tracks) {
  if (track.name === 'Hips.position') for (let i = 1; i < track.values.length; i += 3) track.values[i] += 0.05
  if (/^Arm[LR]\.quaternion$/.test(track.name)) {
    const sign = track.name.startsWith('ArmL') ? -1 : 1
    const closePose = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), -sign * 0.50)
    for (let i = 0; i < track.values.length; i += 4) new T.Quaternion().fromArray(track.values, i).premultiply(closePose).toArray(track.values, i)
  }
}
const buffer = Buffer.from(await new GLTFExporter().parseAsync(rig.scene, { binary: true, animations: rig.animations }))
await writeFile('public/game-assets/avatars/reference-hoodie.glb', buffer)
console.log(JSON.stringify({ bytes: buffer.length, triangles: indices.length / 3, vertices: remap.size, error }))
