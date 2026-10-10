import { describe, expect, it } from 'vitest'
import { createSession, solveCircuit } from './session'

describe('series teaching circuit', () => {
  it('has no current through an open loop', () => {
    const result = solveCircuit(12, 0, false)
    expect(result.current).toBe(0); expect(result.power).toBe(0)
  })
  it('conserves voltage and energy across the lamp and rheostat', () => {
    const result = solveCircuit(9, 6, true)
    expect(result.current).toBe(.5)
    expect(result.lampVoltage + result.resistorVoltage).toBe(9)
    expect(result.power + result.current ** 2 * 6).toBe(result.sourcePower)
  })
  it('reduces current and lamp power when series resistance increases', () => {
    const a = solveCircuit(12, 0, true), b = solveCircuit(12, 12, true)
    expect(b.current).toBe(a.current / 2); expect(b.power).toBe(a.power / 4)
  })
  it('needs every lead and the switch closed; unplugging immediately interrupts power', () => {
    const session = createSession()
    session.toggle(); expect(session.result().current).toBe(0)
    session.connect(0, true); expect(session.result().current).toBe(.75)
    for (let i = 0; i < 4; i++) {
      session.connect(i, false); expect(session.result().current).toBe(0)
      session.connect(i, true); expect(session.result().current).toBe(.75)
    }
  })
  it('bounds physical dials and records distinct observations including open circuits', () => {
    const session = createSession()
    session.dial('voltage', 999); session.dial('resistance', -1)
    expect(session.voltage).toBe(12); expect(session.resistance).toBe(0)
    session.connect(0, true); session.toggle(); session.record()
    expect(session.measurements).toHaveLength(2)
    expect(session.measurements[1].power).toBe(12)
    session.connect(1, false); expect(session.measurements.at(-1)?.current).toBe(0)
    session.reset(); expect(session.measurements).toHaveLength(0); expect(session.complete()).toBe(false)
  })
})
