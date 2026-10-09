// Authored soft-blocky GLB models. The image reference is not used as a flat sprite.
import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { retargetAvatarMotion } from './quaternius-avatar-motion.mjs'

export const outfits = ['hoodie', 'hook', 'phantom']

export function buildBlockyAvatar(outfit) {
  if (!outfits.includes(outfit)) throw new Error('Unknown outfit')
  const fantasy = outfit === 'hook', tactical = outfit === 'phantom'
  const scene = new T.Group()
  scene.name = 'SharedBlockyAvatar'
  const bones = [], ids = {}, rest = {}
  function bone(name, parent, position) {
    const node = new T.Bone()
    node.name = name
    rest[name] = new T.Vector3(...position)
    node.position.copy(rest[name])
    if (parent) node.position.sub(rest[parent])
    ;(parent ? bones[ids[parent]] : scene).add(node)
    ids[name] = bones.length
    bones.push(node)
  }
  bone('Root', null, [0, 0, 0])
  bone('Hips', 'Root', [0, 1.12, 0])
  bone('Spine', 'Hips', [0, 1.24, 0])
  bone('Head', 'Spine', [0, 1.87, 0])
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R'
    bone(`Arm${side}`, 'Spine', [s * .385, 1.69, 0])
    bone(`Elbow${side}`, `Arm${side}`, [s * .465, 1.335, 0])
    bone(`Hand${side}`, `Elbow${side}`, [s * .505, 1.025, 0])
    bone(`Thigh${side}`, 'Hips', [s * .175, 1.12, 0])
    bone(`Knee${side}`, `Thigh${side}`, [s * .18, .68, 0])
    bone(`Foot${side}`, `Knee${side}`, [s * .185, .22, 0])
    bone(`Eye${side}`, 'Head', [s * .12, 1.87 + .30 * .88, .254])
    bone(`Cloth${side}`, 'Hips', [s * .145, 1.12, .23])
    bone(`ClothBack${side}`, 'Hips', [s * .145, 1.12, -.23])
  }
  bone('Accessory', 'Hips', [-.43, 1.15, .30])
  const c = {
    skin: '#ff9f75', hair: fantasy ? '#3b6625' : '#713821', hairLight: fantasy ? '#7aab43' : '#a9542c', ink: '#251a17',
    white: '#f4f1e8', charcoal: '#34363c', sole: '#e5e2d9', teal: '#10b4bf',
    top: fantasy ? '#793a30' : tactical ? '#303137' : '#0fb5be',
    trim: fantasy ? '#592c26' : tactical ? '#565344' : '#1298a3',
    trousers: '#34363c', leather: '#67482e', steel: '#858c8e', gold: '#b38b4b',
    ivory: '#f0dfc2', sand: '#a38f71', glove: '#353a38',
  }
  const materials = {
    matte: new T.MeshStandardMaterial({ vertexColors: true, roughness: .76 }),
    metal: new T.MeshStandardMaterial({ vertexColors: true, roughness: .49, metalness: .35 }),
    face: new T.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
  }
  Object.entries(materials).forEach(([name, material]) => { material.name = name })
  const pieces = { matte: [], metal: [], face: [] }
  function add(geometry, color, joint, finish = 'matte', blend = null, faceted = false) {
    // Skin and hair stay clean; the reference uses broad planes, not fabric grain.
    if (color === 'skin') finish = 'face'
    if (joint === 'Head' || joint.startsWith('Eye')) geometry.translate(0, -1.87, 0).scale(1, .88, 1).translate(0, 1.87, 0)
    geometry = geometry.index ? geometry : mergeVertices(geometry)
    const count = geometry.attributes.position.count
    const colorValue = new T.Color(c[color] ?? color)
    const colors = new Uint8Array(count * 3)
    const uv = new Uint16Array(count * 2)
    const tile = finish === 'face' ? 0 : color === 'skin' ? 11 : /hair/i.test(color) ? 0
      : color === 'steel' || color === 'gold' ? 5 : color === 'leather' ? 4
        : color === 'glove' ? 13 : color === 'trousers' ? 0
          : color === 'top' || color === 'trim' ? fantasy ? 2 : 0
            : color === 'ivory' ? joint === 'Head' || joint.startsWith('Arm') ? 10 : fantasy ? 3 : joint === 'Spine' ? 6 : 10
              : color === 'sand' ? 0 : color === 'charcoal' ? 0
                : color === 'white' && joint.startsWith('Foot') ? 14 : 0
    geometry.computeBoundingBox()
    const size = geometry.boundingBox.getSize(new T.Vector3())
    const minimum = geometry.boundingBox.min
    const texturePosition = geometry.attributes.position, normal = geometry.attributes.normal
    const nativeUv = geometry.attributes.uv
    const uvBounds = [Infinity, Infinity, -Infinity, -Infinity]
    if (nativeUv) for (let i = 0; i < count; i++) {
      uvBounds[0] = Math.min(uvBounds[0], nativeUv.getX(i)); uvBounds[1] = Math.min(uvBounds[1], nativeUv.getY(i))
      uvBounds[2] = Math.max(uvBounds[2], nativeUv.getX(i)); uvBounds[3] = Math.max(uvBounds[3], nativeUv.getY(i))
    }
    const indices = new Uint8Array(count * 4), weights = new Uint8Array(count * 4)
    for (let i = 0; i < count; i++) {
      const shade = faceted ? 1 + .09 * Math.sin(Math.floor(i / 3) * 12.9898) : 1
      for (const [channel, value] of [colorValue.r, colorValue.g, colorValue.b].entries()) colors[i * 3 + channel] = Math.round(T.MathUtils.clamp(value * shade, 0, 1) * 255)
      const nx = Math.abs(normal.getX(i)), ny = Math.abs(normal.getY(i)), nz = Math.abs(normal.getZ(i))
      const cap = ny > Math.max(nx, nz)
      const horizontal = !cap && nx > nz ? 'Z' : 'X', vertical = cap ? 'Z' : 'Y'
      const u = nativeUv ? (nativeUv.getX(i) - uvBounds[0]) / Math.max(.001, uvBounds[2] - uvBounds[0])
        : (texturePosition[`get${horizontal}`](i) - minimum[horizontal.toLowerCase()]) / Math.max(.001, size[horizontal.toLowerCase()])
      const v = nativeUv ? (nativeUv.getY(i) - uvBounds[1]) / Math.max(.001, uvBounds[3] - uvBounds[1])
        : (texturePosition[`get${vertical}`](i) - minimum[vertical.toLowerCase()]) / Math.max(.001, size[vertical.toLowerCase()])
      // Inset each atlas tile so mip filtering cannot bleed neighbouring materials.
      uv[i * 2] = Math.round((tile % 4 + .025 + u * .95) / 4 * 65535)
      uv[i * 2 + 1] = Math.round((Math.floor(tile / 4) + .975 - v * .95) / 4 * 65535)
      indices[i * 4] = ids[joint]
      weights[i * 4] = 255
      if (blend) {
        const weight = Math.round((1 - T.MathUtils.smoothstep(geometry.attributes.position.getY(i), blend.min, blend.max)) * 255)
        indices[i * 4 + 1] = ids[blend.joint]
        weights[i * 4] = 255 - weight
        weights[i * 4 + 1] = weight
      }
    }
    geometry.setAttribute('color', new T.Uint8BufferAttribute(colors, 3, true))
    geometry.setAttribute('uv', new T.Uint16BufferAttribute(uv, 2, true))
    geometry.setAttribute('skinIndex', new T.Uint8BufferAttribute(indices, 4))
    geometry.setAttribute('skinWeight', new T.Uint8BufferAttribute(weights, 4, true))
    pieces[finish].push(geometry)
    return geometry
  }
  function transform(geometry, position, rotation = [0, 0, 0]) {
    geometry.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...rotation)))
    geometry.translate(...position)
    return geometry
  }
  function box(position, size, color, joint, radius = .018, rotation = [0, 0, 0], finish = 'matte', segments = 1) {
    const geometry = mergeVertices(new RoundedBoxGeometry(...size, segments, Math.min(radius, Math.min(...size) / 2)))
    add(transform(geometry, position, rotation), color, joint, finish)
  }
  function plate(points, depth, position, color, joint, rotation = [0, 0, 0], finish = 'matte', bevel = .008, holes = []) {
    const shape = new T.Shape(points.map(([x, y]) => new T.Vector2(x, y)))
    holes.forEach((points) => shape.holes.push(new T.Path(points.map(([x, y]) => new T.Vector2(x, y)))))
    const geometry = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, steps: 1, curveSegments: 1 })
    geometry.translate(0, 0, -depth / 2)
    return add(transform(geometry, position, rotation), color, joint, finish)
  }
  function line(points, radius, color, joint) {
    const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p)))
    add(new T.TubeGeometry(curve, 12, radius, 6, false), color, joint, color === 'ink' ? 'face' : 'matte')
  }
  function ring(position, size, color, joint, rotation = [0, 0, 0]) {
    const geometry = new T.TorusGeometry(1, .24, 6, 12)
    geometry.scale(...size)
    add(transform(geometry, position, rotation), color, joint, 'metal')
  }
  function stud(position, joint, size = .014) {
    const geometry = new T.CylinderGeometry(size, size, .012, 8)
    add(transform(geometry, position, [Math.PI / 2, 0, 0]), 'gold', joint, 'metal')
  }
  function seam(points, joint, color = 'trim') {
    const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p)))
    add(new T.TubeGeometry(curve, 2, .004, 4, false), color, joint)
  }
  function buckle(position, size, joint, angle = 0) {
    const [w, h] = size
    plate([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], .022, position, 'gold', joint, [0, 0, angle], 'metal', .005,
      [[[-w / 2 + .021, -h / 2 + .02], [-w / 2 + .021, h / 2 - .02], [w / 2 - .021, h / 2 - .02], [w / 2 - .021, -h / 2 + .02]]])
    box(position, [.018, h * .66, .033], 'gold', joint, .004, [0, 0, angle], 'metal')
  }
  // Canvas wraps around the legs instead of hanging as a rigid extruded rectangle.
  function apronPanel(points, position, joint, back = false) {
    const positions = [], indices = [], columns = 4, rows = 5
    const direction = back ? -1 : 1
    for (const face of [-1, 1]) for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
      const u = column / columns, v = row / rows
      const left = new T.Vector2(...points[0]).lerp(new T.Vector2(...points[1]), v)
      const right = new T.Vector2(...points[3]).lerp(new T.Vector2(...points[2]), v)
      const point = left.lerp(right, u)
      const x = position[0] + point.x
      const drape = -.33 * x * x + .014 * Math.sin(u * Math.PI * 2) * (1 - v)
      positions.push(x, position[1] + point.y, position[2] + direction * drape + face * .015)
    }
    const count = (columns + 1) * (rows + 1)
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column, b = a + 1, c = a + columns + 1, d = c + 1
      indices.push(a, c, b, b, c, d, a + count, b + count, c + count, b + count, d + count, c + count)
    }
    const edge = (a, b) => indices.push(a, b, a + count, b, b + count, a + count)
    for (let column = 0; column < columns; column++) {
      edge(column, column + 1)
      edge(rows * (columns + 1) + column + 1, rows * (columns + 1) + column)
    }
    for (let row = 0; row < rows; row++) {
      edge((row + 1) * (columns + 1), row * (columns + 1))
      edge(row * (columns + 1) + columns, (row + 1) * (columns + 1) + columns)
    }
    const geometry = new T.BufferGeometry()
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    add(geometry, 'ivory', joint)
  }
  // Rounded-square sections with staggered folds, not stacked rigid cuboids.
  function garment(rings, joint, color, blend = null) {
    const positions = [], indices = [], uv = []
    const segments = 12
    for (const [index, [y, rx, rz, cx = 0, cz = 0]] of rings.entries()) {
      for (let side = 0; side <= segments; side++) {
        const angle = side / segments * Math.PI * 2 + Math.sin(index * 2.1) * .035
        const cos = Math.cos(angle), sin = Math.sin(angle)
        const fold = index > 0 && index < rings.length - 1 ? Math.sin(side * 2.3 + index * 1.9) : 0
        positions.push(cx + (rx + .009 * fold) * Math.sign(cos) * Math.abs(cos) ** .65,
          y + .012 * fold, cz + (rz + .009 * fold) * Math.sign(sin) * Math.abs(sin) ** .65)
        uv.push(side / segments, index / (rings.length - 1))
      }
    }
    for (let ring = 0; ring < rings.length - 1; ring++) for (let j = 0; j < segments; j++) {
      const a = ring * (segments + 1) + j, b = a + 1
      indices.push(a, a + segments + 1, b, b, a + segments + 1, b + segments + 1)
    }
    for (let i = 1; i < segments - 1; i++) {
      indices.push(0, i, i + 1)
      const top = (rings.length - 1) * (segments + 1)
      indices.push(top, top + i + 1, top + i)
    }
    const geometry = new T.BufferGeometry()
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    const flat = geometry.toNonIndexed()
    flat.computeVertexNormals()
    const smooth = geometry.attributes.normal, normals = flat.attributes.normal
    const normal = new T.Vector3(), face = new T.Vector3()
    for (let i = 0; i < normals.count; i++) {
      normal.fromBufferAttribute(smooth, indices[i])
      face.fromBufferAttribute(normals, i).lerp(normal, .56).normalize()
      normals.setXYZ(i, face.x, face.y, face.z)
    }
    add(flat, color, joint, 'matte', blend, true)
  }
  function armorCap(points, scale, position, color, joint, angle, depth = .20) {
    const vertices = []
    for (const [z, taper] of [[-depth, .90], [-depth * .66, 1], [depth * .66, 1], [depth, .90]]) {
      for (const [x, y] of points) vertices.push(new T.Vector3(x * scale * taper, y * scale + (z === 0 ? .015 : -.014), z))
    }
    add(transform(new ConvexGeometry(vertices), position, [0, 0, angle]), color, joint, color === 'gold' ? 'metal' : 'matte', null, true)
  }
  // A hollow shoulder shell with a sloped crown and flared lower rim.
  function pauldron(side, position, scale, joint, tacticalShell = false) {
    const outline = [[-.17, .12], [-.025, .225], [.155, .145], [.235, -.06], [.19, -.16], [-.175, -.13]]
    const vertices = outline.map(([x, y]) => [side * x * scale, y * scale, .24 * scale])
    vertices.push([side * .015 * scale, .09 * scale, .315 * scale])
    const back = outline.map(([x, y]) => [side * x * scale, y * scale, -.19 * scale])
    const points = vertices.concat(back), triangles = []
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6
      triangles.push(6, i, j, i, i + 7, j, j, i + 7, j + 7)
    }
    triangles.push(7, 8, 9, 7, 9, 10, 7, 10, 11, 7, 11, 12)
    if (side > 0) for (let i = 0; i < triangles.length; i += 3) [triangles[i + 1], triangles[i + 2]] = [triangles[i + 2], triangles[i + 1]]
    const geometry = new T.BufferGeometry()
    geometry.setAttribute('position', new T.Float32BufferAttribute(points.flat(), 3))
    geometry.setIndex(triangles)
    const flat = geometry.toNonIndexed(); flat.computeVertexNormals()
    add(transform(flat, position), 'ivory', joint, 'matte', null, true)
    const rim = outline.map(([x, y]) => [position[0] + side * x * scale, position[1] + y * scale, position[2] + .249 * scale])
    rim.push(rim[0])
    line(rim, .018 * scale, tacticalShell ? 'sand' : '#c9b99d', joint)
    for (const [x, y] of [[-.126, .107], [.158, -.098]]) {
      const p = [position[0] + side * x * scale, position[1] + y * scale, position[2] + .273 * scale]
      box(p, [.078 * scale, .089 * scale, .038], 'leather', joint, .008, [0, 0, side * .2])
      stud([p[0], p[1], p[2] + .024], joint, .024 * scale)
    }
  }

  function shoeSole(position, color, joint) {
    const vertices = []
    for (const [y, width, front, back] of [[.004, .132, .277, -.15], [.058, .158, .277, -.15], [.139, .145, .256, -.15]]) {
      for (const [x, z] of [[-width, back], [width, back], [width, front - .048], [width * .72, front], [-width * .72, front], [-width, front - .048]]) vertices.push(new T.Vector3(x + position[0], y, z))
    }
    add(new ConvexGeometry(vertices), color, joint, 'matte', null, true)
  }

  // One base head; the Phantom balaclava covers it without changing the rig.
  box([0, 2.155, 0], [.635, .535, .495], tactical ? 'charcoal' : 'skin', 'Head', .090, [0, 0, 0], 'matte', 3)
  box([0, 1.851, 0], [.17, .145, .16], tactical ? 'charcoal' : 'skin', 'Head', .02)
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R'
    box([s * .335, 2.13, -.008], [.085, .143, .119], tactical ? 'charcoal' : 'skin', 'Head', .024)
    box([s * .119, 2.166, .255], [.069, .130, .008], 'ink', `Eye${side}`, .017, [0, 0, -.07], 'face', 2)
    box([s * .119, 2.277, .255], [.12, .031, .013], 'hair', 'Head', .007, [0, 0, fantasy ? s * .30 : s * .16], 'face')
  }
  if (fantasy) {
    plate([[-.10, .028], [.093, .008], [.065, -.043], [-.022, -.057], [-.09, -.022]], .008, [0, 2.052, .25], 'ink', 'Head', [0, 0, 0], 'face', .002)
    plate([[-.081, .018], [.077, .003], [.054, -.025], [-.015, -.034], [-.073, -.015]], .009, [0, 2.052, .256], 'white', 'Head', [0, 0, 0], 'face', .001)
    for (const x of [-.043, .001, .043]) box([x, 2.045, .265], [.003, .027, .003], 'ink', 'Head', .001, [0, 0, -.13], 'face')
  } else line([[-.075, 2.041, .248], [-.042, 2.022, .249], [.015, 2.014, .249], [.071, 2.024, .249]], .006, 'ink', 'Head')
  if (!tactical) box([0, 2.11, .265], [.034, .052, .030], 'skin', 'Head', .009)
  if (!tactical) {
  box([0, 2.378, -.065], [.609, .211, .42], 'hair', 'Head', .050)
  const locks = [
    [-.25, 2.365, .204, .14, .35, .13, -.16], [-.142, 2.410, .244, .155, .35, .14, -.40],
    [.006, 2.495, .223, .235, .21, .17, -.42], [.205, 2.39, .217, .14, .34, .15, .16],
    [-.219, 2.51, .03, .23, .2, .25, -.39], [-.042, 2.585, .055, .285, .20, .26, -.47],
    [.17, 2.549, .055, .275, .18, .25, -.24], [.272, 2.432, -.031, .17, .26, .25, .36],
    [-.27, 2.297, -.019, .11, .18, .18, -.10], [.27, 2.28, -.04, .11, .18, .16, .08],
    [-.11, 2.461, -.177, .21, .16, .16, -.22], [.11, 2.47, -.169, .20, .17, .17, .21],
    [-.22, 2.274, -.236, .14, .26, .12, .17], [-.066, 2.294, -.246, .21, .28, .14, -.12],
    [.115, 2.301, -.239, .23, .26, .13, .14], [.253, 2.308, -.175, .12, .23, .11, -.16],
    [-.31, 2.42, .07, .15, .22, .19, -.40], [.31, 2.37, .09, .14, .23, .19, .42],
    [-.22, 2.54, -.15, .21, .17, .23, -.45], [.01, 2.60, -.16, .25, .16, .21, -.31],
    [.19, 2.53, -.17, .22, .19, .20, .30], [-.28, 2.34, -.20, .12, .21, .16, -.24],
  ]
  locks.forEach(([x, y, z, w, h, d, angle], i) => {
    const points = [[-.36, -.45, -.30], [-.51, .19, -.48], [-.24, .50, -.29], [.38, .36, -.39], [.50, -.17, -.40], [.17, -.50, -.26], [-.29, -.47, .29], [-.37, .21, .48], [-.16, .42, .21], [.31, .30, .33], [.45, -.14, .49], [.11, -.51, .26]].map(([px, py, pz]) => new T.Vector3(px * w, py * h, pz * d))
    const lock = new ConvexGeometry(points)
    lock.scale(1.1, 1.05, 1.08)
    lock.scale(1.10, 1, 1.05)
    add(transform(lock, [x * 1.13, y + .012, z * 1.05], [.06, i % 2 ? -.17 : .17, angle]), i % 5 === 0 ? 'hairLight' : 'hair', 'Head', 'matte', null, true)
  })
  } else {
    garment([[1.875, .215, .19], [1.955, .31, .257], [2.17, .323, .268], [2.34, .305, .252], [2.46, .24, .218], [2.505, .13, .118]], 'Head', 'charcoal')
  }

  garment([[1.075, .285, .178], [1.13, .322, .201], [1.19, fantasy ? .35 : .365, .232], [1.26, fantasy ? .37 : .363, fantasy ? .247 : .245], [1.43, fantasy ? .36 : .354, .227], [1.58, .347, .21], [1.67, .335, .183], [1.742, .247, .127]], 'Spine', 'top', { joint: 'Hips', min: 1.08, max: 1.30 })
  box([0, 1.105, 0], [.604, .066, .388], 'trim', 'Spine', .012)
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R'
    const arm = `Arm${side}`, elbow = `Elbow${side}`, hand = `Hand${side}`
    garment([[1.025, .101, .111, s * .505], [1.078, .147, .137, s * .5, .004], [1.155, .155, .15, s * .492, -.003], [1.225, .166, .158, s * .48, -.006], [1.28, .144, .151, s * .47, .008], [1.335, .15, .155, s * .465], [1.40, .167, .172, s * .446], [1.48, .174, .181, s * .427, -.004], [1.57, .16, .168, s * .399, -.009], [1.716, .108, .12, s * .355]], arm, 'top', { joint: elbow, min: 1.25, max: 1.42 })
    box([s * .505, 1.052, 0], [.222, .077, .242], 'trim', elbow, .012)
    box([s * .509, .938, .019], [.217, .217, .19], tactical ? 'glove' : 'skin', hand, .042, [0, 0, 0], 'matte', 2)
    box([s * .448, .947, .081], [.062, .10, .08], tactical ? 'glove' : 'skin', hand, .016, [0, 0, -s * .16])
    for (let finger = 0; finger < 4; finger++) {
      const knuckle = new T.BoxGeometry(.038, .061, .043)
      add(transform(knuckle, [s * .509 + (finger - 1.5) * .044, .899, .114]), tactical ? 'glove' : 'skin', hand)
    }
    if (fantasy || tactical) box([s * .509, .976, .016], [.185, .127, .165], 'glove', hand, .024)
    const thigh = `Thigh${side}`, knee = `Knee${side}`, foot = `Foot${side}`
    garment([[.239, .115, .126, s * .185], [.275, .163, .159, s * .193, -.008], [.31, .174, .169, s * .185, -.012], [.365, .148, .16, s * .175, .008], [.44, .159, .167, s * .193, -.008], [.535, .172, .182, s * .19, -.008], [.605, .177, .17, s * .18, .004], [.68, .167, .17, s * .18], [.745, .192, .188, s * .187, .009], [.84, .176, .184, s * .171, -.006], [.96, .182, .185, s * .17], [1.125, .169, .171, s * .17]], thigh, 'trousers', { joint: knee, min: .59, max: .79 })
    box([s * .266, .891, .166], [.155, .189, .064], tactical ? 'sand' : 'trousers', thigh, .024, [0, s * .30, -.025])
    box([s * .271, .958, .188], [.169, .052, .075], tactical ? 'trim' : 'charcoal', thigh, .011, [0, s * .30, -.025])
    box([s * .265, .49, .151], [.145, .142, .049], tactical ? 'glove' : 'trousers', knee, .021, [0, s * .25, .025])
    box([s * .27, .55, .175], [.158, .043, .057], 'charcoal', knee, .009, [0, s * .25, .025])
    if (tactical) {
      const kneePlate = [[-.085, -.095], [-.1, .04], [-.05, .105], [.05, .105], [.1, .04], [.085, -.095]]
      plate(kneePlate, .066, [s * .18, .68, .16], 'sand', knee, [0, 0, 0], 'matte', .013)
      armorCap(kneePlate, .77, [s * .18, .683, .210], '#877e6e', knee, -.025, .025)
    }
    const shoe = fantasy ? 'leather' : tactical ? 'charcoal' : 'white'
    const accent = fantasy ? 'gold' : tactical ? 'sand' : 'teal'
    shoeSole([s * .185], fantasy ? 'sole' : tactical ? 'sand' : 'teal', foot)
    box([s * .185, .125, .053], [.289, .038, .433], fantasy || tactical ? 'charcoal' : 'sole', foot, .012)
    garment([[.14, .137, .207, s * .185, .052], [.208, .132, .197, s * .185, .050], [.26, .119, .168, s * .185, .020], [.342, .101, .109, s * .185, -.019]], foot, shoe)
    if (fantasy || tactical) garment([[.235, .105, .110, s * .185, -.020], [.34, .116, .12, s * .185, -.02], [.437, .119, .117, s * .185, -.02]], foot, shoe)
    box([s * .185, .224, -.104], [.206, .073, .033], accent, foot, .008)
    for (let i = 0; i < 3; i++) box([s * .185, .325 - i * .032, .112 + i * .043], [.174, .018, .027], fantasy || tactical ? 'leather' : 'white', foot, .008, [-.52, 0, 0])
    box([s * .285, .187, .045], [.034, .079, .17], accent, foot, .007, [0, 0, -s * .21])
    if (!fantasy && !tactical) {
      plate([[-.145, -.022], [-.132, .041], [-.05, .03], [.012, .071], [.08, .018], [.146, .008], [.14, -.022]], .017, [s * .316, .178, .059], 'teal', foot, [0, s * Math.PI / 2, 0], 'matte', .006)
      box([s * .185, .173, .223], [.221, .082, .079], 'teal', foot, .028, [0, 0, 0], 'matte', 2)
      box([s * .185, .148, .272], [.249, .028, .028], 'white', foot, .009)
    }
  }

  if (!fantasy && !tactical) {
    box([0, 1.753, -.157], [.52, .251, .29], 'trim', 'Spine', .090, [0, 0, 0], 'matte', 2)
    const hoodRim = new T.CatmullRomCurve3([
      [-.21, 1.83, .13], [-.27, 1.89, -.06], [-.20, 1.91, -.24],
      [0, 1.91, -.285], [.20, 1.91, -.24], [.27, 1.89, -.06], [.21, 1.83, .13],
    ].map((point) => new T.Vector3(...point)))
    add(new T.TubeGeometry(hoodRim, 18, .044, 6, false), 'top', 'Spine')
    for (const s of [-1, 1]) {
      plate([[-.12, -.075], [-.13, .073], [.079, .113], [.13, -.019]], .155, [s * .17, 1.795, .078], 'top', 'Spine', [-.1, 0, -s * .27], 'matte', .024)
      line([[s * .112, 1.70, .153], [s * .106, 1.576, .215], [s * .106, 1.486, .221]], .008, 'white', 'Spine')
      box([s * .107, 1.485, .223], [.028, .039, .023], 'white', 'Spine', .005)
    }
    plate([[-.23, -.07], [-.174, .095], [.174, .095], [.23, -.07]], .060, [0, 1.265, .238], 'teal', 'Spine', [0, 0, 0], 'matte', .014)
    line([[-.215, 1.23, .277], [-.174, 1.32, .277]], .006, 'trim', 'Spine')
    line([[.215, 1.23, .277], [.174, 1.32, .277]], .006, 'trim', 'Spine')
    plate([[-.029, -.045], [-.042, .018], [.012, -.010], [.047, .036], [.042, -.05]], .009, [.16, 1.568, .209], 'white', 'Spine', [0, 0, -.10], 'matte', .002)
  }

  if (fantasy) {
    box([0, 1.803, -.015], [.346, .139, .293], 'top', 'Spine', .033, [0, 0, .02])
    line([[-.153, 1.776, .137], [0, 1.752, .162], [.155, 1.794, .132]], .019, 'trim', 'Spine')
    // Thick canvas apron, split at the belt onto two cloth joints for running.
    apronPanel([[-.27, -.22], [-.21, .25], [.19, .23], [.26, -.22]], [0, 1.43, .30], 'Spine')
    for (const s of [-1, 1]) {
      const side = s < 0 ? 'L' : 'R'
      apronPanel([[-.15, s < 0 ? -.53 : -.49], [-.145, .08], [.126, .08], [.165, s < 0 ? -.49 : -.39]], [s * .142, 1.102, .255], `Cloth${side}`)
      apronPanel([[-.15, -.42], [-.145, .07], [.127, .07], [.15, -.39]], [s * .14, 1.09, -.249], `ClothBack${side}`, true)
      seam([[s * .271, 1.08, .241], [s * .291, .87, .228], [s * .29, .654, .225]], `Cloth${side}`, '#c3af8e')
      seam([[s * .27, 1.07, -.238], [s * .281, .85, -.227], [s * .28, .69, -.222]], `ClothBack${side}`, '#c3af8e')
      line([[s * .26, 1.64, .269], [s * .27, 1.41, .276], [s * .27, 1.27, .29]], .004, '#c3af8e', 'Spine')
      for (let i = 0; i < 3; i++) box([s * .261, 1.60 - i * .126, .282], [.038, .013, .011], 'leather', 'Spine', .002, [0, 0, -.18])
      box([s * .21, 1.724, .114], [.082, .129, .258], 'leather', 'Spine', .015, [0, 0, -s * .20])
    }
    plate([[-.119, .104], [.108, .090], [.104, -.141], [-.105, -.128]], .012, [.145, .819, .283], 'leather', 'ClothR', [0, 0, -.17], 'matte', .005)
    for (let i = 0; i < 4; i++) {
      box([.047 + i * .060, .929 - i * .009, .294], [.013, .030, .010], 'ivory', 'ClothR', .002, [0, 0, -.17])
      box([.050 + i * .059, .689 - i * .008, .294], [.013, .030, .010], 'ivory', 'ClothR', .002, [0, 0, -.17])
    }
    plate([[-.08, .07], [.08, .06], [.07, -.065], [-.078, -.07]], .013, [-.17, .766, -.279], 'leather', 'ClothBackL', [0, 0, -.16], 'matte', .005)
    for (let i = 0; i < 4; i++) box([-.236 + i * .044, .826 - i * .007, -.291], [.012, .025, .009], 'ivory', 'ClothBackL', .002, [0, 0, -.16])
    // Diagonal harness, layered buckle and clean hammered-metal rivets.
    box([-.031, 1.516, .343], [.118, .66, .039], 'leather', 'Spine', .014, [0, 0, .64])
    buckle([-.084, 1.582, .381], [.156, .173], 'Spine', .64)
    for (let i = 0; i < 5; i++) stud([-.193 + i * .079, 1.70 - i * .108, .372], 'Spine')
    box([0, 1.149, .040], [.73, .139, .56], 'leather', 'Hips', .024)
    buckle([.061, 1.157, .356], [.205, .157], 'Hips', -.035)
    for (const x of [-.25, -.16, .19, .28]) stud([x, 1.15, .336], 'Hips')
    for (const s of [-1, 1]) {
      const side = s < 0 ? 'L' : 'R'
      const arm = `Arm${side}`, elbow = `Elbow${side}`, knee = `Knee${side}`
      for (const offset of [-.16, 0, .16]) {
        seam([[s * .31, 1.56 + offset, .173], [s * .43, 1.46 + offset, .187], [s * .57, 1.37 + offset, .132]], arm)
        seam([[s * .31, 1.38 + offset, .172], [s * .43, 1.48 + offset, .187], [s * .57, 1.59 + offset, .132]], arm)
      }
      seam([[s * .365, 1.32, .102], [s * .48, 1.23, .149], [s * .598, 1.14, .105]], elbow)
      const scale = s < 0 ? 1.35 : .73
      pauldron(s, [s * .423, 1.685, .004], scale, arm)
      if (s < 0) {
        plate([[-.084, .099], [.067, .134], [.075, .065], [-.024, .031], [.065, -.010], [.037, -.081], [-.076, -.020]], .028, [-.459, 1.745, .448], 'leather', arm, [0, -.10, -.19], 'metal', .002)
      }
      box([s * .482, 1.175, .038], [.259, .27, .32], 'leather', elbow, .033, [0, 0, s * -.04])
      for (const y of [1.097, 1.246]) {
        plate([[-.137, -.042], [-.144, .042], [.068, .059], [.135, .027], [.138, -.037]], .042, [s * .482, y, .217], 'gold', elbow, [0, -s * .21, s * -.06], 'metal', .008)
        stud([s * .55, y, .25], elbow, .022)
      }
      box([s * .18, .617, .025], [.276, .043, .32], 'leather', knee, .01)
      for (const y of [.312, .568]) {
        box([s * .18, y, .014], [.268, .046, .303], 'leather', knee, .011)
        stud([s * .18, y, .175], knee)
      }
      line([[s * .25, 1.48, -.207], [s * .15, 1.38, -.212], [s * .035, 1.24, -.216]], .035, 'leather', 'Spine')
    }
    for (let i = 0; i < 4; i++) ring([-.46 - i * .026, 1.117 - i * .119, .37], [.078, .101, .064], i === 3 ? 'gold' : 'steel', 'Accessory', [0, i % 2 ? Math.PI / 2 : 0, -.13])
    const hook = [[.02, .13], [-.075, .11], [-.14, .03], [-.145, -.07], [-.078, -.14], [.045, -.14], [.13, -.065], [.13, .03], [.07, .045], [.065, -.03], [.02, -.07], [-.04, -.075], [-.073, -.027], [-.06, .045], [.015, .07]]
    plate(hook.map(([x, y]) => [x * 1.92, y * 1.92]), .096, [-.565, .542, .37], 'steel', 'Accessory', [0, -.06, -.13], 'metal', .018)
    box([-.545, .756, .37], [.151, .108, .141], 'gold', 'Accessory', .012, [0, 0, -.13], 'metal')
  } else {
    const packColor = tactical ? 'sand' : 'charcoal'
    box([0, 1.456, -.267], [.38, .445, .156], packColor, 'Spine', .038)
    box([0, 1.369, -.354], [.323, .177, .057], tactical ? 'trim' : 'charcoal', 'Spine', .022)
    box([0, 1.631, -.321], [.114, .048, .087], 'charcoal', 'Spine', .012)
    if (!tactical) {
      box([0, 1.447, -.387], [.275, .013, .009], 'glove', 'Spine', .003)
      box([-.08, 1.423, -.392], [.016, .049, .012], 'teal', 'Spine', .003)
      box([0, 1.349, -.388], [.058, .07, .012], 'teal', 'Spine', .006)
      line([[-.014, 1.365, -.397], [0, 1.340, -.398], [.014, 1.365, -.397]], .003, 'white', 'Spine')
    }
    for (const s of [-1, 1]) {
      line([[s * .193, 1.74, -.247], [s * .218, 1.721, .063], [s * .217, 1.566, .234], [s * .208, 1.328, .24]], .027, 'charcoal', 'Spine')
      box([s * .211, 1.539, .259], [.067, .064, .033], 'glove', 'Spine', .006)
      box([s * .211, 1.539, .278], [.028, .029, .008], 'ink', 'Spine', .002)
    }
    if (tactical) {
      box([0, 1.471, .225], [.61, .46, .15], 'charcoal', 'Spine', .033)
      plate([[-.285, -.05], [-.26, .114], [.219, .094], [.284, -.015], [.147, -.07]], .049, [0, 1.55, .322], 'sand', 'Spine', [0, 0, -.08], 'matte', .014)
      for (const x of [-.21, -.105, .11, .21]) {
        const rivet = new T.CylinderGeometry(.013, .013, .013, 6)
        add(transform(rivet, [x, 1.590 - x * .08, .358], [Math.PI / 2, 0, 0]), 'leather', 'Spine')
      }
      for (const s of [-1, 1]) {
        box([s * .23, 1.573, .338], [.050, .228, .031], 'charcoal', 'Spine', .008, [0, 0, -s * .045])
        for (let i = 0; i < 3; i++) box([s * .227, 1.648 - i * .055, .359], [.057, .025, .017], 'sand', 'Spine', .005)
      }
      for (const [x, y, w] of [[-.19, 1.35, .17], [.005, 1.321, .191], [.206, 1.339, .185]]) {
        box([x, y, .374], [w, .226, .136], x < 0 ? 'charcoal' : 'sand', 'Spine', .025)
        plate([[-w / 2, .033], [-w / 2, -.023], [-.028, -.041], [.037, -.041], [w / 2, -.018], [w / 2, .033]], .045, [x, y + .079, .457], 'trim', 'Spine', [0, 0, .035], 'matte', .008)
        box([x, y + .021, .480], [.034, .055, .018], 'leather', 'Spine', .006)
      }
      for (const s of [-1, 1]) {
        box([s * .107, 1.752, .10], [.128, .123, .203], 'ivory', 'Spine', .011, [0, 0, -s * .30])
        pauldron(s, [s * .413, 1.665, -.014], .76, `Arm${s < 0 ? 'L' : 'R'}`, true)
        box([s * .38, 1.184, .045], [.145, .112, .141], 'sand', 'Hips', .012)
      }
      plate([[-.212, .067], [.195, .043], [.086, -.083], [-.089, -.041]], .044, [0, 1.714, .323], 'ivory', 'Spine', [0, 0, .03], 'matte', .009)
      const scarf = new T.CatmullRomCurve3([
        [-.19, 1.78, .17], [-.225, 1.86, -.04], [-.15, 1.86, -.15],
        [.15, 1.86, -.15], [.225, 1.84, -.03], [.19, 1.78, .19], [0, 1.755, .258],
      ].map(([x, y, z]) => new T.Vector3(x, y - .060, z)), true)
      add(new T.TubeGeometry(scarf, 22, .055, 6, true), 'ivory', 'Spine')
      plate([[-.195, .03], [-.123, -.075], [.125, -.11], [.226, .037], [.123, .049], [.006, -.016]], .055, [0, 1.77, .307], 'ivory', 'Spine', [0, 0, -.075], 'matte', .013)
      line([[-.181, 1.75, .343], [0, 1.721, .351], [.172, 1.76, .336]], .009, '#c1b394', 'Spine')
      box([-.175, 1.35, .445], [.025, .078, .019], 'teal', 'Spine', .005)
      box([0, 1.414, -.389], [.022, .058, .019], 'teal', 'Spine', .004)
      box([-.35, 2.174, -.048], [.112, .182, .157], 'charcoal', 'Head', .017)
      box([.35, 2.174, -.048], [.10, .158, .14], 'charcoal', 'Head', .014)
      for (const s of [-1, 1]) {
        plate([[-.07, -.106], [-.097, -.057], [-.097, .071], [-.047, .126], [.047, .126], [.09, .064], [.086, -.072], [.036, -.109]], .053, [s * .375, 2.18, -.04], 'sand', 'Head', [0, s * Math.PI / 2, 0], 'matte', .01)
        box([s * .416, 2.161, -.011], [.012, .072, .064], 'charcoal', 'Head', .004)
      }
      line([[-.337, 2.251, -.04], [-.269, 2.49, -.13], [0, 2.548, -.155], [.267, 2.478, -.13], [.336, 2.236, -.04]], .024, 'glove', 'Head')
      line([[-.39, 2.139, -.012], [-.39, 2.082, .15], [-.19, 2.041, .281]], .012, 'glove', 'Head')
      box([-.168, 2.041, .287], [.093, .037, .040], 'charcoal', 'Head', .008)
      // Real open eye sockets and nose cutout; no face exposed above a half-mask.
      const mask = [[-.284, .157], [-.221, .263], [-.062, .282], [.054, .255], [.216, .263], [.288, .158], [.279, .030], [.239, -.065], [.166, -.080], [.139, -.091], [-.139, -.091], [-.173, -.075], [-.243, -.060], [-.282, .029]]
      const sockets = [
        [[-.228, .146], [-.161, .178], [-.079, .153], [-.054, .076], [-.108, .028], [-.212, .042], [-.240, .091]],
        [[.071, .153], [.153, .167], [.225, .145], [.239, .076], [.193, .033], [.096, .027], [.054, .077]],
        [[0, .029], [-.051, -.051], [0, -.075], [.049, -.050]],
      ]
      const maskGeometry = plate(mask, .075, [0, 2.09, .286], 'ivory', 'Head', [0, 0, 0], 'matte', .020, sockets)
      const maskPositions = maskGeometry.attributes.position
      for (let i = 0; i < maskPositions.count; i++) {
        const x = maskPositions.getX(i), y = maskPositions.getY(i)
        const cheek = .035 * Math.exp(-(((Math.abs(x) - .19) / .075) ** 2)) * Math.exp(-(((y - 2.04) / .065) ** 2))
        maskPositions.setZ(i, maskPositions.getZ(i) + .13 * (1 - (x / .32) ** 2) - .30 * Math.max(0, y - 2.24) + cheek)
      }
      maskGeometry.computeVertexNormals()
      for (const s of [-1, 1]) {
        plate([[-.016, .067], [.027, .039], [.022, -.012], [-.016, .009]], .037, [s * .023, 2.13, .455], 'ivory', 'Head', [0, s * .35, -s * .12], 'matte', .004)
      }
      for (const s of [-1, 1]) {
        box([s * .137, 2.184, .315], [.18, .163, .021], '#16191c', 'Head', .031, [0, 0, -s * .12], 'face')
        box([s * .133, 2.173, .30], [.014, .006, .006], '#626b68', `Eye${s < 0 ? 'L' : 'R'}`, .001, [0, 0, 0], 'face')
        box([s * .251, 2.101, .264], [.062, .024, .032], 'teal', 'Head', .003, [0, s * .4, 0])
      }
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * .049
        box([x, 1.952 + Math.abs(i - 2) * .009, .445 - Math.abs(i - 2) * .013], [.036, .105, .071], 'ivory', 'Head', .011, [0, (i - 2) * .08, -(i - 2) * .025])
      }
    }
  }

  scene.updateMatrixWorld(true)
  const skeleton = new T.Skeleton(bones)
  const usedMaterials = [], geometries = []
  for (const [finish, parts] of Object.entries(pieces)) {
    if (!parts.length) continue
    geometries.push(mergeGeometries(parts))
    usedMaterials.push(materials[finish])
  }
  const geometry = mergeGeometries(geometries, true)
  const mesh = new T.SkinnedMesh(geometry, usedMaterials)
  mesh.name = `Avatar_${outfit}`
  scene.add(mesh)
  mesh.bind(skeleton)
  mesh.castShadow = true
  mesh.receiveShadow = true

  return { scene, animations: retargetAvatarMotion(scene, bones), triangles: geometry.index.count / 3, materials: usedMaterials.length, bones: bones.length }
}

