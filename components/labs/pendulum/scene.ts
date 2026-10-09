import * as T from 'three'
import type { PendulumSession } from '@/lib/pendulum-lab/session'

export const artwork = { width: 1586, height: 992 }
export type Anchor = { x: number; y: number; visible: boolean }
export type SceneFrame = { anchors: Record<string, Anchor>; hover: string | null; drag: string | null }
type Callbacks = { frame: (frame: SceneFrame) => void; ready: () => void; error: (message: string) => void; hint: () => void; notebook: () => void }
const pivots = [{ x: 545, y: 57 }, { x: 945, y: 52 }]
const knobs = [{ x: 377, y: 346 }, { x: 1094, y: 346 }]
const masses = [.5, 1, 2]
const fixed: Record<string, { x: number; y: number }> = {
  length0: { x: 416, y: 156 }, length1: { x: 1055, y: 158 },
  knob0: knobs[0], knob1: knobs[1], period0: { x: 556, y: 750 }, period1: { x: 977, y: 744 },
  play: { x: 773, y: 748 }, mass0: { x: 27, y: 675 }, mass1: { x: 122, y: 654 }, mass2: { x: 229, y: 635 },
  avatar: { x: 1258, y: 435 }, pet: { x: 1460, y: 466 }, notebook: { x: 142, y: 900 },
}

