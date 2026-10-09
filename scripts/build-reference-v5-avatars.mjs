// Reconstruct the approved v5 meshes; keep the procedural draft as a fallback.
import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { buildBlockyAvatar, outfits, embedMaterialAtlas } from './build-blocky-avatars.mjs'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { createHoodieBackpackGeometry } from './reference-v5-backpack.mjs'
import { bakeReferenceAtlas } from './bake-reference-v5-atlas.mjs'
import { separateAvatarParts } from './separate-avatar-parts.mjs'

async function projection(filename, direction = 'front') {
  const { data, info } = await sharp(filename).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const outside = new Uint8Array(width * height), queue = new Int32Array(width * height)
  // Remove connected white background, preserving enclosed teeth and cream gear.
  const background = (at) => {
    const offset = at * channels
    const min = Math.min(data[offset], data[offset + 1], data[offset + 2])
    const max = Math.max(data[offset], data[offset + 1], data[offset + 2])
    return min > 220 && max - min < 24
  }
  let tail = 0
  const add = (at) => { if (!outside[at] && background(at)) { outside[at] = 1; queue[tail++] = at } }
  for (let x = 0; x < width; x++) { add(x); add((height - 1) * width + x) }
  for (let y = 0; y < height; y++) { add(y * width); add(y * width + width - 1) }
  for (let cursor = 0; cursor < tail; cursor++) {
    const at = queue[cursor], x = at % width, y = Math.floor(at / width)
    if (x > 0) add(at - 1)
    if (x < width - 1) add(at + 1)
    if (y > 0) add(at - width)
    if (y < height - 1) add(at + width)
  }
  // Discard the antialiased white fringe before searching for surface colours.
  for (let pass = 0; pass < 2; pass++) {
    const eroded = outside.slice()
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      const at = y * width + x
      if (outside[at - 1] || outside[at + 1] || outside[at - width] || outside[at + width]) eroded[at] = 1
    }
    outside.set(eroded)
  }
  // Nearest foreground fills the exterior without painting white borders on sides.
  const nearest = new Int32Array(outside.length).fill(-1)
  let length = 0
  for (let at = 0; at < outside.length; at++) if (!outside[at]) { nearest[at] = at; queue[length++] = at }
  for (let cursor = 0; cursor < length; cursor++) {
    const at = queue[cursor], x = at % width, y = Math.floor(at / width)
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      const next = ny * width + nx
      if (nearest[next] < 0) { nearest[next] = nearest[at]; queue[length++] = next }
    }
  }
  const padded = Buffer.alloc(width * height * 3)
  for (let at = 0; at < nearest.length; at++) for (let channel = 0; channel < 3; channel++) padded[at * 3 + channel] = data[nearest[at] * channels + channel]
  const horizontal = (x, z) => direction === 'back' ? -x : direction === 'left' ? z : direction === 'right' ? -z : x
  const rgb = (x,y,z) => {
    // The painted sheets preserve our actual 1.866 × 2.8 orthographic frame.
    const px = T.MathUtils.clamp(Math.round((.933 + horizontal(x, z)) / 1.866 * width), 0, width - 1)
    const py = T.MathUtils.clamp(Math.round((2.67 - y) / 2.8 * height), 0, height - 1)
    const offset = (py * width + px) * 3
    return [padded[offset],padded[offset + 1],padded[offset + 2]]
  }
  return { rgb, sample: (x,y,z) => { const colour = rgb(x,y,z); return new T.Color().setRGB(colour[0] / 255,colour[1] / 255,colour[2] / 255,T.SRGBColorSpace) } }
}