// Embed the generated atlas without requiring a DOM/canvas in the offline exporter.
export function embedMaterialAtlas(data, atlas, mimeType = 'image/png') {
  const jsonLength = data.readUInt32LE(12)
  const gltf = JSON.parse(data.subarray(20, 20 + jsonLength).toString())
  const originalBinary = data.subarray(28 + jsonLength)
  const atlasOffset = originalBinary.length
  const atlasView = gltf.bufferViews.length
  gltf.bufferViews.push({ buffer: 0, byteOffset: atlasOffset, byteLength: atlas.length })
  gltf.images = [{ bufferView: atlasView, mimeType, name: 'ReferenceMaterialAtlas' }]
  gltf.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }]
  gltf.textures = [{ source: 0, sampler: 0 }]
  for (const material of gltf.materials) if (material.name !== 'face') {
    material.pbrMetallicRoughness.baseColorTexture = { index: 0 }
  }
  const binaryLength = Math.ceil((atlasOffset + atlas.length) / 4) * 4
  gltf.buffers[0].byteLength = binaryLength
  const json = Buffer.from(JSON.stringify(gltf))
  const paddedJsonLength = Math.ceil(json.length / 4) * 4
  const result = Buffer.alloc(28 + paddedJsonLength + binaryLength)
  result.write('glTF', 0); result.writeUInt32LE(2, 4); result.writeUInt32LE(result.length, 8)
  result.writeUInt32LE(paddedJsonLength, 12); result.write('JSON', 16)
  result.fill(0x20, 20, 20 + paddedJsonLength); json.copy(result, 20)
  result.writeUInt32LE(binaryLength, 20 + paddedJsonLength); result.write('BIN\0', 24 + paddedJsonLength)
  originalBinary.copy(result, 28 + paddedJsonLength)
  atlas.copy(result, 28 + paddedJsonLength + atlasOffset)
  return result
}

