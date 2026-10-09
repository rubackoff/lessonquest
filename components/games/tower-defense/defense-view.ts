import * as T from 'three'
import { createAvatar, loadAvatar, playerAvatarDefinition } from '@/lib/avatar/avatar'
import type { AvatarProfile } from '@/lib/avatar/profile'
import { bubbleKinds, defensePads, pathPosition, shotCosts, towerRange, type DefenseSession } from '@/lib/tower-defense/session'
import { lowGraphics } from '@/lib/graphics'

/** Layered game artwork shares screen coordinates with targeting and the road. */
export function createDefenseView(host: HTMLDivElement, session: DefenseSession, profile: AvatarProfile,
  onReady: () => void, onTick: () => void, onError: () => void, onSelect: (index: number) => void, labelClass: string, onPlace: (index: number) => void) {
  let disposed = false, failed = false, frame = 0, previous = 0, lastHud = 0, visualTime = 0, visible = true
  let actor: ReturnType<typeof createAvatar> | undefined
  const textures = new Set<T.Texture>(), materials = new Set<T.Material>(), geometries = new Set<T.BufferGeometry>()
  const lowQuality = lowGraphics()
  const renderer = new T.WebGLRenderer({ antialias: !lowQuality, alpha: false, powerPreference: 'high-performance' })
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.setClearColor(0x258eab)
  renderer.domElement.setAttribute('role', 'img'); renderer.domElement.setAttribute('aria-label', 'Arena from above: long stone road, portal, towers, hero and pets at the base')
  host.appendChild(renderer.domElement)
  const scene = new T.Scene(), camera = new T.OrthographicCamera(-10, 10, 10, -10, .1, 70)
  camera.position.set(0, 20, 12); camera.lookAt(0, 0, 0); camera.updateMatrixWorld()
  scene.add(new T.HemisphereLight(0xffffff, 0x788c89, 2.4))
  const sun = new T.DirectionalLight(0xfff4df, 2); sun.position.set(-8, 15, 8); scene.add(sun)
  const screenUp = new T.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
  const toWorld = (x: number, z: number, target = new T.Vector3()) => target.copy(screenUp).multiplyScalar(-z).add(new T.Vector3(x, 0, 0))
  const sprite = (texture: T.Texture, width: number, x: number, z: number, order = 2) => {
    const material = new T.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false, toneMapped: false })
    materials.add(material)
    const object = new T.Sprite(material); object.position.copy(toWorld(x, z)); object.scale.set(width, width * texture.image.height / texture.image.width, 1)
    object.renderOrder = order; scene.add(object); return object
  }
  const towerSprites: T.Sprite[] = [], towerTextures: T.Texture[] = []
  const bubbleShape = new T.SphereGeometry(.5, 16, 12); geometries.add(bubbleShape)
  const aliens = Array.from({ length: 12 }, () => {
    const material = new T.MeshStandardMaterial({ color: '#b58bff', roughness: .12, metalness: .15, transparent: true, opacity: .88, depthWrite: false, depthTest: false })
    materials.add(material)
    const object = new T.Mesh(bubbleShape, material); object.visible = false; object.renderOrder = 4; scene.add(object); return object
  })
  const pads = defensePads.map((pad, index) => {
    const element = document.createElement('button'); element.className = labelClass; element.type = 'button'; element.dataset.pad = 'true'
    element.textContent = String(index + 1); element.setAttribute('aria-label', `Put in place ${index + 1}`)
    const click = () => onPlace(index); element.addEventListener('click', click); host.appendChild(element)
    return { element, click, pad }
  })
  const labels = defensePads.map((_, index) => {
    const element = document.createElement('button'); element.className = labelClass; element.type = 'button'
    element.setAttribute('aria-label', `Select tower ${index + 1} in the arena`)
    const click = () => onSelect(index); element.addEventListener('click', click); host.appendChild(element)
    return { element, click }
  })
  const beamShape = new T.CylinderGeometry(.035, .035, 1, 6); geometries.add(beamShape)
  const beams = Array.from({ length: 8 }, () => {
    const material = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false, depthWrite: false }); materials.add(material)
    const object = new T.Mesh(beamShape, material); object.visible = false; object.renderOrder = 5; scene.add(object); return object
  })
  const ringShape = new T.RingGeometry(.78, .82, 48); geometries.add(ringShape)
  const rings = defensePads.map(pad => {
    const material = new T.MeshBasicMaterial({ color: '#16aaa9', transparent: true, opacity: .5, side: T.DoubleSide, depthTest: false, depthWrite: false }); materials.add(material)
    const object = new T.Mesh(ringShape, material); object.quaternion.copy(camera.quaternion); object.position.copy(toWorld(pad.x, pad.z)); object.scale.setScalar(towerRange / .8)
    object.renderOrder = 1; scene.add(object); return object
  })
  const loader = new T.TextureLoader(), definition = playerAvatarDefinition(profile, 1.1)
  const urls = ['/game-assets/tower-defense/arena-long.webp',
    ...[0, 1, 2].map(index => `/game-assets/tower-defense/tower-${index}.webp`),
    ...[0, 1, 2].map(index => `/game-assets/character-heist/pet-${index}.webp`)]
  Promise.all([loadAvatar(definition), Promise.all(urls.map(url => loader.loadAsync(url)))]).then(([asset, loaded]) => {
    if (disposed) { loaded.forEach(texture => texture.dispose()); return }
    loaded.forEach(texture => { texture.colorSpace = T.SRGBColorSpace; textures.add(texture) })
    sprite(loaded[0], 20, 0, 0, -10)
    towerTextures.push(...loaded.slice(1, 4))
    defensePads.forEach(pad => towerSprites.push(sprite(loaded[1], 2.25, pad.x, pad.z - .6)))
    asset.scene.traverse(object => {
      if (!(object instanceof T.Mesh)) return
      geometries.add(object.geometry)
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material)
        for (const value of Object.values(material)) if (value instanceof T.Texture) textures.add(value)
      }
    })
    actor = createAvatar(asset, definition); actor.root.position.copy(toWorld(-.22, 7.3)); actor.root.renderOrder = 8
    actor.root.traverse(object => {
      if (!(object instanceof T.Mesh)) return
      object.renderOrder = 8
      const layer = (source: T.Material) => { const value = source.clone(); value.transparent = true; materials.add(value); return value }
      object.material = Array.isArray(object.material) ? object.material.map(layer) : layer(object.material)
    }); scene.add(actor.root)
    ;[[-.84, 7.17], [.38, 7.35], [.94, 7.16]].forEach(([x, z], index) => sprite(loaded[index + 4], .6, x, z - .27, 9))
    onReady()
  }).catch(() => { failed = true; onError() })
  const resize = () => {
    const width = host.clientWidth, height = host.clientHeight, aspect = width / Math.max(height, 1), half = Math.max(10, 10 / aspect)
    camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half; camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowQuality ? 1 : 2)); renderer.setSize(width, height)
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize()
  const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting }); visibility.observe(host)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)'), projected = new T.Vector3(), from = new T.Vector3(), to = new T.Vector3(), up = new T.Vector3(0, 1, 0)
  const lost = (event: Event) => { event.preventDefault(); failed = true; session.pause(); onTick(); onError() }
  renderer.domElement.addEventListener('webglcontextlost', lost)
  const animate = (time: number) => {
    if (disposed) return
    frame = requestAnimationFrame(animate); if (failed) return
    if (lowQuality && previous && time - previous < 1000 / 30 - 1) return
    const delta = previous ? Math.min((time - previous) / 1000, .1) : 0; previous = time
    if (actor && !document.hidden) session.tick(delta)
    const active = session.status !== 'paused' && !document.hidden
    if (active) visualTime += delta
    actor?.update(active && !reduced.matches ? delta : 0, false, Math.PI)
    aliens.forEach((object, index) => {
      const alien = session.aliens[index], waiting = ['ready', 'choosing', 'question', 'explanation', 'correct', 'wave-ready'].includes(session.status) && index < 3
      object.visible = Boolean(alien) || waiting
      const kind = bubbleKinds[(alien?.id ?? index) % 3]
      object.scale.setScalar(kind.size)
      object.material.color.set(alien && alien.slow > 0 ? '#8ee8ff' : kind.color)
      if (alien) {
        const at = pathPosition(alien.progress), hop = reduced.matches ? 0 : Math.abs(Math.sin(visualTime * 8 + alien.id)) * .045
        object.position.copy(toWorld(at.x, at.z - kind.size * .35 - hop))
      } else if (waiting) { object.position.copy(toWorld(-1.28 + (index - 1) * .65, -7.88)) }
    })
    pads.forEach(({ element, pad }, slot) => {
      element.hidden = session.placingTower === null || !session.canBuild
      element.disabled = session.placements.some((value, index) => value === slot && index !== session.placingTower)
      toWorld(pad.x, pad.z, projected).project(camera)
      element.style.left = `${(projected.x * .5 + .5) * host.clientWidth}px`; element.style.top = `${(-projected.y * .5 + .5) * host.clientHeight}px`
    })
    labels.forEach(({ element }, index) => {
      const tower = session.towerInfo(index), object = towerSprites[index], selected = index === session.selectedTower && session.status !== 'paused'
      const position = session.towerPosition(index)
      element.hidden = !position || session.placingTower !== null
      if (object) object.visible = Boolean(position)
      rings[index].visible = Boolean(position) && selected
      if (!position) return
      element.textContent = `${tower.name} · ${Math.floor(session.energy[index])}%`; element.disabled = !['ready', 'choosing', 'wave-ready', 'between', 'wave'].includes(session.status)
      element.setAttribute('aria-label', `Select ${tower.name} on site ${session.placements[index] + 1}`)
      rings[index].position.copy(toWorld(position.x, position.z)); rings[index].material.color.set(tower.color)
      if (object) {
        object.position.copy(toWorld(position.x, position.z - .6))
        object.material.map = towerTextures[session.types[index]]
        object.material.color.set(session.energy[index] < shotCosts[session.types[index]] ? '#879f9b' : '#ffffff')
        const shot = session.shots.some(item => item.tower === index), size = 2.25 + Math.min(4, session.levels[index] - 1) * .055
        object.scale.set(size, size * (shot && !reduced.matches ? .96 : 1), 1)
      }
      toWorld(position.x, position.z + .58, projected).project(camera)
      element.style.left = `${(projected.x * .5 + .5) * host.clientWidth}px`; element.style.top = `${(-projected.y * .5 + .5) * host.clientHeight}px`
    })
    beams.forEach((beam, index) => {
      const shot = session.shots[index]; beam.visible = Boolean(shot) && session.status === 'wave'
      if (!shot) return
      const tower = session.towerInfo(shot.tower), type = session.types[shot.tower], position = session.towerPosition(shot.tower)
      if (!position) { beam.visible = false; return }
      toWorld(position.x + (type === 0 ? .45 : type === 2 ? -.35 : 0), position.z - .8, from); toWorld(shot.x, shot.z - .25, to)
      beam.position.copy(from).add(to).multiplyScalar(.5); beam.scale.y = from.distanceTo(to); beam.quaternion.setFromUnitVectors(up, to.sub(from).normalize())
      beam.material.color.set(tower.color); beam.material.opacity = .35 + Math.min(.65, shot.ttl * 5)
    })
    if (visible) renderer.render(scene, camera)
    if (time - lastHud > 100) { onTick(); lastHud = time }
  }
  frame = requestAnimationFrame(animate)
  return { dispose() {
    disposed = true; cancelAnimationFrame(frame); observer.disconnect(); visibility.disconnect(); renderer.domElement.removeEventListener('webglcontextlost', lost)
    labels.forEach(({ element, click }) => { element.removeEventListener('click', click); element.remove() })
    pads.forEach(({ element, click }) => { element.removeEventListener('click', click); element.remove() })
    actor?.dispose(); textures.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); geometries.forEach(value => value.dispose())
    renderer.dispose(); renderer.domElement.remove()
  } }
}
