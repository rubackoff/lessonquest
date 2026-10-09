import { describe, expect, it } from 'vitest'
import { advance, createState, earth, energy, smallAnglePeriod } from './physics'

describe('pendulum physics', () => {
  it('conserves mechanical energy for 120 seconds at a large angle', () => {
    const settings = { length: .4, mass: 2, angle: 85 }
    const state = createState(settings), initial = energy(state, settings, earth.gravity).total
    advance(state, settings, earth, 120)
    expect(Math.abs(energy(state, settings, earth.gravity).total / initial - 1)).toBeLessThan(.00001)
  })
  it('measures a full period, independent of mass, close to the small-angle limit', () => {
    const periods = [ .2, 5 ].map(mass => {
      const settings = { length: 1.3, mass, angle: 2 }, state = createState(settings)
      advance(state, settings, earth, 15)
      expect(state.cycles).toBeGreaterThan(4)
      return state.period!
    })
    expect(periods[0]).toBeCloseTo(periods[1], 8)
    expect(periods[0] / smallAnglePeriod(1.3, earth.gravity)).toBeCloseTo(1, 3)
  })
  it('resolves the large-angle correction and slower lunar oscillation', () => {
    const settings = { length: 1, mass: 1, angle: 80 }, state = createState(settings)
    advance(state, settings, earth, 30)
    expect(state.period! / smallAnglePeriod(1, earth.gravity)).toBeGreaterThan(1.13)
    const lunar = createState(settings)
    advance(lunar, settings, { gravity: 1.62, friction: 0 }, 45)
    expect(lunar.period! / state.period!).toBeCloseTo(Math.sqrt(9.81 / 1.62), 4)
  })
  it('converts lost mechanical energy to heat', () => {
    const settings = { length: 1, mass: 1, angle: 50 }, state = createState(settings)
    const initial = energy(state, settings, earth.gravity).total
    advance(state, settings, { ...earth, friction: .3 }, 10)
    expect(state.heat).toBeGreaterThan(initial * .9)
    expect(energy(state, settings, earth.gravity).total).toBeCloseTo(initial, 6)
  })
  it('does not report a period for a motionless bob', () => {
    const settings = { length: 1, mass: 1, angle: 0 }, state = createState(settings)
    advance(state, settings, earth, 10)
    expect(state.period).toBeNull()
  })
})