export async function buildReferenceV5Avatar(outfit) {
  const sourceFile = `assets/avatars/source/${outfit}-hunyuan-v5-shape.glb`
  const raw = await readFile(sourceFile)
  const asset = await new GLTFLoader().parseAsync(new Uint8Array(raw).buffer, '')
  let surface = asset.scene.getObjectByProperty('isMesh', true).geometry.clone()
  surface.computeBoundingBox()
  const height = surface.boundingBox.max.y - surface.boundingBox.min.y
  surface.translate(0, -surface.boundingBox.min.y, 0)
  surface.scale(2.6 / height, 2.6 / height, 2.6 / height)
  let left = Infinity, right = -Infinity
  let positions = surface.attributes.position
  for (let i = 0; i < positions.count; i++) if (positions.getY(i) > 1.98) {
    left = Math.min(left, positions.getX(i)); right = Math.max(right, positions.getX(i))
  }
  surface.translate(-(left + right) / 2, 0, 0)
  if (outfit === 'hoodie') {
    surface = mergeGeometries([surface, createHoodieBackpackGeometry()])
    positions = surface.attributes.position
  }
  const views = await Promise.all(['front', 'back', 'left', 'right'].map((view) => projection(`assets/avatars/reference-v5/${outfit}-painted-${view}.png`, view)))
  const chooseView = (nx, ny, nz, z) => Math.abs(ny) > Math.max(Math.abs(nx), Math.abs(nz)) ? (z < 0 ? 1 : 0)
    : Math.abs(nx) > Math.abs(nz) ? (nx < 0 ? 2 : 3) : (nz < 0 ? 1 : 0)
  surface.computeVertexNormals()
  const normals = surface.attributes.normal
  const originalColors = new Float32Array(positions.count * 3)
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i)
    const view = chooseView(normals.getX(i), normals.getY(i), normals.getZ(i), z)
    const color = views[view].sample(x, y, z)
    color.toArray(originalColors, i * 3)
  }
  await MeshoptSimplifier.ready
  const [simplified, error] = MeshoptSimplifier.simplifyWithAttributes(new Uint32Array(surface.index.array), positions.array, 3,
    originalColors, 3, [.15, .15, .15], null, 18000, .02)
  const remap = new Map(), compact = [], sourceVertices = [], indices = []
  for (let triangle = 0; triangle < simplified.length; triangle += 3) {
    for (let corner = 0; corner < 3; corner++) {
      const old = simplified[triangle + corner], key = old
      if (!remap.has(key)) {
        remap.set(key, remap.size)
        sourceVertices.push(old)
        compact.push(positions.getX(old), positions.getY(old), positions.getZ(old))
      }
      indices.push(remap.get(key))
    }
  }
  let geometry = new T.BufferGeometry()
  geometry.setAttribute('position', new T.Float32BufferAttribute(compact, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  const rig = buildBlockyAvatar(outfit)
  rig.scene.remove(rig.scene.getObjectByProperty('isSkinnedMesh', true))
  const bones = []; rig.scene.traverse((node) => { if (node.isBone) bones.push(node) })
  const ids = Object.fromEntries(bones.map((node, id) => [node.name, id]))
  const rest = { Root: [0, 0, 0], Hips: [0, 1.18, 0], Spine: [0, 1.34, 0], Head: [0, 1.87, 0], Accessory: [-.43, 1.15, .30] }
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R'
    Object.assign(rest, {
      [`Arm${side}`]: [s * .40, 1.72, 0], [`Elbow${side}`]: [s * .51, 1.35, 0], [`Hand${side}`]: [s * .60, .98, 0],
      [`Thigh${side}`]: [s * .18, 1.18, 0], [`Knee${side}`]: [s * .255, .68, 0], [`Foot${side}`]: [s * .33, .22, 0],
      [`Eye${side}`]: [s * .12, 2.17, .254], [`Cloth${side}`]: [s * .145, 1.18, .24], [`ClothBack${side}`]: [s * .145, 1.18, -.24],
    })
  }
  for (const bone of bones) {
    bone.position.fromArray(rest[bone.name]); bone.quaternion.identity()
    if (rest[bone.parent.name]) bone.position.sub(new T.Vector3(...rest[bone.parent.name]))
  }
  rig.scene.updateMatrixWorld(true)
  const skinIndices = new Uint8Array(remap.size * 4), weights = new Uint8Array(remap.size * 4)
  const pair = (first, second, blend) => [[first, 1 - blend], [second, blend]]
  const mix = (first, second, amount) => [...first.map(([name, value]) => [name, value * (1 - amount)]), ...second.map(([name, value]) => [name, value * amount])]
  const assign = (i, influences) => {
    const combined = new Map()
    for (const [name, value] of influences) combined.set(name, (combined.get(name) ?? 0) + value)
    const ranked = [...combined].filter(([, value]) => value > .001).sort((a, b) => b[1] - a[1]).slice(0, 4)
    const sum = ranked.reduce((total, [, value]) => total + value, 0)
    const bytes = ranked.map(([, value]) => Math.round(value / sum * 255))
    bytes[0] += 255 - bytes.reduce((total, value) => total + value, 0)
    ranked.forEach(([name], at) => { skinIndices[i * 4 + at] = ids[name]; weights[i * 4 + at] = bytes[at] })
  }
  for (let i = 0; i < remap.size; i++) {
    const x = compact[i * 3], y = compact[i * 3 + 1], z = compact[i * 3 + 2], side = x < 0 ? 'L' : 'R'
    let influence = y > 1.78 ? pair('Spine', 'Head', T.MathUtils.smoothstep(y, 1.78, 1.96))
      : y > 1.20 ? pair('Hips', 'Spine', T.MathUtils.smoothstep(y, 1.20, 1.42))
      : y > .93 ? pair(`Thigh${side}`, 'Hips', T.MathUtils.smoothstep(y, .99, 1.18))
      : y < .31 ? pair(`Knee${side}`, `Foot${side}`, 1 - T.MathUtils.smoothstep(y, .24, .32))
      : pair(`Thigh${side}`, `Knee${side}`, 1 - T.MathUtils.smoothstep(y, .57, .79))
    const pelvisAmount = (1 - T.MathUtils.smoothstep(Math.abs(x), .08, .27)) * T.MathUtils.smoothstep(y, .70, 1.10)
    influence = mix(influence, [['Hips', 1]], pelvisAmount)
    const armBoundary = T.MathUtils.lerp(.52, .38, T.MathUtils.smoothstep(y, .90, 1.12))
      - .03 * T.MathUtils.smoothstep(y, 1.20, 1.55)
    const armAmount = T.MathUtils.smoothstep(Math.abs(x), armBoundary - .035, armBoundary + .035)
      * T.MathUtils.smoothstep(y, .78, .83) * (1 - T.MathUtils.smoothstep(y, 1.82, 1.96))
    const arm = y < 1.20 ? pair(`Elbow${side}`, `Hand${side}`, 1 - T.MathUtils.smoothstep(y, .99, 1.15))
      : pair(`Arm${side}`, `Elbow${side}`, 1 - T.MathUtils.smoothstep(y, 1.26, 1.44))
    influence = mix(influence, arm, armAmount)
    const colour = originalColors.subarray(sourceVertices[i] * 3, sourceVertices[i] * 3 + 3)
    const bareHand = outfit === 'hoodie' && colour[0] > .30 && colour[0] > colour[1] * 1.4 && colour[1] > colour[2] * 1.3
    const darkGlove = outfit === 'phantom' && Math.max(...colour) < .14
    if (y > .82 && y < 1.15 && Math.abs(x) > (bareHand ? .30 : .40) && (bareHand || darkGlove)) influence = [[`Hand${side}`, 1]]
    if (outfit === 'hoodie' && z < -.29 && y > 1.14 && y < 1.76 && Math.abs(x) < .26) influence = [['Spine', 1]]
    if (outfit === 'hook') {
      const clothAmount = T.MathUtils.smoothstep(Math.abs(z), z < 0 ? .13 : .20, z < 0 ? .17 : .235) * T.MathUtils.smoothstep(y, .30, .36)
        * (1 - T.MathUtils.smoothstep(y, 1.09, 1.23)) * (1 - T.MathUtils.smoothstep(Math.abs(x), .35, .43))
      const cloth = pair(`Cloth${z < 0 ? 'Back' : ''}L`, `Cloth${z < 0 ? 'Back' : ''}R`, T.MathUtils.smoothstep(x, -.35, .35))
      influence = mix(influence, cloth, clothAmount)
      const accessoryBoundary = T.MathUtils.lerp(.29, .43, T.MathUtils.smoothstep(y, .55, .72))
      const accessoryAmount = T.MathUtils.smoothstep(-x, accessoryBoundary, accessoryBoundary + .025) * T.MathUtils.smoothstep(z, .18, .23)
        * T.MathUtils.smoothstep(y, .29, .34) * (1 - T.MathUtils.smoothstep(y, .95, 1.08))
      influence = mix(influence, [['Accessory', 1]], accessoryAmount)
    }
    assign(i, influence)
  }
  if (outfit === 'hook') {
    // Diffuse weights across the connected surface while pinning the interiors
    // of limbs and equipment. This keeps contact seams continuous in motion.
    const neighbours = Array.from({length:remap.size}, () => new Set())
    for (let i = 0; i < indices.length; i += 3) for (let corner = 0; corner < 3; corner++) {
      const a = indices[i + corner], b = indices[i + (corner + 1) % 3]
      neighbours[a].add(b); neighbours[b].add(a)
    }
    const coincident = new Map()
    for (let i = 0; i < remap.size; i++) {
      const key = compact.slice(i * 3, i * 3 + 3).join(':')
      if (coincident.has(key)) { const other = coincident.get(key); neighbours[i].add(other); neighbours[other].add(i) }
      else coincident.set(key, i)
    }
    const pinned = compact.filter((_, i) => i % 3 === 0).map((x, i) => {
      const y = compact[i * 3 + 1], z = compact[i * 3 + 2]
      return y > 1.97 || y < .22 || y > 1.3 && Math.abs(x) < .3
        || y > 1.05 && y < 1.75 && Math.abs(x) > .52
        || y > .4 && y < 1.05 && Math.abs(x) < .3 && Math.abs(z) > .30
        || y > .34 && y < .9 && x < -.55
        || y > .35 && y < .8 && Math.abs(x) > .17 && Math.abs(x) < .33 && Math.abs(z) < .13
    })
    let field = new Float32Array(remap.size * bones.length)
    for (let i = 0; i < remap.size; i++) for (let slot = 0; slot < 4; slot++) field[i * bones.length + skinIndices[i * 4 + slot]] += weights[i * 4 + slot] / 255
    for (let pass = 0; pass < 400; pass++) {
      const next = field.slice()
      for (let i = 0; i < remap.size; i++) if (!pinned[i] && neighbours[i].size) {
        for (let bone = 0; bone < bones.length; bone++) {
          let sum = 0
          for (const neighbour of neighbours[i]) sum += field[neighbour * bones.length + bone]
          next[i * bones.length + bone] = field[i * bones.length + bone] * .5 + sum / neighbours[i].size * .5
        }
      }
      field = next
    }
    skinIndices.fill(0); weights.fill(0)
    for (let i = 0; i < remap.size; i++) assign(i, bones.map((bone, id) => [bone.name, field[i * bones.length + id]]))
    // Steel links and the hook must stay rigid after weight diffusion. Otherwise
    // the inner edge of the C-shaped hook follows the apron and opens into a fan.
    for (let i = 0; i < remap.size; i++) {
      const x = compact[i * 3], y = compact[i * 3 + 1], z = compact[i * 3 + 2]
      const [r,g,b] = originalColors.subarray(sourceVertices[i] * 3, sourceVertices[i] * 3 + 3)
      const steel = Math.min(r,g,b) > .045 && Math.max(r,g,b) - Math.min(r,g,b) < .12
      const frontal = views[0].sample(x,y,z)
      const ring = x < -.14 && y > .32 && y < .88 && z > .08 && Math.min(frontal.r,frontal.g,frontal.b) > .025
        && Math.max(frontal.r,frontal.g,frontal.b) - Math.min(frontal.r,frontal.g,frontal.b) < .18
      const ferrule = y > .74 && y < .97 && x < -.38 && z > .25 && r > .20 && g > .10 && r < g * 2.4 && b < g * .4
      if (ring || x < -.20 && y > .32 && y < 1.4 && z > .18 && (steel || ferrule)) {
        skinIndices.fill(0, i * 4, i * 4 + 4); weights.fill(0, i * 4, i * 4 + 4)
        assign(i, [['Accessory', 1]])
      }
    }
  }
  geometry.setAttribute('skinIndex', new T.Uint8BufferAttribute(skinIndices, 4))
  geometry.setAttribute('skinWeight', new T.Uint8BufferAttribute(weights, 4, true))
  geometry = separateAvatarParts(geometry, bones, outfit)
  const partClosure = geometry.userData.partClosure
  const baked = await bakeReferenceAtlas(geometry, views), atlas = baked.atlas
  geometry = baked.geometry
  // Keep the painted details and the approved gait. Refine the upper silhouette
  // after baking; feet and leg vertices retain their original positions.
  const shaped = geometry.attributes.position
  for (let i = 0; i < shaped.count; i++) {
    const x = shaped.getX(i), y = shaped.getY(i), z = shaped.getZ(i)
    const head = T.MathUtils.smoothstep(y, 1.84, 1.98)
    const waist = T.MathUtils.smoothstep(y, 1.17, 1.32) * (1 - T.MathUtils.smoothstep(y, 1.40, 1.68))
      * (1 - T.MathUtils.smoothstep(Math.abs(x), .28, .38))
    const py = y + Math.max(0, y - 1.70) * .12 * T.MathUtils.smoothstep(y, 1.70, 1.90)
    // Preserve the previous head contour and only shorten it slightly above the neck.
    shaped.setXYZ(i, x * (1 - .06 * head - .06 * waist), py - Math.max(0, py - 1.98) * .04, z)
  }
  shaped.needsUpdate = true
  // Broad polygon faces carry real lighting instead of smoothing every fold
  // into a cylindrical surface. Keep an index for the shared runtime/tests.
  geometry = geometry.toNonIndexed()
  geometry.computeVertexNormals()
  geometry.setAttribute('normal', new T.Int16BufferAttribute(
    Array.from(geometry.attributes.normal.array, value => Math.round(T.MathUtils.clamp(value, -1, 1) * 32767)), 3, true))
  geometry.setIndex(Array.from({length:geometry.attributes.position.count}, (_, i) => i))
  const mesh = new T.SkinnedMesh(geometry, new T.MeshStandardMaterial({roughness:1,metalness:0}))
  mesh.material.name = 'V5PaintedMaterial'
  mesh.name = `Avatar_${outfit}`
  rig.scene.add(mesh); mesh.bind(new T.Skeleton(bones))
  mesh.castShadow = true; mesh.receiveShadow = true
  const approvedMotion = JSON.parse(await readFile('assets/avatars/reference-v5/approved-motion.json', 'utf8'))
  const animations = approvedMotion.clips[outfit].map(clip => T.AnimationClip.parse(clip))
  return { scene: rig.scene, animations, triangles: geometry.index.count / 3,
    vertices: geometry.attributes.position.count, bones: bones.length, materials: 1, error, partClosure, atlas, atlasSha256:createHash('sha256').update(atlas).digest('hex'), sourceFile, sourceSha256: createHash('sha256').update(raw).digest('hex') }
}

