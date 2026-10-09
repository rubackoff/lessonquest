import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { createAvatar, loadAvatar, playerAvatarDefinition } from '@/lib/avatar/avatar'
import type { AvatarProfile } from '@/lib/avatar/profile'
import { laneWidth, type RunnerSession } from '@/lib/orbital-runner/session'
import { lowGraphics } from '@/lib/graphics'

export function createRunnerView(host: HTMLDivElement, session: RunnerSession, profile: AvatarProfile,
  onReady: () => void, onTick: () => void, onError: () => void, gateLabelClass: string) {
  let disposed = false, frame = 0, previous = 0, lastHud = 0, lastLevel = 0
  let actor: ReturnType<typeof createAvatar> | undefined
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), textures = new Set<T.Texture>()
  const materialCache = new Map<string, T.MeshStandardMaterial>(), shapeCache = new Map<string, T.BufferGeometry>()
  const lowQuality = lowGraphics()
  const mobile = host.clientWidth < 700
  const renderer = new T.WebGLRenderer({ antialias: !lowQuality, alpha: true, powerPreference: 'high-performance' })
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = !lowQuality
  renderer.shadowMap.type = T.PCFSoftShadowMap
  renderer.domElement.setAttribute('role', 'img')
  renderer.domElement.setAttribute('aria-label', '3D track: three tracks, character and obstacles')
  renderer.domElement.tabIndex = 0
  host.appendChild(renderer.domElement)
  const scene = new T.Scene()
  scene.fog = new T.Fog(0xdaedf7, 55, 150)
  const camera = new T.PerspectiveCamera(50, 1, .1, 180)
  scene.add(new T.HemisphereLight(0xe7f7ff, 0x99a9b4, 2.2))
  const sun = new T.DirectionalLight(0xffffff, 2.6)
  sun.position.set(-8, 15, 7); sun.castShadow = !mobile
  sun.shadow.mapSize.set(1024, 1024)
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 12, bottom: -24, near: 1, far: 60 })
  sun.shadow.bias = -.0005; sun.shadow.normalBias = .03
  scene.add(sun)
  const mat = (color: number, metalness = .08, roughness = .75) => {
    const key = `${color}-${metalness}-${roughness}`
    if (!materialCache.has(key)) { const material = new T.MeshStandardMaterial({ color, metalness, roughness }); materials.add(material); materialCache.set(key, material) }
    return materialCache.get(key)!
  }
  const white = mat(0xf1f4f5), silver = mat(0x9cadb5, .45, .4), dark = mat(0x285465), teal = mat(0x179b9d, .25)
  const ochre = mat(0xf0b332, .35, .45), gold = mat(0xffbf35, .5, .3)
  const luminous = new T.MeshStandardMaterial({ color: 0x93eee8, emissive: 0x35bdb3, emissiveIntensity: .6 })
  materials.add(luminous)
  const geometry = <G extends T.BufferGeometry>(value: G) => { geometries.add(value); return value }
  const mesh = (parent: T.Object3D, shape: T.BufferGeometry, material: T.Material, x = 0, y = 0, z = 0) => {
    const object = new T.Mesh(shape, material); object.position.set(x, y, z)
    object.castShadow = true; object.receiveShadow = true; parent.add(object); return object
  }
  const round = (x: number, y: number, z: number, bevel = .07) => {
    const key = `${x}-${y}-${z}-${bevel}`
    if (!shapeCache.has(key)) shapeCache.set(key, geometry(new RoundedBoxGeometry(x, y, z, 1, bevel)))
    return shapeCache.get(key)!
  }
  const unit = geometry(new T.BoxGeometry(1, 1, 1))
  const box = (parent: T.Object3D, material: T.Material, x: number, y: number, z: number, w: number, h: number, d: number) => {
    const object = mesh(parent, unit, material, x, y, z); object.scale.set(w, h, d); return object
  }
  const modules: T.Group[] = []
  const archShape = geometry(new T.TorusGeometry(4.2, .22, 4, 28, Math.PI))
  const archTrim = geometry(new T.TorusGeometry(4.2, .065, 4, 28, Math.PI))
  const foliageShape = geometry(new T.IcosahedronGeometry(.5, 0))
  // The deck, rails and arches are real 3D surfaces, recycled around the runner.
  for (let index = 0; index < 18; index++) {
    const deckModule = new T.Group(); modules.push(deckModule)
    mesh(deckModule, round(8.3, .22, 8, .05), white, 0, -.14)
    for (const lane of [-1, 0, 1]) {
      mesh(deckModule, round(2.12, .035, 3.93, .012), mat(index % 2 ? 0xe5ecef : 0xeaf0f2), lane * laneWidth, -.006, -2)
      mesh(deckModule, round(2.12, .035, 3.93, .012), white, lane * laneWidth, -.006, 2)
    }
    for (const x of [-3.4, -1.1, 1.1, 3.4]) {
      box(deckModule, silver, x, .006, 0, .19, .04, 7.96)
      box(deckModule, teal, x, .028, 0, .12, .012, 6.2)
      box(deckModule, luminous, x, .035, 2.45, .06, .012, .35)
    }
    for (const side of [-1, 1]) {
      box(deckModule, white, side * 4, .3, 0, .25, .65, 8)
      box(deckModule, silver, side * 4, .95, 0, .08, .12, 8)
      box(deckModule, white, side * 4, 1.45, 0, .14, .18, 8)
      box(deckModule, silver, side * 4, 1, 0, .13, 1.5, .15)
      box(deckModule, teal, side * 4.01, .45, 0, .28, .05, 7.8)
      if (index % 2 === 0) {
        mesh(deckModule, round(.55, .65, .95), white, side * 4.6, .22, 1)
        const foliage = mesh(deckModule, foliageShape, mat(0x65975c), side * 4.6, .86, 1)
        foliage.scale.set(.55, 1, .6)
      }
    }
    if (index % 2 === 0) {
      mesh(deckModule, archShape, white, 0, 2.5)
      mesh(deckModule, archTrim, silver, 0, 2.5, -.18)
      for (const side of [-1, 1]) mesh(deckModule, round(.43, 2.6, .46), white, side * 4.2, 1.2)
      mesh(deckModule, round(1.45, .28, .5), white, 0, 6.68)
      box(deckModule, luminous, 0, 6.62, .26, .6, .055, .025)
    }
  }
  const hurdleShape = round(1.6, .35, .4), beamShape = round(1.65, .22, .35), crateShape = round(1.55, 1.55, 1.3)
  const coinShape = geometry(new T.CylinderGeometry(.25, .25, .095, 6)), coinCenter = geometry(new T.CylinderGeometry(.13, .13, .11, 6))
  const obstacles = session.course.map(item => {
    const group = new T.Group()
    if (item.kind === 'coin') {
      mesh(group, coinShape, gold, 0, 1).rotation.x = Math.PI / 2
      mesh(group, coinCenter, ochre, 0, 1).rotation.x = Math.PI / 2
    } else if (item.kind === 'crate') {
      mesh(group, crateShape, dark, 0, .775)
      for (const x of [-.7, .7]) for (const y of [.08, 1.47]) mesh(group, round(.24, .24, 1.35, .025), silver, x, y)
      for (const y of [.08, 1.47]) box(group, silver, 0, y, .68, 1.5, .08, .04)
      for (const angle of [-.72, .72]) {
        const brace = box(group, teal, 0, .77, .68, .08, 1.6, .04); brace.rotation.z = angle
      }
    } else {
      const slide = item.kind === 'beam'
      const height = slide ? 1.4 : .55
      mesh(group, slide ? beamShape : hurdleShape, slide ? ochre : teal, 0, height)
      for (const x of [-.78, .78]) {
        mesh(group, round(.22, height + .1, .45), dark, x, height / 2)
        box(group, silver, x, .035, 0, .4, .07, .6)
      }
      box(group, slide ? gold : luminous, 0, height + .01, .21, 1.1, .075, .03)
    }
    return { item, group }
  })
  const gates = [-1, 0, 1].map((lane, index) => {
    const group = new T.Group()
    for (const x of [-.92, .92]) {
      mesh(group, round(.2, 2.7, .3), white, x, 1.35)
      box(group, luminous, x, 1.4, .17, .065, 2.3, .02)
    }
    mesh(group, round(2.04, .2, .3), white, 0, 2.72)
    box(group, luminous, 0, 2.73, .17, 1.8, .06, .025)
    const label = document.createElement('div')
    label.className = gateLabelClass; label.textContent = session.question.options[index]; label.setAttribute('aria-hidden', 'true')
    host.appendChild(label)
    return { group, lane, label }
  })
  const labelPosition = new T.Vector3()

  // Batch all repeated props. Moving parent matrices remain independent of collision rules.
  const batchGroups = new Map<string, { geometry: T.BufferGeometry; material: T.Material; parts: Array<{ parent: T.Group; local: T.Matrix4 }> }>()
  for (const parent of [...modules, ...obstacles.map(value => value.group), ...gates.map(value => value.group)]) {
    parent.updateMatrixWorld(true)
    parent.traverse(object => {
      if (!(object instanceof T.Mesh) || Array.isArray(object.material)) return
      const key = `${object.geometry.uuid}-${object.material.uuid}`
      if (!batchGroups.has(key)) batchGroups.set(key, { geometry: object.geometry, material: object.material, parts: [] })
      batchGroups.get(key)!.parts.push({ parent, local: object.matrixWorld.clone() })
    })
  }
  const batches = [...batchGroups.values()].map(batch => {
    const object = new T.InstancedMesh(batch.geometry, batch.material, batch.parts.length)
    object.frustumCulled = false; object.castShadow = true; object.receiveShadow = true
    scene.add(object); return { mesh: object, parts: batch.parts }
  })
  const instanceMatrix = new T.Matrix4(), hiddenMatrix = new T.Matrix4().makeScale(0, 0, 0)

  const resize = () => {
    const { width, height } = host.getBoundingClientRect()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowQuality ? 1 : 2))
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(1, height)
    camera.fov = width < 700 ? 64 : 50
    camera.position.set(0, width < 700 ? 4.4 : 2.8, width < 700 ? 9.5 : 5.3)
    camera.lookAt(0, width < 700 ? .2 : 1.3, width < 700 ? -3 : -12)
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize()
  const definition = playerAvatarDefinition(profile, 2.1)
  loadAvatar(definition).then(asset => {
    asset.scene.traverse(object => {
      if (object instanceof T.Mesh) {
        geometries.add(object.geometry)
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(material)
          for (const value of Object.values(material)) if (value instanceof T.Texture) textures.add(value)
        }
      }
    })
    if (disposed) { releaseResources(); return }
    actor = createAvatar(asset, definition); actor.root.rotation.y = Math.PI; scene.add(actor.root)
    onReady()
  }).catch(() => { if (!disposed) onError() })

  const render = (now: number) => {
    if (disposed) return
    frame = requestAnimationFrame(render)
    if (document.hidden || lowQuality && previous && now - previous < 1000 / 30 - 1) return
    const dt = previous ? Math.min((now - previous) / 1000, .1) : 0; previous = now
    if (actor) session.tick(dt)
    if (lastLevel !== session.level) {
      lastLevel = session.level
      const colors = [0x35bdb3, 0x9b78d8, 0xe8a23d]
      luminous.color.setHex(colors[lastLevel - 1]); luminous.emissive.copy(luminous.color); teal.color.copy(luminous.color)
    }
    const offset = session.distance
    modules.forEach((deckModule, index) => { deckModule.position.z = 8 - index * 8 + offset % 144; if (deckModule.position.z > 12) deckModule.position.z -= 144 })
    obstacles.forEach(({ item, group }) => {
      const ahead = item.distance - offset
      group.visible = ahead > -3 && ahead < 115 && !(item.kind === 'coin' && session.resolved.has(item.id))
      group.position.set(item.lane * laneWidth, 0, -ahead)
    })
    for (const { group, lane, label } of gates) {
      label.textContent = session.question.options[lane + 1]
      label.dataset.level = String(session.level)
      const ahead = session.checkpoint - offset
      group.position.set(lane * laneWidth, 0, -ahead)
      labelPosition.set(lane * laneWidth, 3.2, -ahead).project(camera)
      label.hidden = labelPosition.z > 1 || ahead > 55 || ['finished', 'gameover'].includes(session.status)
      label.style.left = `${(labelPosition.x + 1) / 2 * host.clientWidth}px`
      label.style.top = `${(1 - labelPosition.y) / 2 * host.clientHeight}px`
      const centerX = labelPosition.x
      labelPosition.set(lane * laneWidth + .9, 3.2, -ahead).project(camera)
      const width = Math.max(24, Math.min(160, Math.abs(labelPosition.x - centerX) * host.clientWidth))
      label.style.width = `${width}px`
      label.style.padding = '3px 2px'
      label.style.whiteSpace = label.textContent.length < 14 ? 'nowrap' : 'normal'
      label.style.fontSize = `${Math.max(8, Math.min(24, width / (label.textContent.length > 13 ? 7 : label.textContent.length * .65 + 1)))}px`
    }
    for (const { mesh: batchMesh, parts } of batches.values()) {
      parts.forEach(({ parent, local }, index) => {
        instanceMatrix.copy(local); instanceMatrix.elements[12] += parent.position.x; instanceMatrix.elements[14] += parent.position.z
        batchMesh.setMatrixAt(index, parent.visible ? instanceMatrix : hiddenMatrix)
      })
      batchMesh.instanceMatrix.needsUpdate = true
    }
    if (actor) {
      actor.root.position.set(session.x, session.jumpHeight, 0)
      actor.root.visible = session.invulnerable <= 0 || Math.floor(now / 140) % 2 === 0
      const active = session.status === 'playing'
      actor.update(active || session.status === 'ready' ? dt : 0, active, Math.PI, definition.runSpeed,
        session.action ? { kind: session.action, progress: session.actionProgress } : undefined)
    }
    if (now - lastHud > 100) { lastHud = now; onTick() }
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(render)
  function releaseResources() { geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); textures.forEach(value => value.dispose()) }
  return { dispose() {
    disposed = true; cancelAnimationFrame(frame); observer.disconnect(); actor?.dispose()
    releaseResources(); batches.forEach(batch => batch.mesh.dispose()); gates.forEach(gate => gate.label.remove()); renderer.dispose(); renderer.domElement.remove()
  } }
}
