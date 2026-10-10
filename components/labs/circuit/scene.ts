import * as T from 'three'
import { limits, type CircuitSession, type Dial } from '@/lib/circuit-lab/session'

export const artwork = { width: 1584, height: 993 }
export type Point = { x: number; y: number }
export const leads = [
  { name: 'Red lead', terminal: 'Switch terminal', color: '#ae1820', path: [[453, 592], [419, 664], [465, 712], [612, 708]], loose: [525, 674] },
  { name: 'Rheostat lead', terminal: 'Left rheostat terminal', color: '#792122', path: [[833, 708], [926, 726], [1000, 727], [1085, 698]], loose: [982, 755] },
  { name: 'Lamp lead', terminal: 'Right lamp terminal', color: '#252a32', path: [[1320, 700], [1358, 639], [1200, 565], [1019, 545]], loose: [1127, 556] },
  { name: 'Return lead', terminal: 'Negative supply terminal', color: '#252a32', path: [[847, 545], [807, 613], [708, 632], [612, 592]], loose: [703, 662] },
]
const fixed = { voltage: [599, 537], resistance: [1224, 651], switch: [740, 673], voltageReadout: [506, 533], resistanceReadout: [1197, 618], currentReadout: [858, 828], pet: [1403, 272], avatar: [263, 355], notebook: [165, 846] }
export type SceneFrame = { anchors: Record<string, Point>; selected: number | null; dragging: 'wire' | Dial | null; hover: string | null; reacting: boolean }
type Callbacks = { frame: (frame: SceneFrame) => void; ready: () => void; error: (text: string) => void; hint: () => void }
type Pointer = { clientX: number; clientY: number; pointerId: number }