async function exportModels() {
  globalThis.FileReader = class { readAsArrayBuffer(blob) { blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.() }) } }
  const candidate = process.argv.includes('--candidate')
  const destination = candidate ? 'output/avatar-reference-v5' : 'public/game-assets/avatars'
  await mkdir(destination, {recursive:true})
  const files = []
  for (const id of outfits) {
    const model = await buildReferenceV5Avatar(id)
    const geometry = Buffer.from(await new GLTFExporter().parseAsync(model.scene, {binary:true, animations:model.animations}))
    const data = embedMaterialAtlas(geometry, model.atlas, 'image/jpeg')
    const file = `blocky-${id}.glb`
    await writeFile(path.join(destination,file),data)
    const {scene,animations,atlas,...metadata} = model
    await writeFile(path.join(candidate ? destination : 'assets/avatars/reference-v5', `${id}-atlas.jpg`), atlas)
    files.push({id,file,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),...metadata})
    console.log(JSON.stringify(files.at(-1)))
  }
  await writeFile(path.join(destination, candidate ? 'provenance.json' : 'blocky-provenance.json'), JSON.stringify({
    reference: 'docs/games/shared-avatar/three-skins-v5.png', date: '2026-10-06',
    source: 'scripts/build-reference-v5-avatars.mjs',
    reconstruction: 'Saved Tencent Hunyuan3D-2.1 shape outputs; closed faceted meshes, slightly shortened heads, refined upper silhouette, authored hoodie backpack and shared 23-bone weights',
    materials: { source: 'Built-in Image Gen front/back/left/right surface painting, preserving orthographic renders of the actual meshes',
      directory: 'assets/avatars/reference-v5', encoding: 'One embedded 1024x1024 JPEG per skin (quality 80, 4:2:0); xatlas UV charts with four-view surface painting; matte PBR with flat face normals' },
    animation: 'Preserved user-approved offline CC0 Idle/Run retarget; assets/avatars/reference-v5/approved-motion.json; stationary Root, apron and chain secondary motion, actual sole contact correction',
    externalAssets: [
      { author: 'Quaternius', title: 'Universal Animation Library — free Standard, 2025-06 mirror', license: 'CC0-1.0',
        official: 'https://quaternius.com/packs/universalanimationlibrary.html',
        mirror: 'https://github.com/J-Ponzo/gltf-universal-animation-library/tree/e24c23cf2a1323488a3faa226ea7ea21f644b73e',
        sourceDirectory: 'assets/avatars/quaternius-ual-standard', clips: { Idle: 'Idle_Loop', Run: 'Jog_Fwd_Loop' } },
      { author: 'Tencent', title: 'Hunyuan3D-2.1 shape generation', license: 'Tencent Hunyuan3D-2.1 Community License',
        official: 'https://huggingface.co/spaces/tencent/Hunyuan3D-2.1', sourceDirectory: 'assets/avatars/source',
        parameters: {seed:1234,steps:30,guidance:5,octreeResolution:256,chunks:8000} },
    ], files,
  }, null, 2) + '\n')
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await exportModels()
