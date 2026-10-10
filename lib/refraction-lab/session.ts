import { materials, refract, type MaterialId } from './physics'

export type Measurement = { id: number; material: string; direction: string; incidence: number; refraction: number | null; reflection: number }
export function createSession() {
  return {
    rotation: -45, material: 'water' as MaterialId, power: true, revision: 0,
    interactions: 0, lastRecord: '', measurements: [] as Measurement[],
    sample() { return materials.find(material => material.id === this.material)! },
    optics() { return refract(this.rotation, this.sample().index) },
    rotate(degrees: number) {
      let angle = ((degrees + 180) % 360 + 360) % 360 - 180
      // The emitter crosses the boundary through a small dead zone, never along it.
      if (Math.abs(Math.abs(angle) - 90) < 2) angle = Math.sign(angle) * (Math.abs(angle) < 90 ? 88 : 92)
      this.rotation = Math.round(angle * 10) / 10; this.interactions++
    },
    choose(material: MaterialId) { this.material = material; this.revision++; this.interactions++; this.record() },
    toggle() { this.power = !this.power; this.interactions++; this.record() },
    record() {
      if (!this.power) return
      const signature = this.material + ':' + this.rotation
      if (signature === this.lastRecord) return
      const result = this.optics()
      this.measurements.push({ id: this.measurements.length + 1, material: this.sample().name, direction: result.inside ? 'Into air' : 'Into material', incidence: result.incidence, refraction: result.refraction, reflection: result.reflectance })
      this.lastRecord = signature
    },
    reset() { this.rotation = -45; this.material = 'water'; this.power = true; this.revision++; this.interactions = 0; this.lastRecord = ''; this.measurements = [] },
  }
}
export type RefractionSession = ReturnType<typeof createSession>

export function companionHint(session: RefractionSession) {
  if (!session.power) return 'Turn the brass knob on the right to switch on the laser.'
  const optics = session.optics()
  if (optics.totalReflection) return 'All the light is reflected! Reduce the angle to the vertical to let it escape into air again.'
  if (optics.inside) return 'Move the laser toward the side of the circle. Can the light still escape into air?'
  return 'Move the laser to the lower half of the circle: light now travels from the material into air.'
}