// Image coordinates are scene units, so all moving parts share the plate's camera.
export function createPendulumScene(host: HTMLDivElement, session: PendulumSession, callbacks: Callbacks) {
  let disposed = false, loaded = false, frame = 0, previous = 0, lastHud = 0, hover: string | null = null
  let drag: { id: string; x: number; y: number; length: number; moved: boolean } | null = null
  let avatarReaction = 0, petReaction = 0
  let lastRevision = session.revision
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.domElement.setAttribute('role', 'img')
  renderer.domElement.setAttribute('aria-label', 'Pendulums in the workshop. Pull the ball, turn the length handle or transfer the weight to the ball.')
  host.appendChild(renderer.domElement)
  const scene = new T.Scene(), camera = new T.OrthographicCamera(0, artwork.width, artwork.height, 0, .1, 100)
  camera.position.z = 20
  const textures: T.Texture[] = [], geometries: T.BufferGeometry[] = [], materials: T.Material[] = []
  const mesh = (geometry: T.BufferGeometry, material: T.Material, parent: T.Object3D = scene) => {
    geometries.push(geometry); materials.push(material)
    const item = new T.Mesh(geometry, material); parent.add(item); return item
  }
  const at = (object: T.Object3D, x: number, y: number, z = 2) => object.position.set(x, artwork.height - y, z)
  const uniforms = { time: { value: 0 }, motion: { value: 1 }, gaze: { value: 0 }, avatar: { value: 0 }, pet: { value: 0 }, knobs: { value: new T.Vector2() } }
  const plateMaterial = new T.MeshBasicMaterial({ toneMapped: false })
  plateMaterial.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + [
      'uniform float time, motion, gaze, avatar, pet;',
      'uniform vec2 knobs;',
      'float regionWeight(vec2 p, vec2 c, vec2 r) { return 1.0-smoothstep(0.45,1.0,length((p-c)/r)); }',
      'vec2 dial(vec2 p, vec2 c, vec2 r, float a) {',
      'vec2 q=(p-c)/r; float w=1.0-smoothstep(0.80,1.0,length(q));',
      'float s=sin(a*w), co=cos(a*w); return c+mat2(co,-s,s,co)*q*r; }',
    ].join('\n'))
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', [
      'vec2 p=vec2(vMapUv.x*1586.0,(1.0-vMapUv.y)*992.0);',
      'float a=regionWeight(p,vec2(1270.0,385.0),vec2(148.0,146.0));',
      'float f=regionWeight(p,vec2(1468.0,437.0),vec2(123.0,139.0));',
      'float body=regionWeight(p,vec2(1240.0,502.0),vec2(146.0,93.0));',
      'p.x-=(sin(time*0.67)*2.0+gaze*3.0+sin(avatar*7.0)*avatar*3.0)*a*motion;',
      'p.y-=(sin(time*1.65)*2.2+sin(avatar*9.0)*avatar*11.0)*a*motion;',
      'p.y-=sin(time*1.65)*1.1*body*motion;',
      'p.x-=(gaze*3.0+sin(time*0.8)*1.5)*f*motion;',
      'float tilt=sin(pet*3.14159)*0.17*motion;',
      'vec2 head=p-vec2(1460.0,472.0);',
      'p=mix(p,vec2(1460.0,472.0)+mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*head,f);',
      'p.y-=(sin(time*1.9+0.8)*2.0+sin(pet*8.0)*pet*15.0)*f*motion;',
      'float ear=regionWeight(p,vec2(1543.0,377.0),vec2(43.0,57.0));',
      'p.x-=(sin(time*12.0)*pow(max(0.0,sin(time*0.6)),18.0)*4.0+sin(pet*10.0)*pet*9.0)*ear*motion;',
      'p=dial(p,vec2(370.0,345.0),vec2(34.0,43.0),knobs.x);',
      'p=dial(p,vec2(1106.0,347.0),vec2(25.0,41.0),knobs.y);',
      'diffuseColor*=texture2D(map,vec2(p.x/1586.0,1.0-p.y/992.0));',
    ].join('\n'))
  }
  const plate = mesh(new T.PlaneGeometry(artwork.width, artwork.height), plateMaterial)
  at(plate, artwork.width / 2, artwork.height / 2, 0)
  const bobs = [0, 1].map(() => {
    const group = new T.Group(); scene.add(group)
    const material = new T.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false })
    const sprite = mesh(new T.PlaneGeometry(605, 751), material, group); sprite.position.y = 116
    const cord = mesh(new T.CylinderGeometry(2.1, 2.1, 1, 8), new T.MeshBasicMaterial({ color: '#202323' }))
    const shine = mesh(new T.CylinderGeometry(.55, .55, 1, 6), new T.MeshBasicMaterial({ color: '#a6a39b' }))
    const guideGeometry = new T.BufferGeometry().setFromPoints(Array.from({ length: 49 }, () => new T.Vector3()))
    geometries.push(guideGeometry)
    const guideMaterial = new T.LineDashedMaterial({ color: '#ffffff', transparent: true, opacity: .52, dashSize: 7, gapSize: 7 })
    materials.push(guideMaterial)
    const guide = new T.Line(guideGeometry, guideMaterial); scene.add(guide)
    return { group, material, cord, shine, guide, guideGeometry, x: 0, y: 0, radius: 55 }
  })
  const loader = new T.TextureLoader()
  const ghost = new T.Group(); scene.add(ghost); ghost.visible = false
  const ghostMaterial = new T.MeshBasicMaterial({ transparent: true, opacity: .88, depthWrite: false, toneMapped: false })
  mesh(new T.PlaneGeometry(605, 751), ghostMaterial, ghost).position.y = 116
  Promise.all([loader.loadAsync('/game-assets/pendulum/workshop-plate-v4.png'), loader.loadAsync('/game-assets/pendulum/bobs-atlas-v4.png')]).then(([background, atlas]) => {
    if (disposed) { background.dispose(); atlas.dispose(); return }
    background.colorSpace = atlas.colorSpace = T.SRGBColorSpace
    textures.push(background, atlas); plateMaterial.map = background; plateMaterial.needsUpdate = true
    bobs.forEach((bob, i) => {
      const texture = atlas.clone(); texture.needsUpdate = true
      texture.repeat.set(605 / 1585, 751 / 992); texture.offset.set((i ? 866 : 109) / 1585, 1 - 865 / 992)
      textures.push(texture); bob.material.map = texture; bob.material.needsUpdate = true
    })
    loaded = true; callbacks.ready()
  }).catch(() => { if (!disposed) callbacks.error('Failed to load workshop. Refresh the page.') })
  function point(clientX: number, clientY: number) {
    const rect = host.getBoundingClientRect()
    return { x: (clientX - rect.left) / rect.width * artwork.width, y: (clientY - rect.top) / rect.height * artwork.height }
  }
  function pick(p: { x: number; y: number }) {
    const touchRadius = Math.max(36, 22 * artwork.width / host.clientWidth)
    for (let i = 0; i < 2; i++) {
      if (Math.hypot(p.x - bobs[i].x, p.y - bobs[i].y) < Math.max(bobs[i].radius + 15, touchRadius)) return 'bob' + i
      if (Math.hypot(p.x - knobs[i].x, p.y - knobs[i].y) < touchRadius + 14) return 'length' + i
    }
    for (let i = 0; i < 3; i++) { const a = fixed['mass' + i]; if (Math.hypot(p.x - a.x, p.y - a.y) < 48) return 'mass' + i }
    if (p.x > 1135 && p.x < 1370 && p.y > 270 && p.y < 590) return 'avatar'
    if (p.x > 1370 && p.y > 335 && p.y < 590) return 'pet'
    return null
  }
  function activate(id: string) {
    if (id === 'play') session.toggle()
    else if (id === 'avatar') avatarReaction = 1
    else if (id === 'pet') { petReaction = 1; callbacks.hint() }
    else if (id === 'notebook') callbacks.notebook()
    else if (id.startsWith('mass')) session.setMass(masses[Number(id.slice(-1))])
  }
  function begin(id: string, event: { clientX: number; clientY: number; pointerId: number }) {
    const p = point(event.clientX, event.clientY)
    drag = { id, ...p, length: session.settings[Number(id.slice(-1))]?.length ?? 1.5, moved: false }
    if (id.startsWith('bob') || id.startsWith('length')) { session.select(Number(id.slice(-1))); session.pause() }
    if (id.startsWith('mass')) {
      const mass = masses[Number(id.slice(-1))]
      ghostMaterial.map = bobs[mass === 2 ? 1 : 0].material.map; ghostMaterial.needsUpdate = true
      ghost.scale.setScalar(110 * Math.cbrt(mass) / 605)
    }
    renderer.domElement.setPointerCapture(event.pointerId)
  }
  const down = (event: PointerEvent) => { const id = pick(point(event.clientX, event.clientY)); if (id) { event.preventDefault(); begin(id, event) } }
  const move = (event: PointerEvent) => {
    const p = point(event.clientX, event.clientY)
    if (!drag) { hover = pick(p); renderer.domElement.style.cursor = hover ? (hover === 'avatar' || hover === 'pet' ? 'pointer' : 'grab') : 'default'; return }
    drag.moved ||= Math.hypot(p.x - drag.x, p.y - drag.y) > 4
    const index = Number(drag.id.slice(-1))
    if (drag.id.startsWith('length')) session.setLength(index, Math.min(1.8, drag.length + (p.y - drag.y) / 350))
    else if (drag.id.startsWith('bob')) {
      const pivot = pivots[index], angle = Math.atan2(p.x - pivot.x, p.y - pivot.y) * 180 / Math.PI
      session.pull(index, Math.round(T.MathUtils.clamp(angle, -35, 35)))
    }
    else if (drag.id.startsWith('mass') && drag.moved) { ghost.visible = true; at(ghost, p.x, p.y, 6) }
    renderer.domElement.style.cursor = 'grabbing'
  }
  const up = (event: PointerEvent) => {
    if (!drag) return
    if (event.type !== 'pointercancel') {
      if (drag.id.startsWith('bob') || drag.id.startsWith('length')) session.launch()
      else if (drag.id.startsWith('mass') && drag.moved) {
        const p = point(event.clientX, event.clientY), distances = bobs.map(b => Math.hypot(p.x - b.x, p.y - b.y))
        const index = distances[0] < distances[1] ? 0 : 1
        if (distances[index] < bobs[index].radius + 60) session.setMass(masses[Number(drag.id.slice(-1))], index)
      } else activate(drag.id)
    }
    drag = null; ghost.visible = false; renderer.domElement.style.cursor = 'default'
    if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId)
  }
  const leave = () => { if (!drag) hover = null }
  const lost = (event: Event) => { event.preventDefault(); session.pause(); callbacks.error('The stage stopped. Refresh the page.') }
  const visibility = () => { previous = 0 }
  renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointermove', move)
  renderer.domElement.addEventListener('pointerup', up); renderer.domElement.addEventListener('pointercancel', up)
  renderer.domElement.addEventListener('pointerleave', leave); renderer.domElement.addEventListener('webglcontextlost', lost)
  document.addEventListener('visibilitychange', visibility)
  function resize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(host.clientWidth, host.clientHeight)
    host.parentElement?.style.setProperty('--scene-scale', String(host.clientWidth / artwork.width))
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize()
  function animate(now: number) {
    if (disposed) return
    frame = requestAnimationFrame(animate)
    const dt = previous ? Math.min((now - previous) / 1000, .05) : 0; previous = now
    if (document.hidden || !loaded) return
    if (session.running && !drag) session.tick(dt)
    if (lastRevision !== session.revision) {
      lastRevision = session.revision
      if (session.lastAction === 'mass') { petReaction = 1; avatarReaction = .7 }
    }
    avatarReaction = Math.max(0, avatarReaction - dt * .7); petReaction = Math.max(0, petReaction - dt * .65)
    uniforms.time.value = now / 1000; uniforms.motion.value = reduced.matches ? 0 : 1
    uniforms.avatar.value = avatarReaction; uniforms.pet.value = petReaction; uniforms.gaze.value = Math.sin(session.states[session.selected].angle)
    uniforms.knobs.value.set((session.settings[0].length - 1.5) * 6, (session.settings[1].length - 1.5) * 6)
    const anchors: Record<string, Anchor> = {}
    const anchor = (id: string, x: number, y: number) => { anchors[id] = { x: x / artwork.width * host.clientWidth, y: y / artwork.height * host.clientHeight, visible: true } }
    Object.entries(fixed).forEach(([id, p]) => anchor(id, p.x, p.y))
    bobs.forEach((bob, i) => {
      const settings = session.settings[i], angle = session.states[i].angle, length = settings.length * 300, pivot = pivots[i]
      bob.radius = 55 * Math.cbrt(settings.mass)
      const scale = bob.radius * 2 / 605, cordLength = length - 450 * scale
      bob.x = pivot.x + Math.sin(angle) * length; bob.y = pivot.y + Math.cos(angle) * length
      at(bob.group, bob.x, bob.y, 4 + i * .1); bob.group.scale.setScalar(scale); bob.group.rotation.z = angle
      ;[bob.cord, bob.shine].forEach((cord, j) => {
        at(cord, pivot.x + Math.sin(angle) * cordLength / 2 + j, pivot.y + Math.cos(angle) * cordLength / 2, 2 + j * .1)
        cord.rotation.z = angle; cord.scale.y = cordLength
      })
      anchor('bob' + i, bob.x, bob.y + 3); anchor('angle' + i, pivot.x + (i ? -60 : 60), pivot.y + 260)
      const inspect = hover === 'bob' + i || drag?.id === 'bob' + i
      bob.guide.visible = inspect
      if (inspect) {
        const positions = bob.guideGeometry.attributes.position
        for (let j = 0; j < 49; j++) { const a = -.62 + j / 48 * 1.24; positions.setXYZ(j, pivot.x + Math.sin(a) * length, artwork.height - pivot.y - Math.cos(a) * length, 3) }
        positions.needsUpdate = true; bob.guideGeometry.computeBoundingSphere(); bob.guide.computeLineDistances()
      }
    })
    renderer.render(scene, camera)
    if (now - lastHud > 32) { lastHud = now; callbacks.frame({ anchors, hover, drag: drag?.id ?? null }) }
  }
  frame = requestAnimationFrame(animate)
  return {
    activate, begin, inspect: (id: string | null) => { hover = id },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect()
      renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointermove', move)
      renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointercancel', up)
      renderer.domElement.removeEventListener('pointerleave', leave); renderer.domElement.removeEventListener('webglcontextlost', lost)
      document.removeEventListener('visibilitychange', visibility)
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
      renderer.dispose(); renderer.domElement.remove()
    },
  }
}

