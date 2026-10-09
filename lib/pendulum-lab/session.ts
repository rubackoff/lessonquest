import { advance, createState, type Measurement, type PendulumSettings } from './physics'

export const worlds = [{ name: 'Earth', gravity: 9.81 }, { name: 'Moon', gravity: 1.62 }, { name: 'Jupiter', gravity: 24.79 }]
const initial = () => [{ length: 1.5, mass: 1, angle: 12 }, { length: 1.5, mass: 2, angle: -12 }]
export function createSession() {
  return {
    settings: initial(), states: initial().map(createState), environment: { gravity: 9.81, friction: 0 },
    running: false, selected: 0, planet: 0, interactions: 0,
    revision: 0, recordedRevision: -1, measurements: [] as Measurement[],
    lastAction: 'start' as 'start' | 'launch' | 'length' | 'mass' | 'planet' | 'fan',
    reset() { this.states = this.settings.map(createState); this.revision++ },
    resetAll() {
      this.settings = initial(); this.environment = { gravity: 9.81, friction: 0 }; this.planet = 0
      this.running = false; this.selected = 0; this.interactions = 0
      this.lastAction = 'start'; this.measurements = []; this.reset()
    },
    select(index: number) { this.selected = index },
    launch() { this.running = true; this.interactions++; if (this.lastAction === 'start') this.lastAction = 'launch' },
    pause() { this.running = false },
    toggle() { if (this.running) this.pause(); else this.launch() },
    configure(index: number, patch: Partial<PendulumSettings>) { Object.assign(this.settings[index], patch); this.selected = index; this.reset() },
    pull(index: number, angle: number) {
      this.selected = index; this.running = false
      this.settings.forEach(settings => { settings.angle = Math.max(-75, Math.min(75, angle)) })
      this.reset()
    },
    setLength(index: number, length: number) {
      this.configure(index, { length: Math.round(Math.max(.55, Math.min(2.1, length)) * 20) / 20 })
      this.lastAction = 'length'; this.interactions++
    },
    setMass(mass: number, index?: number) {
      const target = index ?? this.selected
      this.configure(target, { mass }); this.selected = target; this.lastAction = 'mass'; this.interactions++; this.running = true
    },
    cyclePlanet() {
      this.planet = (this.planet + 1) % worlds.length; this.environment.gravity = worlds[this.planet].gravity
      this.lastAction = 'planet'; this.interactions++; this.reset(); this.running = true
    },
    toggleFan() {
      this.environment.friction = this.environment.friction ? 0 : .3
      this.lastAction = 'fan'; this.interactions++; this.reset(); this.running = true
    },
    tick(dt: number) {
      this.states.forEach((state, i) => advance(state, this.settings[i], this.environment, dt))
      if (!this.interactions || this.states.some(state => state.period === null)) return
      if (this.recordedRevision !== this.revision) {
        this.settings.forEach((settings, i) => this.measurements.push({ ...settings, ...this.environment, period: this.states[i].period!, pendulum: i + 1, id: this.measurements.length + 1 }))
        this.recordedRevision = this.revision
      }
    },
  }
}
export type PendulumSession = ReturnType<typeof createSession>

export function companionHint(session: PendulumSession) {
  if (!session.interactions) return 'Pull back any ball. Both will start from the same corner.'
  if (session.environment.friction) return 'Turn off the wind to compare rhythms.'
  const [a, b] = session.states.map(state => state.period)
  if (a === null || b === null) return 'Wait a full cycle - timers measure the period.'
  if (Math.abs(a / b - 1) < .012) return 'Now shorten one thread: pull the spool up.'
  return a > b ? 'Blue is slower. Pull his reel up.' : 'Orange is slower. Pull his reel up.'
}

export function observation(session: PendulumSession) {
  if (!session.interactions) return { title: 'Does heavier mean faster?', detail: 'Pull back on either ball and release both at the same time.' }
  const [a,b] = session.states.map(state => state.period)
  if (a === null || b === null) return { title: 'Compare full cycle', detail: 'There and back - one complete swing.' }
  if (session.environment.friction) return { title: 'The wind dampens the vibrations', detail: 'Compare how quickly different loads stop.' }
  if (Math.abs(a / b - 1) < .012) return { title: session.settings[0].mass !== session.settings[1].mass ? 'Different weight. One period.' : 'Pendulums move in the same rhythm.', detail: 'Pull one reel up. What will change?' }
  return { title: 'A shorter string means a faster pendulum.', detail: `For a full cycle: ${a.toFixed(2)} s and ${b.toFixed(2)} s.` }
}
