import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { playerAvatarDefinition, createAvatar, loadAvatar, type AvatarDefinition } from '@/lib/avatar/avatar'
import { type AvatarProfile } from '@/lib/avatar/profile'
import { canMove, type EnemyKind, type Point } from '@/lib/space-maze/maze'
import { actorPosition, type MazeSession } from '@/lib/space-maze/session'

type ViewOptions = {
  lowQuality: boolean
  labelClass: string
  onReady: () => void
  onError: (message: string) => void
  onTick: () => void
  avatar: AvatarProfile
}
const angles = { up: Math.PI, right: Math.PI / 2, down: 0, left: -Math.PI / 2 }
const enemyDefinitions: Record<EnemyKind, AvatarDefinition> = {
  scout: { id: 'scout', source: '/game-assets/space-maze/scout.glb', height: 0.68, idleClip: 'Flying_Idle', runClip: 'Fast_Flying' },
  hunter: { id: 'hunter', source: '/game-assets/space-maze/hunter.glb', height: 0.85, idleClip: 'Idle', runClip: 'Run' },
  interceptor: { id: 'interceptor', source: '/game-assets/space-maze/interceptor.glb', height: 0.7, idleClip: 'Flying_Idle', runClip: 'Fast_Flying' },
}

export function createMazeView(host: HTMLDivElement, session: MazeSession, options: ViewOptions) {
  const { maze } = session
  const cellWidth = 1.3
  let disposed = false
  let ready = false
  let frame = 0
  let previous = 0
  let lastHud = 0
  let lastStatus = ''
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ antialias: !options.lowQuality, alpha: true, powerPreference: 'low-power' })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = !options.lowQuality
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.domElement.setAttribute('aria-label', 'Three-dimensional field: character, labyrinth and answer beacons')
  renderer.domElement.setAttribute('role', 'img')
  renderer.domElement.tabIndex = 0
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100)
  camera.position.set(0, 18, 9.5)
  camera.lookAt(0, 0, 0)
  scene.add(new THREE.HemisphereLight(0xf0faff, 0x9baeb8, 1.7))
  const sun = new THREE.DirectionalLight(0xffffff, 2.6)
  sun.position.set(-7, 14, -3)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 35 })
  sun.shadow.bias = -0.0005
  sun.shadow.normalBias = 0.025
  sun.shadow.radius = 3
  scene.add(sun)

  const mat = (color: number, roughness = 0.72, metalness = 0.05) => new THREE.MeshStandardMaterial({ color, roughness, metalness })
  const white = mat(0xf8fbfc)
  const wallSide = mat(0xc4d5da)
  const baseMaterial = mat(0x98adb5)
  const teal = mat(0x3cbbb7, 0.5, 0.25)
  const floorMaterial = mat(0xe2e9ec)
  const dark = mat(0x54717d, 0.5, 0.25)
  const light = new THREE.MeshStandardMaterial({ color: 0xa4f4e7, emissive: 0x39baae, emissiveIntensity: 0.3 })
  const point = (p: Point) => new THREE.Vector3((p.x - (maze.columns - 1) / 2) * cellWidth, 0, p.y - (maze.rows - 1) / 2)
  function box(geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
    return mesh
  }
  const deck = new RoundedBoxGeometry(maze.columns * cellWidth + 0.58, 0.24, maze.rows + 0.58, 2, 0.08)
  box(deck, baseMaterial, 0, -0.17, 0)
  box(new RoundedBoxGeometry(maze.columns * cellWidth + 0.48, 0.1, maze.rows + 0.48, 2, 0.05), white, 0, -0.015, 0)
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(cellWidth - 0.014, 0.045, 0.986), floorMaterial, maze.columns * maze.rows)
  tiles.receiveShadow = true
  const transform = new THREE.Object3D()
  for (let y = 0; y < maze.rows; y++) {
    for (let x = 0; x < maze.columns; x++) {
      transform.position.copy(point({ x, y })).setY(0.03)
      transform.updateMatrix()
      tiles.setMatrixAt(y * maze.columns + x, transform.matrix)
      tiles.setColorAt(y * maze.columns + x, new THREE.Color((x + y) % 2 === 0 ? 0xffffff : 0xf4f8fa))
    }
  }
  scene.add(tiles)

  // Thin modular walls correspond exactly to the logical edges, not full blocked tiles.
  const walls: Array<{ x: number; z: number; rotate: number }> = []
  for (let y = 0; y < maze.rows; y++) {
    for (let x = 0; x < maze.columns; x++) {
      const p = point({ x, y })
      if (!canMove(maze, { x, y }, 'up')) walls.push({ x: p.x, z: p.z - 0.5, rotate: 0 })
      if (!canMove(maze, { x, y }, 'left')) walls.push({ x: p.x - cellWidth / 2, z: p.z, rotate: Math.PI / 2 })
      if (y === maze.rows - 1) walls.push({ x: p.x, z: p.z + 0.5, rotate: 0 })
      if (x === maze.columns - 1) walls.push({ x: p.x + cellWidth / 2, z: p.z, rotate: Math.PI / 2 })
    }
  }
  const instanced = (geometry: THREE.BufferGeometry, material: THREE.Material, height: number, offset = 0) => {
    const mesh = new THREE.InstancedMesh(geometry, material, walls.length)
    walls.forEach((wall, index) => {
      transform.position.set(wall.x, height, wall.z)
      transform.rotation.set(0, wall.rotate, 0)
      transform.scale.set(wall.rotate === 0 ? cellWidth : 1, 1, 1)
      if (offset) transform.translateZ(offset)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
  }
  instanced(new RoundedBoxGeometry(0.996, 0.43, 0.15, 2, 0.035), wallSide, 0.265)
  instanced(new RoundedBoxGeometry(0.93, 0.30, 0.166, 2, 0.018), white, 0.29)
  instanced(new THREE.BoxGeometry(0.82, 0.025, 0.17), teal, 0.13)
  instanced(new RoundedBoxGeometry(1.0, 0.055, 0.18, 2, 0.018), white, 0.49)
  instanced(new THREE.BoxGeometry(0.04, 0.028, 0.178), dark, 0.32, 0)

  const labels: HTMLSpanElement[] = []
  const beaconObjects: THREE.Mesh[] = []
  const ringGeometry = new THREE.TorusGeometry(0.255, 0.025, 6, 28)
  maze.beacons.forEach((cell, index) => {
    const p = point(cell)
    box(new THREE.CylinderGeometry(0.34, 0.38, 0.06, 32), dark, p.x, 0.1, p.z)
    box(new THREE.CylinderGeometry(0.29, 0.33, 0.06, 32), teal, p.x, 0.15, p.z)
    const ring = new THREE.Mesh(ringGeometry, light)
    ring.rotation.x = Math.PI / 2
    ring.position.set(p.x, 0.2, p.z)
    scene.add(ring)
    box(new THREE.CylinderGeometry(0.13, 0.18, 0.07, 20), white, p.x, 0.195, p.z)
    const gem = box(new THREE.OctahedronGeometry(0.095), light, p.x, 0.36, p.z)
    beaconObjects.push(gem)
    const label = document.createElement('span')
    label.className = options.labelClass
    label.textContent = ['A', 'B', 'C'][index]
    label.setAttribute('aria-hidden', 'true')
    host.appendChild(label)
    labels.push(label)
  })

  // A lightweight halo identifies the player even when a wall is in front.
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.29, 28), new THREE.MeshBasicMaterial({ color: 0x138b8f, side: THREE.DoubleSide }))
  halo.rotation.x = -Math.PI / 2
  scene.add(halo)
  const shield = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12), new THREE.MeshBasicMaterial({
    color: 0x91efe2, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.BackSide,
  }))
  shield.scale.set(1, 1.3, 1)
  scene.add(shield)
  const impactRing = new THREE.Mesh(new THREE.RingGeometry(0.27, 0.33, 28), new THREE.MeshBasicMaterial({
    color: 0xf39a86, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
  }))
  impactRing.rotation.x = -Math.PI / 2
  scene.add(impactRing)
  let lastCollisions = 0
  let impactAge = 1
  const impactPosition = new THREE.Vector3()
  let avatars: ReturnType<typeof createAvatar>[] = []
  const assets: Awaited<ReturnType<typeof loadAvatar>>[] = []
  const definitions = [playerAvatarDefinition(options.avatar), ...maze.enemies.map((enemy) => enemyDefinitions[enemy.kind])]

  function releaseResources(root: THREE.Object3D) {
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of materials) {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose()
        material.dispose()
      }
    })
  }
  void Promise.all(definitions.map(async (definition) => {
    const asset = await loadAvatar(definition)
    if (disposed) releaseResources(asset.scene)
    else assets.push(asset)
    return asset
  })).then((loaded) => {
    if (disposed) return
    avatars = loaded.map((asset, index) => createAvatar(asset, definitions[index]))
    avatars.forEach((avatar) => scene.add(avatar.root))
    ready = true
    options.onReady()
  }).catch(() => { if (!disposed) options.onError('Failed to load 3D models. Check your connection and try again.') })

  function resize() {
    const width = host.clientWidth
    const height = host.clientHeight
    if (!width || !height) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.lowQuality ? 1 : width < 700 ? 1.25 : 1.65))
    renderer.setSize(width, height)
    const aspect = width / height
    const vertical = Math.max((maze.rows * 0.885 + 1.1), (maze.columns * cellWidth + 0.95) / aspect)
    camera.left = -vertical * aspect / 2
    camera.right = vertical * aspect / 2
    const labelClearance = height < 300 ? 0.5 : 0.12
    camera.top = vertical / 2 + labelClearance
    camera.bottom = -vertical / 2 + labelClearance
    camera.updateProjectionMatrix()
    scene.updateMatrixWorld(true)
    maze.beacons.forEach((cell, index) => {
      const p = point(cell).setY(0.7).project(camera)
      labels[index].style.left = `${(p.x + 1) * width / 2}px`
      labels[index].style.top = `${(-p.y + 1) * height / 2}px`
    })
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  resize()
  const contextLost = (event: Event) => {
    event.preventDefault()
    session.pause()
    options.onError('Graphic context is lost. Turn on lighter graphics or restart the game.')
  }
  renderer.domElement.addEventListener('webglcontextlost', contextLost)

  function render(now: number) {
    if (disposed) return
    frame = requestAnimationFrame(render)
    if (options.lowQuality && previous && now - previous < 1000 / 30 - 1) return
    const dt = previous ? Math.min((now - previous) / 1000, 0.1) : 0
    previous = now
    if (document.hidden) return
    const beforeStep = point(actorPosition(session.player))
    if (ready) session.step(dt)
    if (session.collisions !== lastCollisions) {
      lastCollisions = session.collisions
      impactPosition.copy(beforeStep)
      impactAge = 0
    }
    if (session.status === 'playing' || session.status === 'lost') impactAge += dt
    const actors = [session.player, ...session.enemies]
    avatars.forEach((avatar, index) => {
      const actor = actors[index]
      const p = point(actorPosition(actor))
      avatar.root.position.set(p.x, 0.07, p.z)
      const active = session.status === 'playing'
      const cellSpeed = index === 0 ? 2.8 : maze.enemies[index - 1].speed
      const worldSpeed = cellSpeed * (actor.facing === 'left' || actor.facing === 'right' ? cellWidth : 1)
      avatar.update(active || session.status === 'ready' ? dt : 0, active && Boolean(actor.next), session.status === 'ready' ? 0 : angles[actor.facing], worldSpeed)
    })
    const player = point(actorPosition(session.player))
    halo.position.set(player.x, 0.069, player.z)
    halo.scale.setScalar(session.immunity > 0 && !reducedMotion ? 1 + Math.sin(now * 0.006) * 0.1 : 1)
    shield.position.set(player.x, 0.62, player.z)
    shield.visible = session.immunity > 0 && session.status === 'playing'
    impactRing.position.copy(impactPosition).setY(0.08)
    impactRing.visible = impactAge < 0.65 && !reducedMotion
    impactRing.scale.setScalar(1 + impactAge * 3)
    ;(impactRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.65 * (1 - impactAge / 0.65))
    beaconObjects.forEach((gem, index) => {
      if (!reducedMotion && session.status !== 'paused') {
        gem.rotation.y = now * 0.001
        gem.position.y = 0.36 + Math.sin(now * 0.002 + index) * 0.025
      }
    })
    if (now - lastHud > 150 || lastStatus !== session.status) {
      options.onTick()
      lastHud = now
      lastStatus = session.status
    }
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(render)
  return {
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      avatars.forEach((avatar) => avatar.dispose())
      releaseResources(scene)
      assets.forEach((asset) => releaseResources(asset.scene))
      renderer.dispose()
      renderer.domElement.remove()
      labels.forEach((label) => label.remove())
    },
  }
}
