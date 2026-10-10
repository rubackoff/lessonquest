import { describe, expect, it } from 'vitest'
import { refract } from './physics'
import { createSession } from './session'

describe('refraction at a lossless optical boundary', () => {
  it('bends a 45 degree air ray toward the normal in water', () => {
    const result = refract(-45, 1.333)
    expect(result.refraction).toBeCloseTo(32.04, 1)
    expect(result.refraction!).toBeLessThan(result.incidence)
    expect(result.transmitted!.y).toBeGreaterThan(0)
    expect(result.reflectance + result.transmittance).toBeCloseTo(1, 12)
  })
  it('gives four percent reflection and no deflection at normal incidence into glass', () => {
    const result = refract(0, 1.5)
    expect(result.refraction).toBe(0)
    expect(result.reflectance).toBeCloseTo(.04, 12)
    expect(result.transmitted).toEqual({ x: -0, y: 1 })
  })
  it('reverses the ray path when the beam comes back out of glass', () => {
    const entering = refract(-45, 1.5)
    const leaving = refract(180 - entering.refraction!, 1.5)
    expect(leaving.inside).toBe(true)
    expect(leaving.refraction).toBeCloseTo(45, 10)
    expect(leaving.transmitted!.y).toBeLessThan(0)
  })
  it('reflects all power above the glass-to-air critical angle', () => {
    const result = refract(130, 1.5)
    expect(result.incidence).toBeCloseTo(50)
    expect(result.criticalAngle).toBeCloseTo(41.8103, 4)
    expect(result.totalReflection).toBe(true)
    expect(result.transmitted).toBeNull()
    expect(result.reflectance).toBe(1)
    expect(result.reflected.y).toBeGreaterThan(0)
  })
  it('is stable on both sides of the critical angle', () => {
    const critical = Math.asin(1 / 1.5) * 180 / Math.PI
    const below = refract(180 - critical + .0001, 1.5)
    const above = refract(180 - critical - .0001, 1.5)
    expect(below.totalReflection).toBe(false)
    expect(below.refraction!).toBeLessThan(90)
    expect(above.totalReflection).toBe(true)
    expect(Number.isFinite(below.reflectance)).toBe(true)
  })
  it('mirrors left/right rays while preserving angles and energy', () => {
    for (const angle of [5, 30, 65, 88, 110, 145, 175]) {
      const a = refract(angle, 2.42), b = refract(-angle, 2.42)
      expect(a.refraction).toEqual(b.refraction)
      expect(a.reflectance).toEqual(b.reflectance)
      expect(a.reflected.x).toBeCloseTo(-b.reflected.x, 12)
      expect(a.reflectance).toBeGreaterThanOrEqual(0)
      expect(a.reflectance).toBeLessThanOrEqual(1)
    }
  })
})

describe('experiment records', () => {
  it('records distinct trials and skips power-off and duplicate trials', () => {
    const session = createSession()
    session.record(); session.record()
    expect(session.measurements).toHaveLength(1)
    session.choose('glass')
    expect(session.measurements).toHaveLength(2)
    session.toggle(); session.rotate(130); session.record()
    expect(session.measurements).toHaveLength(2)
    session.toggle()
    expect(session.measurements[2].refraction).toBeNull()
    expect(session.measurements[2].reflection).toBe(1)
    session.reset()
    expect(session.measurements).toHaveLength(0)
    expect(session.optics().refraction).toBeCloseTo(32.04, 1)
  })
  it('keeps pointer and keyboard rotation away from the tangent singularity', () => {
    const session = createSession()
    for (const angle of [90, -90, 270, 450, 89.99]) {
      session.rotate(angle)
      expect(Math.abs(Math.cos(session.rotation * Math.PI / 180))).toBeGreaterThan(.03)
      expect(Number.isFinite(session.optics().reflectance)).toBe(true)
    }
  })
})
