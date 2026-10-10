import * as T from 'three'
import { materials as samples } from '@/lib/refraction-lab/physics'
import type { RefractionSession } from '@/lib/refraction-lab/session'

export const artwork = { width: 1585, height: 992 }
export const opticalBoard = { x: 677, y: 326, radius: 267 }
export type Point = { x: number; y: number }
export type SceneFrame = { anchors: Record<string, Point>; hover: string | null; dragging: boolean; petReacting: boolean }
type Callbacks = { frame: (value: SceneFrame) => void; ready: () => void; error: (text: string) => void; hint: () => void }
const fixed = {
  incidence: { x: 470, y: 724 }, refraction: { x: 833, y: 723 },
  water: { x: 587, y: 718 }, glass: { x: 658, y: 718 }, diamond: { x: 727, y: 718 },
  power: { x: 968, y: 726 }, avatar: { x: 1270, y: 412 }, pet: { x: 205, y: 525 }, notebook: { x: 144, y: 868 },
}
const vertexShader = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }'

export function createRefractionScene(host: HTMLDivElement, session: RefractionSession, callbacks: Callbacks) {
  let disposed = false, loaded = false, frame = 0, previous = 0, lastHud = 0
  let dragging = false, hover: string | null = null, petReaction = 0, avatarReaction = 0, lastRevision = session.revision, wasTotal = false
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.domElement.setAttribute('role', 'img')
  renderer.domElement.setAttribute('aria-label', 'Optical bench on a lighthouse terrace. Move the laser around the circle to change the angle of incidence.')
  host.appendChild(renderer.domElement)
  const scene = new T.Scene(), camera = new T.OrthographicCamera(0, artwork.width, artwork.height, 0, .1, 100)
  camera.position.z = 20
  const geometries: T.BufferGeometry[] = [], materials: T.Material[] = [], textures: T.Texture[] = []
  function mesh(geometry: T.BufferGeometry, material: T.Material, parent: T.Object3D = scene) {
    geometries.push(geometry); materials.push(material)
    const object = new T.Mesh(geometry, material); parent.add(object); return object
  }
  const at = (object: T.Object3D, x: number, y: number, z = 2) => object.position.set(x, artwork.height - y, z)
  const world = (x: number, y: number, z = 2) => new T.Vector3(x, artwork.height - y, z)
  const photoUniforms = { time: { value: 0 }, motion: { value: 1 }, petReaction: { value: 0 }, avatarReaction: { value: 0 }, sampleKind: { value: 0 }, powerAngle: { value: .6 } }
  const plateMaterial = new T.MeshBasicMaterial({ toneMapped: false })
  plateMaterial.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, photoUniforms)
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + [
      'uniform float time, motion, petReaction, avatarReaction, sampleKind, powerAngle;',
      'float regionWeight(vec2 p,vec2 c,vec2 r){return 1.0-smoothstep(0.45,1.0,length((p-c)/r));}',
    ].join('\n'))
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', [
      'vec2 p=vec2(vMapUv.x*1585.0,(1.0-vMapUv.y)*992.0);',
      'float a=regionWeight(p,vec2(1288.0,303.0),vec2(147.0,132.0));',
      'p.x-=sin(time*0.65)*2.0*a*motion;',
      'p.y-=(sin(time*1.6)*2.2+sin(avatarReaction*9.0)*avatarReaction*10.0)*a*motion;',
      'float cat=regionWeight(p,vec2(207.0,515.0),vec2(160.0,145.0));',
      'float tilt=sin(petReaction*3.14159)*0.055*motion;',
      'vec2 head=p-vec2(210.0,605.0);',
      'p=mix(p,vec2(210.0,605.0)+mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*head,cat);',
      'p.y-=(sin(time*1.35)*1.15+sin(petReaction*3.14159)*2.5)*cat*motion;',
      'vec2 q=(p-vec2(968.0,727.0))/vec2(26.0,27.0);',
      'float turn=powerAngle*(1.0-smoothstep(0.8,1.0,length(q)));',
      'p=vec2(968.0,727.0)+mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*q*vec2(26.0,27.0);',
      'vec4 photo=texture2D(map,vec2(p.x/1585.0,1.0-p.y/992.0));',
      'float cell=smoothstep(331.0,337.0,p.y)*(1.0-smoothstep(219.0,232.0,length(p-vec2(677.0,326.0))));',
      'float luminance=dot(photo.rgb,vec3(0.2126,0.7152,0.0722));',
      'vec3 tint=sampleKind<1.5?vec3(1.0,1.06,1.06):vec3(1.04,0.96,1.12);',
      'if(sampleKind>0.5)photo.rgb=mix(photo.rgb,mix(vec3(luminance),photo.rgb,0.45)*tint,cell*0.78);',
      'diffuseColor*=photo;',
    ].join('\n'))
  }
  const plate = mesh(new T.PlaneGeometry(artwork.width, artwork.height), plateMaterial)
  at(plate, artwork.width / 2, artwork.height / 2, 0)
  const emitter = new T.Group(); scene.add(emitter)
  const emitterMaterial = new T.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false })
  const laser = mesh(new T.PlaneGeometry(116, 116 * 520 / 1496), emitterMaterial, emitter)
  laser.position.y = -52.5 * 116 / 1496

  const ticks: T.Vector3[] = []
  for (let angle = 0; angle < 360; angle += 2) {
    const a = angle * Math.PI / 180, inner = angle % 30 === 0 ? 246 : angle % 10 === 0 ? 253 : 258
    for (const radius of [inner, 265]) ticks.push(world(opticalBoard.x + Math.sin(a) * radius, opticalBoard.y - Math.cos(a) * radius))
  }
  const ticksGeometry = new T.BufferGeometry().setFromPoints(ticks), ticksMaterial = new T.LineBasicMaterial({ color: '#c69b66', transparent: true, opacity: .8 })
  geometries.push(ticksGeometry); materials.push(ticksMaterial); scene.add(new T.LineSegments(ticksGeometry, ticksMaterial))
  const normalGeometry = new T.BufferGeometry().setFromPoints([world(677, 99), world(677, 553)])
  const normalMaterial = new T.LineDashedMaterial({ color: '#f4ead5', transparent: true, opacity: .6, dashSize: 8, gapSize: 8 })
  geometries.push(normalGeometry); materials.push(normalMaterial)
  const normal = new T.Line(normalGeometry, normalMaterial); normal.computeLineDistances(); scene.add(normal)
  const arcs = [0, 1].map(() => {
    const geometry = new T.BufferGeometry().setFromPoints(Array.from({ length: 33 }, () => new T.Vector3()))
    const material = new T.LineBasicMaterial({ color: '#f8edcf', transparent: true, opacity: .72 })
    geometries.push(geometry); materials.push(material)
    const line = new T.Line(geometry, material); scene.add(line); return { geometry, line }
  })
  const rayUniforms = {
    incoming: { value: new T.Vector4() }, reflected: { value: new T.Vector4() }, refracted: { value: new T.Vector4() },
    strengths: { value: new T.Vector3(1, .03, .97) }, enabled: { value: 1 },
  }
  const beamMaterial = new T.ShaderMaterial({
    uniforms: rayUniforms, vertexShader, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    fragmentShader: [
      'varying vec2 vUv; uniform vec4 incoming,reflected,refracted; uniform vec3 strengths; uniform float enabled;',
      'float ray(vec2 p,vec4 segment){vec2 v=segment.zw-segment.xy;float t=clamp(dot(p-segment.xy,v)/max(dot(v,v),0.01),0.0,1.0);return length(p-segment.xy-t*v);}',
      'vec3 light(float d,float power){float core=exp(-d*d/1.3);float glow=exp(-d*d/42.0)*0.25;return (vec3(1.0,0.58,0.35)*core+vec3(1.0,0.018,0.006)*glow)*sqrt(power);}',
      'void main(){vec2 p=vec2(vUv.x*1585.0,(1.0-vUv.y)*992.0);',
      'vec3 color=light(ray(p,incoming),strengths.x)+light(ray(p,reflected),strengths.y)+light(ray(p,refracted),strengths.z);',
      'float center=exp(-dot(p-vec2(677.0,326.0),p-vec2(677.0,326.0))/28.0);color+=vec3(1.0,0.25,0.04)*center*.6;',
      'gl_FragColor=vec4(color*enabled,enabled);',
      '#include <colorspace_fragment>',
      '}',
    ].join('\n'),
  })
  const beams = mesh(new T.PlaneGeometry(artwork.width, artwork.height), beamMaterial)
  at(beams, artwork.width / 2, artwork.height / 2, 3)

  const loader = new T.TextureLoader()
  Promise.all([loader.loadAsync('/game-assets/refraction/coast-smudge-en-v1.png'), loader.loadAsync('/game-assets/refraction/laser-v1.png')]).then(([background, laserTexture]) => {
    if (disposed) { background.dispose(); laserTexture.dispose(); return }
    background.colorSpace = laserTexture.colorSpace = T.SRGBColorSpace; textures.push(background, laserTexture)
    plateMaterial.map = background; plateMaterial.needsUpdate = true
    laserTexture.repeat.set(1496 / 1774, 520 / 887); laserTexture.offset.set(141 / 1774, 1 - 733 / 887)
    emitterMaterial.map = laserTexture; emitterMaterial.needsUpdate = true; loaded = true; callbacks.ready()
  }).catch(() => { if (!disposed) callbacks.error('Could not load the lighthouse terrace. Reload the page.') })
  function point(event: { clientX: number; clientY: number }) {
    const box = host.getBoundingClientRect()
    return { x: (event.clientX - box.left) / box.width * artwork.width, y: (event.clientY - box.top) / box.height * artwork.height }
  }
  function rotate(p: Point) { session.rotate(Math.atan2(p.x - opticalBoard.x, opticalBoard.y - p.y) * 180 / Math.PI) }
  function begin(event: { clientX: number; clientY: number; pointerId: number }) {
    dragging = true; rotate(point(event)); renderer.domElement.setPointerCapture(event.pointerId)
  }
  const down = (event: PointerEvent) => {
    const p = point(event), radius = Math.hypot(p.x - opticalBoard.x, p.y - opticalBoard.y)
    if (radius > 175 && radius < 320) { event.preventDefault(); begin(event) }
  }
  const move = (event: PointerEvent) => {
    const p = point(event)
    if (dragging) { rotate(p); renderer.domElement.style.cursor = 'grabbing' }
    else { const radius = Math.hypot(p.x - opticalBoard.x, p.y - opticalBoard.y); hover = radius > 175 && radius < 320 ? 'laser' : null; renderer.domElement.style.cursor = hover ? 'grab' : 'default' }
  }
  const up = (event: PointerEvent) => {
    if (!dragging) return
    dragging = false; if (event.type !== 'pointercancel') session.record()
    if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId)
    renderer.domElement.style.cursor = 'default'
  }
  const lost = (event: Event) => { event.preventDefault(); callbacks.error('The graphics scene stopped. Reload the page.') }
  const visibility = () => { previous = 0 }
  renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointermove', move)
  renderer.domElement.addEventListener('pointerup', up); renderer.domElement.addEventListener('pointercancel', up)
  renderer.domElement.addEventListener('webglcontextlost', lost); document.addEventListener('visibilitychange', visibility)
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
    const optics = session.optics(), angle = session.rotation * Math.PI / 180
    if (lastRevision !== session.revision) { petReaction = session.interactions ? .65 : 0; avatarReaction = .75; lastRevision = session.revision }
    if (!wasTotal && session.power && optics.totalReflection) { petReaction = 1.6; avatarReaction = .75 }
    wasTotal = session.power && optics.totalReflection
    petReaction = Math.max(0, petReaction - dt); avatarReaction = Math.max(0, avatarReaction - dt * .7)
    const petReacting = petReaction > 0
    photoUniforms.time.value = now / 1000; photoUniforms.motion.value = reduced.matches ? 0 : 1
    photoUniforms.petReaction.value = petReaction / 1.6
    photoUniforms.avatarReaction.value = avatarReaction
    photoUniforms.sampleKind.value = samples.findIndex(sample => sample.id === session.material); photoUniforms.powerAngle.value = session.power ? 0 : -1.3
    const emitterX = 677 + Math.sin(angle) * 267, emitterY = 326 - Math.cos(angle) * 267
    at(emitter, emitterX, emitterY, 5); emitter.rotation.z = -Math.atan2(optics.incident.y, optics.incident.x)
    rayUniforms.incoming.value.set(emitterX + optics.incident.x * 55, emitterY + optics.incident.y * 55, 677, 326)
    rayUniforms.reflected.value.set(677, 326, 677 + optics.reflected.x * 254, 326 + optics.reflected.y * 254)
    rayUniforms.refracted.value.set(677, 326, 677 + (optics.transmitted?.x ?? 0) * 254, 326 + (optics.transmitted?.y ?? 0) * 254)
    rayUniforms.strengths.value.set(1, optics.reflectance, optics.transmittance); rayUniforms.enabled.value = session.power ? 1 : 0
    const anchors: Record<string, Point> = {}
    const anchor = (id: string, x: number, y: number) => { anchors[id] = { x: x / artwork.width * host.clientWidth, y: y / artwork.height * host.clientHeight } }
    Object.entries(fixed).forEach(([id, p]) => anchor(id, p.x, p.y))
    anchor('laser', emitterX, emitterY)
    for (let mark = 0; mark < 360; mark += 30) { const a = mark * Math.PI / 180; anchor('mark' + mark, 677 + Math.sin(a) * 238, 326 - Math.cos(a) * 238) }
    arcs.forEach((arc, i) => {
      arc.line.visible = session.power && (i === 0 || !optics.totalReflection)
      const start = i === 0 ? (optics.inside ? 180 : 0) : (optics.inside ? 0 : 180)
      const end = i === 0 ? session.rotation : Math.atan2(optics.transmitted?.x ?? 0, -(optics.transmitted?.y ?? 1)) * 180 / Math.PI
      const delta = ((end - start + 540) % 360) - 180, radius = i === 0 ? 69 : 95, positions = arc.geometry.attributes.position
      for (let j = 0; j < 33; j++) { const a = (start + delta * j / 32) * Math.PI / 180; positions.setXYZ(j, 677 + Math.sin(a) * radius, artwork.height - 326 + Math.cos(a) * radius, 4) }
      positions.needsUpdate = true; arc.geometry.computeBoundingSphere()
      const middle = (start + delta / 2) * Math.PI / 180
      anchor(i === 0 ? 'angleIn' : 'angleOut', 677 + Math.sin(middle) * (radius + 27), 326 - Math.cos(middle) * (radius + 27))
    })
    renderer.render(scene, camera)
    if (now - lastHud > 32) { lastHud = now; callbacks.frame({ anchors, hover, dragging, petReacting }) }
  }
  frame = requestAnimationFrame(animate)
  return {
    begin,
    inspect: (id: string | null) => { hover = id },
    greet: (who: 'avatar' | 'pet') => { if (who === 'pet') { petReaction = 1.6; callbacks.hint() } else avatarReaction = 1 },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect()
      renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointermove', move)
      renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointercancel', up)
      renderer.domElement.removeEventListener('webglcontextlost', lost); document.removeEventListener('visibilitychange', visibility)
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
      renderer.dispose(); renderer.domElement.remove()
    },
  }
}
