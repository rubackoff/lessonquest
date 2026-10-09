import * as T from 'three'
import { createAvatar, loadAvatar, playerAvatarDefinition } from '@/lib/avatar/avatar'
import type { AvatarProfile } from '@/lib/avatar/profile'
import { anchors } from '@/lib/expedition/content'
import type { ExpeditionSession } from '@/lib/expedition/session'
import { lowGraphics } from '@/lib/graphics'

export function createExpeditionView(host: HTMLDivElement, session: ExpeditionSession, profile: AvatarProfile,
  onReady: () => void, onTick: () => void, onError: () => void) {
  let disposed = false, frame = 0, previous = 0, lastHud = 0, visible = true, failed = false
  let actor: ReturnType<typeof createAvatar> | undefined
  const low = lowGraphics(), reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: !low, powerPreference: 'low-power' })
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.setClearColor(0, 0)
  renderer.domElement.setAttribute('role', 'img'); renderer.domElement.setAttribute('aria-label', 'Your character and three pets on an expedition')
  host.appendChild(renderer.domElement)
  const scene = new T.Scene(), camera = new T.OrthographicCamera(-10, 10, 10, -10, .1, 70)
  camera.position.set(0, 20, 12); camera.lookAt(0, 0, 0); camera.updateMatrixWorld()
  scene.add(new T.HemisphereLight(0xffffff, 0x71858b, 2.5))
  const light = new T.DirectionalLight(0xfff3dd, 2); light.position.set(-8, 15, 8); scene.add(light)
  const screenUp = new T.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
  const position = (x: number, y: number) => screenUp.clone().multiplyScalar((50 - y) / 5).add(new T.Vector3((x - 50) / 5, 0, 0))
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), textures = new Set<T.Texture>(), pets: T.Sprite[] = []
  const definition = playerAvatarDefinition(profile, 1.1)
  const loader = new T.TextureLoader()
  Promise.all([loadAvatar(definition), Promise.all([0, 1, 2].map(i => loader.loadAsync(`/game-assets/character-heist/pet-${i}.webp`)))]).then(([asset, images]) => {
    asset.scene.traverse(object => {
      if (!(object instanceof T.Mesh)) return
      geometries.add(object.geometry)
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material); for (const value of Object.values(material)) if (value instanceof T.Texture) textures.add(value)
      }
    })
    images.forEach(t => { t.colorSpace = T.SRGBColorSpace; textures.add(t) })
    if (disposed) { geometries.forEach(v => v.dispose()); materials.forEach(v => v.dispose()); textures.forEach(v => v.dispose()); return }
    actor = createAvatar(asset, definition); scene.add(actor.root)
    images.forEach(texture => {
      const material = new T.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, toneMapped: false }); materials.add(material)
      const pet = new T.Sprite(material); pet.scale.set(.62, .62 * texture.image.height / texture.image.width, 1); pets.push(pet); scene.add(pet)
    })
    onReady()
  }).catch(() => { if (!disposed) { failed = true; onError() } })
  const resize = () => { renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1 : 2)); renderer.setSize(host.clientWidth, host.clientHeight) }
  const observer = new ResizeObserver(resize); observer.observe(host); resize()
  const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting }); visibility.observe(host)
  const lost = (event: Event) => { event.preventDefault(); failed = true; session.pause(); onTick(); onError() }
  renderer.domElement.addEventListener('webglcontextlost', lost)
  const pointOnRoute = (progress: number) => {
    const points = [{ x: 26, y: 73 }, anchors.a, ...(session.route === 'via' ? [anchors.c] : []), anchors.b, { x: 64, y: 23 }]
    const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y))
    let distance = Math.max(0, Math.min(1, progress)) * lengths.reduce((a, b) => a + b, 0)
    for (let i = 0; i < lengths.length; i++) {
      if (distance <= lengths[i] || i === lengths.length - 1) {
        const fraction = distance / lengths[i]
        return { x: points[i].x + (points[i + 1].x - points[i].x) * fraction, y: points[i].y + (points[i + 1].y - points[i].y) * fraction }
      }
      distance -= lengths[i]
    }
    return points[0]
  }
  const animate = (time: number) => {
    if (disposed) return
    frame = requestAnimationFrame(animate); if (failed || (low && previous && time - previous < 1000 / 30 - 1)) return
    const delta = previous ? Math.max(0, Math.min((time - previous) / 1000, .1)) : 0; previous = time
    if (actor && !document.hidden) session.tick(delta)
    if (actor && visible) {
      // The team finishes only once the trailing pet has reached the bank.
      const teamProgress = session.crossing * 1.15
      const progress = Math.min(1, teamProgress)
      const moving = session.phase === 'crossing' && progress < 1 && !session.paused && !document.hidden
      const at = pointOnRoute(progress), next = pointOnRoute(Math.min(1, progress + .005)), current = position(at.x, at.y), ahead = position(next.x, next.y)
      actor.root.position.copy(current)
      const angle = progress < 1 ? Math.atan2(ahead.x - current.x, ahead.z - current.z) : Math.PI
      actor.update(!session.paused && !document.hidden && !reduced.matches ? delta : 0, moving && !reduced.matches, angle, session.route === 'direct' ? 1.7 : 2.2)
      pets.forEach((pet, i) => {
        const p = pointOnRoute(Math.max(0, teamProgress - .045 * (i + 1)))
        pet.position.copy(position(p.x + (i - 1) * 1.8, p.y + 2.8))
      })
      renderer.render(scene, camera)
    }
    if (time - lastHud > 100) { onTick(); lastHud = time }
  }
  frame = requestAnimationFrame(animate)
  return { dispose() { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); visibility.disconnect(); renderer.domElement.removeEventListener('webglcontextlost', lost)
    actor?.dispose(); geometries.forEach(v => v.dispose()); materials.forEach(v => v.dispose()); textures.forEach(v => v.dispose()); renderer.dispose(); renderer.domElement.remove() } }
}