export function createCircuitScene(host: HTMLDivElement, session: CircuitSession, callbacks: Callbacks) {
  let disposed = false, loaded = false, frame = 0, previous = 0, lastHud = 0, selected: number | null = null, hover: string | null = null
  let reaction = 0, glow = 0, bladeAngle = .55, lastCurrent = 0, elapsedFlow = 0
  let drag: { kind: 'wire' | Dial; id: number; start: Point; point: Point; value: number; moved: boolean; wasConnected: boolean } | null = null
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.domElement.setAttribute('role', 'img')
  renderer.domElement.setAttribute('aria-label', 'Circuit in a tram depot: supply, switch, rheostat and lamp. Connect terminals and turn the instrument knobs.')
  host.appendChild(renderer.domElement)
  const scene = new T.Scene(), camera = new T.OrthographicCamera(0, artwork.width, artwork.height, 0, .1, 1000)
  camera.position.z = 300
  scene.add(new T.AmbientLight('#dbe8ff', 1.4))
  const key = new T.DirectionalLight('#ffe0a9', 3); key.position.set(-250, 1200, 500); scene.add(key)
  const geometries: T.BufferGeometry[] = [], materials: T.Material[] = [], textures: T.Texture[] = []
  const at = (object: T.Object3D, x: number, y: number, z = 5) => object.position.set(x, artwork.height - y, z)
  const world = (p: number[], z = 5) => new T.Vector3(p[0], artwork.height - p[1], z)
  function mesh(geometry: T.BufferGeometry, material: T.Material, parent: T.Object3D = scene) {
    geometries.push(geometry); materials.push(material)
    const object = new T.Mesh(geometry, material); parent.add(object); return object
  }
  const uniforms = { time: { value: 0 }, motion: { value: 1 }, reaction: { value: 0 }, glow: { value: 0 }, voltageAngle: { value: 0 }, resistanceAngle: { value: 0 }, litMap: { value: null as T.Texture | null } }
  const plateMaterial = new T.MeshBasicMaterial({ toneMapped: false })
  plateMaterial.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + [
      'uniform float time,motion,reaction,glow,voltageAngle,resistanceAngle; uniform sampler2D litMap;',
      'float region(vec2 p,vec2 c,vec2 r){return 1.0-smoothstep(0.4,1.0,length((p-c)/r));}',
      'vec2 turn(vec2 p,vec2 c,vec2 r,float angle){vec2 q=(p-c)/r;float a=angle*(1.0-smoothstep(0.82,1.0,length(q)));return c+mat2(cos(a),-sin(a),sin(a),cos(a))*q*r;}',
    ].join('\n'))
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', [
      'vec2 p=vec2(vMapUv.x*1584.0,(1.0-vMapUv.y)*993.0);',
      'float boy=region(p,vec2(272.0,276.0),vec2(166.0,164.0));p.y-=sin(time*1.55)*1.7*boy*motion;',
      'float dog=region(p,vec2(1420.0,236.0),vec2(92.0,104.0));',
      'p.x-=(sin(time*.65)*.9+sin(reaction*3.14159)*3.0)*dog*motion;',
      'p.y-=(sin(time*1.2)*.8+sin(reaction*3.14159)*2.0)*dog*motion;',
      'p=turn(p,vec2(599.0,537.0),vec2(26.0,25.0),voltageAngle);',
      'p=turn(p,vec2(1224.0,651.0),vec2(35.0,33.0),resistanceAngle);',
      'vec2 uv=vec2(p.x/1584.0,1.0-p.y/993.0);',
      'vec4 photo=texture2D(map,uv);vec4 lit=texture2D(litMap,uv);',
      'float lamp=region(p,vec2(936.0,412.0),vec2(180.0,265.0));',
      'float pool=region(p,vec2(944.0,693.0),vec2(330.0,255.0));',
      'photo.rgb=mix(photo.rgb,lit.rgb,glow*max(lamp,pool));diffuseColor*=photo;',
    ].join('\n'))
  }
  at(mesh(new T.PlaneGeometry(artwork.width, artwork.height), plateMaterial), artwork.width / 2, artwork.height / 2, 0)
  const blade = new T.Group(); scene.add(blade); at(blade, 677, 681, 12)
  const bladeMaterial = new T.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false })
  const bladeSprite = mesh(new T.PlaneGeometry(146, 146 / 3), bladeMaterial, blade)
  bladeSprite.position.set(146 * (.5 - .17), 146 / 3 * (.53 - .5), 0)

  const cables = leads.map(lead => {
    const material = new T.MeshStandardMaterial({ color: lead.color, roughness: .38, metalness: .05 })
    const object = mesh(new T.BufferGeometry(), material)
    const plug = mesh(new T.SphereGeometry(6, 12, 8), new T.MeshStandardMaterial({ color: '#a87935', metalness: .75, roughness: .3 }))
    const dots = Array.from({ length: 6 }, () => mesh(new T.CircleGeometry(2.5, 12), new T.MeshBasicMaterial({ color: '#ffdd91', transparent: true, opacity: .85, depthWrite: false })))
    return { object, plug, dots, curve: new T.CatmullRomCurve3(), endpoint: { x: 0, y: 0 }, signature: '' }
  })
  function updateCable(id: number) {
    const lead = leads[id], cable = cables[id], isDragged = drag?.kind === 'wire' && drag.id === id && drag.moved
    const endpoint = isDragged ? [drag!.point.x, drag!.point.y] : session.connected[id] ? lead.path.at(-1)! : lead.loose
    const signature = endpoint.join(':') + ':' + session.connected[id]
    if (signature === cable.signature) return
    cable.signature = signature; cable.endpoint = { x: endpoint[0], y: endpoint[1] }
    const points = lead.path.map(p => [...p]); points[points.length - 1] = endpoint
    if (!session.connected[id] || isDragged) points[points.length - 2] = [(points[0][0] + endpoint[0]) / 2, Math.max(points[0][1], endpoint[1]) + 35]
    cable.curve = new T.CatmullRomCurve3(points.map(p => world(p, 6)))
    cable.object.geometry.dispose(); cable.object.geometry = new T.TubeGeometry(cable.curve, 40, 4, 8, false)
    at(cable.plug, endpoint[0], endpoint[1], 8)
  }
  const loader = new T.TextureLoader()
  Promise.all(['depot-off-v2.png', 'depot-on-v2.png', 'switch-blade-v1.png'].map(file => loader.loadAsync('/game-assets/circuit/' + file))).then(([off, on, lever]) => {
    if (disposed) { off.dispose(); on.dispose(); lever.dispose(); return }
    for (const texture of [off, on, lever]) { texture.colorSpace = T.SRGBColorSpace; textures.push(texture) }
    plateMaterial.map = off; uniforms.litMap.value = on; plateMaterial.needsUpdate = true
    bladeMaterial.map = lever; bladeMaterial.needsUpdate = true; loaded = true; callbacks.ready()
  }).catch(() => { if (!disposed) callbacks.error('Could not load the depot. Reload the page.') })
  function point(event: { clientX: number; clientY: number }): Point {
    const box = host.getBoundingClientRect()
    return { x: (event.clientX - box.left) / box.width * artwork.width, y: (event.clientY - box.top) / box.height * artwork.height }
  }
  function selectWire(id: number) {
    if (session.connected[id]) session.connect(id, false)
    selected = selected === id ? null : id
  }
  function move(event: PointerEvent) {
    if (!drag) return
    const p = point(event); drag.point = p
    if (Math.hypot(p.x - drag.start.x, p.y - drag.start.y) > 5) {
      if (!drag.moved && drag.kind === 'wire') { session.connect(drag.id, false); selected = drag.id }
      drag.moved = true
    }
    if (drag.kind !== 'wire' && drag.moved) {
      const range = limits[drag.kind]
      session.dial(drag.kind, drag.value + (p.x - drag.start.x + drag.start.y - p.y) / 180 * (range.max - range.min))
    }
  }
  function end(event: PointerEvent) {
    if (!drag) return
    if (drag.kind === 'wire') {
      if (event.type === 'pointercancel') { session.connect(drag.id, drag.wasConnected); selected = null }
      else if (!drag.moved) selectWire(drag.id)
      else {
        const target = leads[drag.id].path.at(-1)!, tolerance = Math.max(30, 23 * artwork.width / host.clientWidth)
        const connected = Math.hypot(drag.point.x - target[0], drag.point.y - target[1]) < tolerance
        session.connect(drag.id, connected); selected = connected ? null : drag.id
      }
    } else if (event.type !== 'pointercancel') session.record()
    drag = null
    if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId)
  }
  renderer.domElement.addEventListener('pointermove', move); renderer.domElement.addEventListener('pointerup', end); renderer.domElement.addEventListener('pointercancel', end)
  const lost = (event: Event) => { event.preventDefault(); callbacks.error('The graphics scene stopped. Reload the page.') }
  renderer.domElement.addEventListener('webglcontextlost', lost)
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
    if (renderer.getPixelRatio() !== Math.min(devicePixelRatio, 2)) resize()
    const result = session.result(), targetGlow = Math.sqrt(result.power / 12)
    if (result.current > 0 && lastCurrent === 0) reaction = 1
    lastCurrent = result.current; reaction = Math.max(0, reaction - dt * .65)
    const ease = reduced.matches ? 1 : 1 - Math.exp(-dt * 14)
    glow += (targetGlow - glow) * ease; bladeAngle += ((session.switchClosed ? -.25 : .55) - bladeAngle) * ease
    uniforms.time.value = now / 1000; uniforms.motion.value = reduced.matches ? 0 : 1
    uniforms.reaction.value = reaction; uniforms.glow.value = glow
    uniforms.voltageAngle.value = (session.voltage - 9) / 9 * 4.2; uniforms.resistanceAngle.value = session.resistance / 36 * 4.2
    blade.rotation.z = bladeAngle
    if (!reduced.matches) elapsedFlow += dt * result.current * .24
    cables.forEach((cable, id) => {
      updateCable(id)
      cable.dots.forEach((dot, j) => { dot.visible = result.current > 0; dot.position.copy(cable.curve.getPointAt((j / 6 + elapsedFlow) % 1)); dot.position.z = 12 })
    })
    renderer.render(scene, camera)
    if (now - lastHud > 32) {
      lastHud = now
      const anchors: Record<string, Point> = {}, anchor = (id: string, p: number[]) => { anchors[id] = { x: p[0] / artwork.width * host.clientWidth, y: p[1] / artwork.height * host.clientHeight } }
      Object.entries(fixed).forEach(([id, p]) => anchor(id, p))
      leads.forEach((lead, id) => { anchor('lead' + id, [cables[id].endpoint.x, cables[id].endpoint.y]); anchor('terminal' + id, lead.path.at(-1)!) })
      callbacks.frame({ anchors, selected, dragging: drag?.kind ?? null, hover, reacting: reaction > 0 })
    }
  }
  frame = requestAnimationFrame(animate)
  return {
    selectWire,
    connectWire(id: number) { if (selected === id) { session.connect(id, true); selected = null } },
    beginWire(id: number, event: Pointer) { const p = point(event); drag = { kind: 'wire', id, start: p, point: p, value: 0, moved: false, wasConnected: session.connected[id] }; renderer.domElement.setPointerCapture(event.pointerId) },
    beginDial(kind: Dial, event: Pointer) { const p = point(event); drag = { kind, id: 0, start: p, point: p, value: session[kind], moved: false, wasConnected: false }; renderer.domElement.setPointerCapture(event.pointerId) },
    inspect(id: string | null) { hover = id },
    greet() { reaction = 1; callbacks.hint() },
    reset() { selected = null; drag = null; reaction = 0; hover = null },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect()
      renderer.domElement.removeEventListener('pointermove', move); renderer.domElement.removeEventListener('pointerup', end); renderer.domElement.removeEventListener('pointercancel', end); renderer.domElement.removeEventListener('webglcontextlost', lost)
      cables.forEach(c => c.object.geometry.dispose()); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
      renderer.dispose(); renderer.domElement.remove()
    },
  }
}
