import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { playerAvatarDefinition, createAvatar, loadAvatar } from './avatar'
import { avatarSkins, type AvatarProfile } from './profile'
import { lowGraphics } from '../graphics'

export async function createAvatarPreview(host: HTMLDivElement, profile: AvatarProfile, signal: AbortSignal, isRunning = () => false) {
  const skin = avatarSkins.find((item) => item.id === profile.skinId)!
  const definition = playerAvatarDefinition(profile, 2)
  const asset = await loadAvatar(definition)
  const release = () => asset.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry.dispose()
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose()
      material.dispose()
    }
  })
  if (signal.aborted) { release(); return }
  const scene = new THREE.Scene()
  const lowQuality = lowGraphics()
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0xf0f4f5, 1)
  renderer.setPixelRatio(Math.min(devicePixelRatio, lowQuality ? 1 : 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = !lowQuality
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.domElement.setAttribute('aria-label', `3D character: ${skin.name}`)
  renderer.domElement.setAttribute('role', 'img')
  host.appendChild(renderer.domElement)
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30)
  camera.position.set(0, 1.35, 4.15)
  camera.lookAt(0, 1.02, 0)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc5c9c8, 1.4))
  const key = new THREE.DirectionalLight(0xfff8f0, 2.5)
  key.position.set(-3, 4, 4)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  Object.assign(key.shadow.camera, { left: -1.7, right: 1.7, top: 2.6, bottom: -0.6, near: 0.1, far: 12 })
  key.shadow.normalBias = 0.025
  key.shadow.bias = -0.0002
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xd8f1ff, 1.3)
  rim.position.set(2, 3, -3)
  scene.add(rim)
  const fill = new THREE.DirectionalLight(0xffffff, 1.8)
  fill.position.set(4, 2, 3)
  scene.add(fill)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 1.02, 0)
  controls.enablePan = false
  controls.enableZoom = false
  controls.enableDamping = false
  controls.minPolarAngle = Math.PI / 3
  controls.maxPolarAngle = Math.PI * 0.55
  const avatar = createAvatar(asset, definition)
  avatar.root.rotation.y = -0.35
  scene.add(avatar.root)
  const podium = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.82, 0.06, 48), new THREE.MeshStandardMaterial({ color: 0xd9ecea, roughness: 0.9 }))
  podium.position.y = -0.03
  podium.receiveShadow = true
  scene.add(podium)
  const resize = () => {
    renderer.setSize(host.clientWidth, host.clientHeight)
    camera.aspect = host.clientWidth / Math.max(1, host.clientHeight)
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  resize()
  let frame = 0
  let last = 0
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const render = (now: number) => {
    if (signal.aborted) return
    frame = requestAnimationFrame(render)
    if (document.hidden || lowQuality && last && now - last < 1000 / 30 - 1) return
    avatar.update(last && !reduced ? Math.min((now - last) / 1000, 0.1) : 0, isRunning() && !reduced, -0.35)
    last = now
    controls.update()
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(render)
  return () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
    controls.dispose()
    avatar.dispose()
    podium.geometry.dispose()
    podium.material.dispose()
    release()
    renderer.dispose()
    renderer.domElement.remove()
  }
}
