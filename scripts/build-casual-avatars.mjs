// Original, reproducible character modelling source. No downloaded model or paid API.
// Geometry is authored in the bind pose, then exported as an animated, skinned GLB.
import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const v = (p) => new T.Vector3(...p)

// A tailored cross-section loft: x/z radii, centre, and a rounded-square exponent.
function loft(rings, segments = 24, exponent = 1) {
  // Interpolate the garment profile so elbows and shoulders are tailored curves,
  // not the straight cones produced by connecting a few cross-sections.
  const profile = []
  for (let i = 0; i < rings.length - 1; i++) for (let step = 0; step < 3; step++) {
    const t = step / 3
    profile.push(Array.from({ length: 5 }, (_, field) => {
      const a = rings[Math.max(0, i - 1)][field] ?? 0, b = rings[i][field] ?? 0
      const c = rings[i + 1][field] ?? 0, d = rings[Math.min(rings.length - 1, i + 2)][field] ?? 0
      if (field === 0) return T.MathUtils.lerp(b, c, t)
      const value = 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)
      return field < 3 ? Math.max(0.001, value) : value
    }))
  }
  profile.push(rings.at(-1))
  rings = profile
  const positions = [], indices = []
  rings.forEach(([y, rx, rz, cx = 0, cz = 0]) => {
    for (let j = 0; j <= segments; j++) {
      const a = j / segments * Math.PI * 2
      const c = Math.cos(a), s = Math.sin(a)
      positions.push(cx + rx * Math.sign(c) * Math.abs(c) ** exponent, y, cz + rz * Math.sign(s) * Math.abs(s) ** exponent)
    }
  })
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < segments; j++) {
    const a = i * (segments + 1) + j, b = a + segments + 1
    indices.push(a, b, a + 1, b, b + 1, a + 1)
  }
  const geometry = new T.BufferGeometry()
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function swept(points, radius, flatten = 1, tapered = false) {
  const curve = new T.CatmullRomCurve3(points.map(v))
  const geometry = new T.TubeGeometry(curve, 16, radius, 8, false)
  if (tapered || flatten !== 1) {
    const p = geometry.attributes.position, frames = curve.computeFrenetFrames(16, false)
    for (let i = 0; i <= 16; i++) {
      const center = curve.getPointAt(i / 16)
      const taper = tapered ? Math.max(0.025, Math.sin(Math.PI * (0.09 + i / 16 * 0.91)) ** 0.65) : 1
      for (let j = 0; j <= 8; j++) {
        const a = j / 8 * Math.PI * 2
        const point = center.clone().addScaledVector(frames.normals[i], -Math.cos(a) * radius * taper)
          .addScaledVector(frames.binormals[i], Math.sin(a) * radius * taper * flatten)
        p.setXYZ(i * 9 + j, point.x, point.y, point.z)
      }
    }
    geometry.computeVertexNormals()
  }
  return geometry
}

