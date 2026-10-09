export type PendulumSettings = { length: number; mass: number; angle: number }
export type Environment = { gravity: number; friction: number }
export type PendulumState = {
  angle: number; omega: number; time: number; heat: number
  period: number | null; lastCrossing: number | null; cycles: number
}
export const earth: Environment = { gravity: 9.81, friction: 0 }
export function createState(settings: PendulumSettings): PendulumState {
  return { angle: settings.angle * Math.PI / 180, omega: 0, time: 0, heat: 0, period: null, lastCrossing: null, cycles: 0 }
}
export function energy(state: PendulumState, settings: PendulumSettings, gravity: number) {
  const kinetic = .5 * settings.mass * (settings.length * state.omega) ** 2
  const potential = settings.mass * gravity * settings.length * (1 - Math.cos(state.angle))
  return { kinetic, potential, heat: state.heat, total: kinetic + potential + state.heat }
}
export const smallAnglePeriod = (length: number, gravity: number) => 2 * Math.PI * Math.sqrt(length / gravity)

/** Nonlinear pendulum with viscous damping. RK4; callers supply simulation seconds. */
export function advance(state: PendulumState, settings: PendulumSettings, environment: Environment, duration: number) {
  const steps = Math.max(1, Math.ceil(duration * 240))
  const dt = duration / steps
  const acceleration = (angle: number, omega: number) => -environment.gravity / settings.length * Math.sin(angle) - environment.friction * omega / settings.mass
  for (let i = 0; i < steps; i++) {
    const before = energy(state, settings, environment.gravity)
    const angle = state.angle, omega = state.omega
    const a = acceleration(angle, omega)
    const b = acceleration(angle + omega * dt / 2, omega + a * dt / 2)
    const c = acceleration(angle + (omega + a * dt / 2) * dt / 2, omega + b * dt / 2)
    const d = acceleration(angle + (omega + b * dt / 2) * dt, omega + c * dt)
    state.angle += dt / 6 * (omega + 2 * (omega + a * dt / 2) + 2 * (omega + b * dt / 2) + omega + c * dt)
    state.omega += dt / 6 * (a + 2 * b + 2 * c + d)
    if (environment.friction > 0) {
      const after = energy(state, settings, environment.gravity)
      state.heat += Math.max(0, before.kinetic + before.potential - after.kinetic - after.potential)
    }
    // Same-direction crossings bound one complete oscillation, not half a period.
    if (angle > 0 && state.angle <= 0 && Math.abs(state.omega) > .0001) {
      const crossing = state.time + dt * angle / (angle - state.angle)
      if (state.lastCrossing !== null) { state.period = crossing - state.lastCrossing; state.cycles++ }
      state.lastCrossing = crossing
    }
    state.time += dt
  }
}

export type Measurement = PendulumSettings & Environment & { period: number; pendulum: number; id: number }