async function exportAvatars() {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) { blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.() }) }
  }
  const destination = path.resolve('public/game-assets/avatars')
  await mkdir(destination, { recursive: true })
  const atlas = await readFile('assets/avatars/materials/reference-materials.png')
  const files = []
  for (const outfit of outfits) {
    const model = buildBlockyAvatar(outfit)
    const geometry = Buffer.from(await new GLTFExporter().parseAsync(model.scene, { binary: true, animations: model.animations }))
    const data = embedMaterialAtlas(geometry, atlas)
    const file = `blocky-${outfit}.glb`
    await writeFile(path.join(destination, file), data)
    files.push({ id: outfit, file, bytes: data.length, triangles: model.triangles, materials: model.materials, bones: model.bones, sha256: createHash('sha256').update(data).digest('hex') })
  }
  await writeFile(path.join(destination, 'blocky-provenance.json'), JSON.stringify({
    source: 'Original authored mesh and rig: scripts/build-blocky-avatars.mjs; offline CC0 motion retargeting: scripts/quaternius-avatar-motion.mjs',
    reference: 'docs/games/shared-avatar/three-skins-v5.png',
    styleReference: 'docs/games/shared-avatar/style-approved-v1.png',
    materials: { atlas: 'assets/avatars/materials/reference-materials.png', source: 'Built-in Image Gen; neutral material details tinted by authored vertex colours', sha256: createHash('sha256').update(atlas).digest('hex') },
    date: '2026-10-06', externalAssets: [{
      author: 'Quaternius', title: 'Universal Animation Library — free Standard, 2025-06 mirror', license: 'CC0-1.0',
      official: 'https://quaternius.com/packs/universalanimationlibrary.html',
      mirror: 'https://github.com/J-Ponzo/gltf-universal-animation-library/tree/e24c23cf2a1323488a3faa226ea7ea21f644b73e',
      sourceDirectory: 'assets/avatars/quaternius-ual-standard', clips: { Idle: 'Idle_Loop', Run: 'Jog_Fwd_Loop' },
    }],
    animation: 'Identical 23-bone rig; CC0 in-place Idle and Run adapted to our proportions; original front/back apron and chain secondary motion',
    files,
  }, null, 2) + '\n')
  console.log(JSON.stringify(files, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await exportAvatars()