export function buildCasualAvatar(outfit) {
  if (!['hoodie', 'jacket'].includes(outfit)) throw new Error('Unknown outfit')
  const jacket = outfit === 'jacket'
  const scene = new T.Group()
  scene.name = 'CasualAvatar'
  const bones = [], boneIds = {}, rest = {}
  function bone(name, parent, position) {
    const item = new T.Bone()
    item.name = name
    rest[name] = v(position)
    item.position.copy(rest[name])
    if (parent) item.position.sub(rest[parent])
    ;(parent ? bones[boneIds[parent]] : scene).add(item)
    boneIds[name] = bones.length
    bones.push(item)
    return item
  }
  bone('Root', null, [0, 0, 0])
  bone('Hips', 'Root', [0, 1.12, 0])
  bone('Spine', 'Hips', [0, 1.23, 0])
  bone('Head', 'Spine', [0, 1.87, 0])
  for (const s of [-1, 1]) {
    const side = s === -1 ? 'L' : 'R'
    bone(`Arm${side}`, 'Spine', [s * 0.375, 1.69, 0])
    bone(`Elbow${side}`, `Arm${side}`, [s * 0.47, 1.32, 0])
    bone(`Hand${side}`, `Elbow${side}`, [s * 0.505, 1.025, 0])
    bone(`Thigh${side}`, 'Hips', [s * 0.17, 1.12, 0])
    bone(`Knee${side}`, `Thigh${side}`, [s * 0.18, 0.68, 0])
    bone(`Foot${side}`, `Knee${side}`, [s * 0.185, 0.24, 0])
    bone(`Eye${side}`, 'Head', [s * 0.124, 2.185, 0.269])
  }
  const colors = {
    skin: '#d58c62', inner: '#b86a4c', hair: '#503023', hairLight: '#65402c',
    white: '#f8f6ef', iris: '#68402b', ink: '#241b1a',
    top: jacket ? '#eadbc3' : '#169da7', trim: jacket ? '#a34e35' : '#117e88',
    sleeve: jacket ? '#c87350' : '#169da7', trousers: jacket ? '#c4aa84' : '#353a40',
    shoeAccent: jacket ? '#baa07b' : '#168f9b',
  }
  const materials = Object.fromEntries(Object.entries(colors).map(([name, color]) => {
    const material = new T.MeshStandardMaterial({ color, roughness: name === 'iris' ? 0.32 : 0.82 })
    material.name = name
    return [name, material]
  }))
  const pieces = Object.fromEntries(Object.keys(colors).map((key) => [key, []]))
  function add(geometry, material, joint, blend) {
    geometry.deleteAttribute('uv')
    const count = geometry.attributes.position.count
    const indices = new Uint16Array(count * 4), weights = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      const weight = blend ? blend(geometry.attributes.position.getY(i)) : 0
      indices[i * 4] = boneIds[joint]
      indices[i * 4 + 1] = boneIds[blend?.joint ?? joint]
      weights[i * 4] = 1 - weight
      weights[i * 4 + 1] = weight
    }
    geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(indices, 4))
    geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4))
    pieces[material].push(geometry.index ? geometry : mergeVertices(geometry))
  }
  function ellipsoid(position, scale, material, joint, rotation = [0, 0, 0], segments = 20) {
    const g = new T.SphereGeometry(1, segments, Math.max(12, segments / 2))
    g.scale(...scale)
    g.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...rotation)))
    g.translate(...position)
    add(g, material, joint)
  }
  function rounded(position, size, radius, material, joint) {
    const g = mergeVertices(new RoundedBoxGeometry(...size, 2, radius))
    g.translate(...position)
    add(g, material, joint)
  }
  function line(points, radius, material, joint) { add(swept(points, radius), material, joint) }
  function blendAt(joint, y, range) {
    return Object.assign((height) => 1 - T.MathUtils.smoothstep(height, y - range, y + range), { joint })
  }

  // Face: shaped jaw/cheeks instead of a sphere with a flat decal.
  const face = new T.SphereGeometry(1, 40, 28)
  const fp = face.attributes.position
  for (let i = 0; i < fp.count; i++) {
    const x = fp.getX(i), y = fp.getY(i), z = fp.getZ(i)
    const jaw = y < -0.15 ? 1 - (-y - 0.15) * 0.1 : 1
    const cheek = 1 + 0.08 * Math.exp(-(((y + 0.22) / 0.24) ** 2))
    fp.setXYZ(i, x * 0.335 * jaw * cheek, 2.155 + y * 0.355, z * 0.285 + (z > 0 ? 0.014 * (1 - y * y) : 0))
  }
  face.computeVertexNormals()
  add(face, 'skin', 'Head')
  ellipsoid([0, 1.855, 0], [0.10, 0.15, 0.095], 'skin', 'Head')
  for (const s of [-1, 1]) {
    const side = s === -1 ? 'L' : 'R'
    ellipsoid([s * 0.323, 2.14, 0], [0.079, 0.11, 0.055], 'skin', 'Head')
    ellipsoid([s * 0.35, 2.141, 0.039], [0.033, 0.058, 0.014], 'inner', 'Head')
    ellipsoid([s * 0.124, 2.18, 0.273], [0.079, 0.087, 0.028], 'white', `Eye${side}`)
    ellipsoid([s * 0.119, 2.177, 0.298], [0.05, 0.063, 0.015], 'iris', `Eye${side}`)
    ellipsoid([s * 0.116, 2.18, 0.309], [0.030, 0.045, 0.009], 'ink', `Eye${side}`)
    ellipsoid([s * 0.116 - 0.014, 2.204, 0.317], [0.012, 0.015, 0.006], 'white', `Eye${side}`, [0, 0, 0], 16)
    line([[s * 0.205, 2.291, 0.255], [s * 0.132, 2.315, 0.281], [s * 0.059, 2.296, 0.278]], 0.016, 'hair', 'Head')
  }
  ellipsoid([0, 2.09, 0.308], [0.047, 0.049, 0.046], 'skin', 'Head')
  line([[-0.085, 2.014, 0.258], [-0.04, 1.998, 0.277], [0.018, 1.997, 0.28], [0.08, 2.012, 0.26]], 0.007, 'inner', 'Head')

  // Hair cap with a variable hairline: high forehead and low nape.
  const hp = [], hi = [], columns = 40, rows = 16
  for (let i = 0; i <= rows; i++) for (let j = 0; j <= columns; j++) {
    const azimuth = j / columns * Math.PI * 2
    const front = Math.max(0, Math.sin(azimuth))
    const theta = i / rows * (2.13 - 1.06 * front)
    hp.push(0.352 * Math.sin(theta) * Math.cos(azimuth), 2.17 + 0.4 * Math.cos(theta), 0.302 * Math.sin(theta) * Math.sin(azimuth) - 0.016)
    if (i < rows && j < columns) { const a = i * (columns + 1) + j, b = a + columns + 1; hi.push(a, a + 1, b, a + 1, b + 1, b) }
  }
  const cap = new T.BufferGeometry()
  cap.setAttribute('position', new T.Float32BufferAttribute(hp, 3)); cap.setIndex(hi); cap.computeVertexNormals()
  add(cap, 'hair', 'Head')
  const locks = [
    [[0.23, 2.38, 0.17], [0.14, 2.57, 0.18], [-0.04, 2.56, 0.23], [-0.24, 2.40, 0.25]],
    [[0.18, 2.45, 0.02], [0.06, 2.62, 0.05], [-0.15, 2.58, 0.10], [-0.33, 2.47, 0.08]],
    [[0.19, 2.43, -0.11], [0.01, 2.61, -0.10], [-0.18, 2.57, -0.09], [-0.32, 2.45, -0.1]],
    [[0.20, 2.36, 0.22], [0.10, 2.46, 0.28], [-0.03, 2.40, 0.33], [-0.18, 2.32, 0.285]],
    [[-0.06, 2.42, 0.28], [-0.19, 2.44, 0.28], [-0.30, 2.33, 0.20], [-0.32, 2.22, 0.13]],
    [[0.22, 2.43, 0.12], [0.32, 2.39, 0.12], [0.34, 2.28, 0.11], [0.31, 2.20, 0.08]],
    [[0.21, 2.45, -0.11], [0.29, 2.43, -0.1], [0.34, 2.35, -0.1], [0.32, 2.26, -0.15]],
  ]
  locks.forEach((points, index) => {
    const attached = points.map(([x, y, z]) => [x, y > 2.45 ? y - 0.055 : y, z])
    add(swept(attached, index < 3 ? 0.1 : 0.075, 0.85, true), index % 3 === 0 ? 'hairLight' : 'hair', 'Head')
  })

  // Tailored torso with broad, quiet folds and a separate ribbed waistband.
  add(loft([[1.045, 0.01, 0.01], [1.065, 0.275, 0.18], [1.13, 0.305, 0.207], [1.25, 0.321, 0.216], [1.43, 0.325, 0.22], [1.59, 0.33, 0.205], [1.70, 0.29, 0.18], [1.77, 0.16, 0.12], [1.785, 0.10, 0.08]], 32, 0.82), 'top', 'Spine')
  add(loft([[1.05, 0.28, 0.185], [1.065, 0.287, 0.193], [1.12, 0.292, 0.198], [1.13, 0.28, 0.19]], 32, 0.82), 'trim', 'Spine')
  if (jacket) {
    rounded([0, 1.56, 0.211], [0.125, 0.36, 0.035], 0.017, 'white', 'Spine')
    line([[0, 1.12, 0.207], [0, 1.34, 0.226], [0, 1.58, 0.226], [0, 1.745, 0.145]], 0.009, 'trim', 'Spine')
    rounded([0.006, 1.52, 0.245], [0.021, 0.045, 0.012], 0.006, 'white', 'Spine')
    for (const s of [-1, 1]) {
      line([[s * 0.13, 1.74, 0.145], [s * 0.125, 1.79, 0.02], [s * 0.10, 1.76, -0.08]], 0.043, 'trim', 'Spine')
      line([[s * 0.12, 1.22, 0.218], [s * 0.21, 1.34, 0.201]], 0.014, 'trim', 'Spine')
    }
  } else {
    ellipsoid([0, 1.70, -0.163], [0.245, 0.19, 0.16], 'trim', 'Spine')
    ellipsoid([0, 1.72, -0.168], [0.23, 0.178, 0.15], 'top', 'Spine')
    for (const s of [-1, 1]) {
      line([[s * 0.085, 1.76, 0.105], [s * 0.19, 1.745, 0.047], [s * 0.23, 1.73, -0.07]], 0.061, 'top', 'Spine')
      line([[s * 0.085, 1.705, 0.172], [s * 0.10, 1.61, 0.231], [s * 0.10, 1.50, 0.239]], 0.008, 'white', 'Spine')
      ellipsoid([s * 0.10, 1.49, 0.238], [0.012, 0.023, 0.012], 'trim', 'Spine', [0, 0, 0], 12)
    }
    rounded([0, 1.27, 0.219], [0.365, 0.19, 0.033], 0.05, 'top', 'Spine')
    for (const s of [-1, 1]) line([[s * 0.176, 1.22, 0.238], [s * 0.152, 1.31, 0.241]], 0.008, 'trim', 'Spine')
  }

  for (const s of [-1, 1]) {
    const side = s === -1 ? 'L' : 'R'
    const arm = `Arm${side}`, elbow = `Elbow${side}`, hand = `Hand${side}`
    add(loft([[1.005, 0.085, 0.084, s * 0.506], [1.06, 0.108, 0.102, s * 0.50], [1.14, 0.124, 0.119, s * 0.493], [1.27, 0.113, 0.112, s * 0.476], [1.34, 0.121, 0.118, s * 0.463], [1.49, 0.141, 0.138, s * 0.422], [1.62, 0.145, 0.145, s * 0.375], [1.72, 0.105, 0.10, s * 0.35], [1.745, 0.02, 0.02, s * 0.34]], 20), 'sleeve', arm, blendAt(elbow, 1.32, 0.15))
    add(loft([[1.003, 0.082, 0.08, s * 0.506], [1.013, 0.087, 0.085, s * 0.506], [1.075, 0.094, 0.089, s * 0.501]], 20), 'trim', elbow)
    ellipsoid([s * 0.516, 0.937, 0.005], [0.092, 0.127, 0.07], 'skin', hand)
    ellipsoid([s * 0.457, 0.943, 0.055], [0.04, 0.067, 0.04], 'skin', hand, [0, 0, s * -0.4], 16)
    // Four restrained finger ends; the palm remains one clean silhouette.
    for (let finger = 0; finger < 4; finger++) {
      ellipsoid([s * (0.46 + finger * 0.032), 0.866 + Math.abs(finger - 1.5) * 0.009, 0.018], [0.022, 0.036, 0.041], 'skin', hand, [0, 0, 0], 12)
    }
    const thigh = `Thigh${side}`, knee = `Knee${side}`, foot = `Foot${side}`
    add(loft([[0.23, 0.11, 0.12, s * 0.185], [0.28, 0.125, 0.133, s * 0.185], [0.36, 0.133, 0.14, s * 0.184], [0.48, 0.119, 0.135, s * 0.183], [0.64, 0.127, 0.143, s * 0.18], [0.73, 0.137, 0.151, s * 0.178], [0.88, 0.149, 0.157, s * 0.17], [1.05, 0.152, 0.168, s * 0.16], [1.13, 0.142, 0.16, s * 0.155], [1.15, 0.01, 0.01, s * 0.155]], 24, 0.9), 'trousers', thigh, blendAt(knee, 0.68, 0.18))
    if (jacket) {
      rounded([s * 0.294, 0.855, 0.09], [0.048, 0.195, 0.155], 0.02, 'trousers', thigh)
      rounded([s * 0.301, 0.931, 0.094], [0.052, 0.045, 0.162], 0.01, 'top', thigh)
    }
    // Broad sneaker last, heel, toe cap, contrasting outsole and three lace straps.
    rounded([s * 0.185, 0.06, 0.064], [0.27, 0.10, 0.43], 0.047, 'shoeAccent', foot)
    rounded([s * 0.185, 0.117, 0.073], [0.275, 0.065, 0.433], 0.028, 'white', foot)
    add(loft([[0.13, 0.125, 0.192, s * 0.185, 0.071], [0.16, 0.129, 0.198, s * 0.185, 0.071], [0.215, 0.119, 0.185, s * 0.185, 0.062], [0.255, 0.099, 0.14, s * 0.185, 0.019], [0.295, 0.085, 0.098, s * 0.185, -0.009], [0.32, 0.065, 0.07, s * 0.185, -0.016]], 24, 0.78), 'white', foot)
    rounded([s * 0.185, 0.215, -0.119], [0.205, 0.095, 0.035], 0.015, 'shoeAccent', foot)
    for (let i = 0; i < 3; i++) line([[s * 0.185 - 0.07, 0.258 - i * 0.012, 0.025 + i * 0.047], [s * 0.185, 0.282 - i * 0.016, 0.025 + i * 0.047], [s * 0.185 + 0.07, 0.258 - i * 0.012, 0.025 + i * 0.047]], 0.013, 'white', foot)
    ellipsoid([s * 0.297, 0.206, 0.065], [0.017, 0.037, 0.075], 'shoeAccent', foot, [0, 0, -s * 0.3], 16)
  }

  scene.updateMatrixWorld(true)
  const skeleton = new T.Skeleton(bones)
  const geometries = [], usedMaterials = []
  for (const [name, list] of Object.entries(pieces)) {
    if (!list.length) continue
    const merged = mergeGeometries(list)
    geometries.push(merged)
    usedMaterials.push(materials[name])
  }
  const geometry = mergeGeometries(geometries, true)
  const body = new T.SkinnedMesh(geometry, usedMaterials)
  body.name = `Body_${outfit}`
  scene.add(body)
  body.bind(skeleton)
  body.castShadow = true
  body.receiveShadow = true

  function animation(name, duration, running) {
    const times = Array.from({ length: 49 }, (_, i) => duration * i / 48)
    const tracks = []
    function rotate(joint, fn) {
      const values = times.flatMap((time) => new T.Quaternion().setFromEuler(new T.Euler(...fn(time / duration * Math.PI * 2))).toArray())
      tracks.push(new T.QuaternionKeyframeTrack(`${joint}.quaternion`, times, values))
    }
    const hip = bones[boneIds.Hips].position
    tracks.push(new T.VectorKeyframeTrack('Hips.position', times, times.flatMap((time) => {
      const a = time / duration * Math.PI * 2
      return [hip.x, hip.y + (running ? 0.028 + 0.032 * Math.cos(a * 2) : 0.009 * Math.sin(a)), hip.z]
    })))
    rotate('Spine', (a) => [running ? 0.09 : 0.006 * Math.sin(a), running ? 0.075 * Math.sin(a) : 0.015 * Math.sin(a), 0])
    rotate('Head', (a) => [running ? -0.06 : 0.012 * Math.sin(a), running ? -0.05 * Math.sin(a) : -0.025 * Math.sin(a), 0])
    for (const s of [-1, 1]) {
      const side = s === -1 ? 'L' : 'R'
      rotate(`Arm${side}`, (a) => [running ? s * 0.63 * Math.sin(a) : 0.025 * Math.sin(a + s), 0, s * (running ? -0.045 : 0.015)])
      rotate(`Elbow${side}`, (a) => [running ? -0.95 + s * 0.16 * Math.cos(a) : -0.08, 0, 0])
      rotate(`Hand${side}`, () => [0, 0, 0])
      rotate(`Thigh${side}`, (a) => [running ? -s * 0.65 * Math.sin(a) : 0, 0, 0])
      rotate(`Knee${side}`, (a) => [running ? 0.12 + Math.max(0, s * Math.sin(a)) * 1.05 : 0.015, 0, 0])
      rotate(`Foot${side}`, (a) => [running ? -0.1 - Math.max(0, s * Math.sin(a)) * 0.25 : -0.015, 0, 0])
      tracks.push(new T.VectorKeyframeTrack(`Eye${side}.scale`, [0, duration * 0.77, duration * 0.795, duration * 0.82, duration], [1, 1, 1, 1, 1, 1, 1, 0.08, 1, 1, 1, 1, 1, 1, 1]))
    }
    return new T.AnimationClip(name, duration, tracks)
  }
  const animations = [animation('Idle', 3.2, false), animation('Run', 0.72, true)]
  return { scene, animations, triangles: geometry.index.count / 3, materials: usedMaterials.length, bones: bones.length }
}

async function exportAvatars() {
  // GLTFExporter uses FileReader for its in-memory binary assembly, not browser IO.
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) { blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.() }) }
  }
  const destination = path.resolve('public/game-assets/avatars')
  await mkdir(destination, { recursive: true })
  const files = []
  for (const outfit of ['hoodie', 'jacket']) {
    const model = buildCasualAvatar(outfit)
    const buffer = Buffer.from(await new GLTFExporter().parseAsync(model.scene, { binary: true, animations: model.animations }))
    const file = `casual-${outfit}.glb`
    await writeFile(path.join(destination, file), buffer)
    files.push({ file, bytes: buffer.length, triangles: model.triangles, materials: model.materials, bones: model.bones, sha256: createHash('sha256').update(buffer).digest('hex') })
  }
  await writeFile(path.join(destination, 'provenance.json'), JSON.stringify({
    source: 'Original geometry authored locally in scripts/build-casual-avatars.mjs',
    reference: 'docs/games/space-maze/avatar-outfits-v3.png',
    animation: 'Original shared skeletal Idle and Run, in-place',
    externalAssets: [], files,
  }, null, 2) + '\n')
  console.log(JSON.stringify(files, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await exportAvatars()
