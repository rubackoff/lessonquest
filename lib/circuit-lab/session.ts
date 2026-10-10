export const lampResistance = 12
export const limits = { voltage: { min: 3, max: 12, step: .5 }, resistance: { min: 0, max: 36, step: 1 } }
export type Dial = keyof typeof limits
export type Measurement = { id: number; voltage: number; resistance: number; current: number; power: number; closed: boolean }

export function solveCircuit(voltage: number, resistance: number, closed: boolean) {
  const current = closed ? voltage / (lampResistance + resistance) : 0
  return { current, lampVoltage: current * lampResistance, resistorVoltage: current * resistance, power: current * current * lampResistance, sourcePower: voltage * current }
}

export function createSession() {
  return {
    voltage: 9, resistance: 0, switchClosed: false, connected: [false, true, true, true], revision: 0,
    measurements: [] as Measurement[], lastRecord: '',
    complete() { return this.connected.every(Boolean) },
    result() { return solveCircuit(this.voltage, this.resistance, this.switchClosed && this.complete()) },
    dial(id: Dial, value: number) {
      const { min, max, step } = limits[id]
      this[id] = Math.round(Math.max(min, Math.min(max, value)) / step) * step
    },
    connect(id: number, connected: boolean) { this.connected[id] = connected; this.revision++; this.record() },
    toggle() { this.switchClosed = !this.switchClosed; this.revision++; this.record() },
    record() {
      const closed = this.switchClosed && this.complete(), key = [this.voltage, this.resistance, closed].join(':')
      if (key === this.lastRecord) return
      const { current, power } = this.result()
      this.measurements.push({ id: this.measurements.length + 1, voltage: this.voltage, resistance: this.resistance, current, power, closed })
      this.lastRecord = key
    },
    reset() { this.voltage = 9; this.resistance = 0; this.switchClosed = false; this.connected = [false, true, true, true]; this.measurements = []; this.lastRecord = ''; this.revision++ },
  }
}
export type CircuitSession = ReturnType<typeof createSession>
export function companionHint(session: CircuitSession) {
  if (!session.complete()) return 'Current needs a closed path. Pick up the loose lead and move it to the glowing terminal.'
  if (!session.switchClosed) return 'All leads are connected. Lower the white switch handle — what happens to the lamp?'
  if (session.resistance === 0) return 'Turn the large knob on the right. Why does the lamp dim while the voltage stays the same?'
  return 'Increase the voltage using the supply knob on the left. Compare current and lamp brightness.'
}
