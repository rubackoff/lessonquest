export type MatchPairsSoundCue = 'tap' | 'drag' | 'correct' | 'wrong' | 'complete'

export type MatchPairsSoundState = {
  muted: boolean
  paused: boolean
  reducedMotion: boolean
}

export type MatchPairsTone = {
  delayMs: number
  durationMs: number
  frequency: number
  endFrequency: number
  gain: number
  wave: OscillatorType
}

const standardPlans: Record<MatchPairsSoundCue, readonly MatchPairsTone[]> = {
  tap: [tone(0, 44, 520, 650, 0.035, 'sine')],
  drag: [tone(0, 82, 220, 340, 0.042, 'triangle')],
  correct: [
    tone(0, 125, 523.25, 587.33, 0.046, 'sine'),
    tone(58, 150, 659.25, 698.46, 0.041, 'sine'),
    tone(116, 185, 783.99, 880, 0.036, 'triangle'),
  ],
  wrong: [
    tone(0, 105, 196, 164.81, 0.043, 'triangle'),
    tone(62, 115, 155.56, 138.59, 0.032, 'sine'),
  ],
  complete: [
    tone(0, 170, 523.25, 587.33, 0.041, 'sine'),
    tone(82, 185, 659.25, 698.46, 0.039, 'sine'),
    tone(164, 205, 783.99, 880, 0.037, 'triangle'),
    tone(246, 235, 1046.5, 1174.66, 0.032, 'sine'),
  ],
}

const reducedPlans: Record<MatchPairsSoundCue, readonly MatchPairsTone[]> = {
  tap: [tone(0, 32, 520, 590, 0.026, 'sine')],
  drag: [tone(0, 48, 240, 285, 0.029, 'sine')],
  correct: [tone(0, 85, 659.25, 698.46, 0.034, 'sine')],
  wrong: [tone(0, 78, 174.61, 155.56, 0.03, 'sine')],
  complete: [
    tone(0, 100, 659.25, 698.46, 0.032, 'sine'),
    tone(72, 125, 880, 987.77, 0.028, 'sine'),
  ],
}

export function getMatchPairsSoundPlan(
  cue: MatchPairsSoundCue,
  reducedMotion: boolean,
): readonly MatchPairsTone[] {
  return reducedMotion ? reducedPlans[cue] : standardPlans[cue]
}

export function shouldPlayMatchPairsSound(state: MatchPairsSoundState) {
  return !state.muted && !state.paused
}

export class MatchPairsSoundKit {
  private state: MatchPairsSoundState = {
    muted: false,
    paused: false,
    reducedMotion: false,
  }
  private context: AudioContext | null = null
  private output: GainNode | null = null
  private voices = new Set<{ oscillator: OscillatorNode; gain: GainNode }>()
  private disposed = false

  configure(next: Partial<MatchPairsSoundState>) {
    if (this.disposed) return

    const wasPlayable = shouldPlayMatchPairsSound(this.state)
    this.state = { ...this.state, ...next }
    const playable = shouldPlayMatchPairsSound(this.state)

    if (!playable) {
      this.stopVoices()
      if (this.context?.state === 'running') void this.context.suspend().catch(() => undefined)
      return
    }

    if (!wasPlayable && this.context?.state === 'suspended') {
      void this.context.resume().catch(() => undefined)
    }
  }

  play(cue: MatchPairsSoundCue) {
    if (this.disposed || !shouldPlayMatchPairsSound(this.state)) return false

    const context = this.ensureContext()
    if (!context) return false

    const schedule = () => {
      if (this.disposed || !shouldPlayMatchPairsSound(this.state)) return
      if (cue === 'complete') this.stopVoices()
      this.schedulePlan(context, getMatchPairsSoundPlan(cue, this.state.reducedMotion))
    }

    if (context.state === 'suspended') {
      void context.resume().then(schedule).catch(() => undefined)
    } else {
      schedule()
    }

    return true
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.stopVoices()
    const context = this.context
    this.context = null
    this.output = null
    if (context && context.state !== 'closed') void context.close().catch(() => undefined)
  }

  private ensureContext() {
    if (this.context) return this.context
    if (typeof window === 'undefined') return null

    type AudioContextClass = new () => AudioContext
    const AudioContextConstructor = window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: AudioContextClass }).webkitAudioContext
    if (!AudioContextConstructor) return null

    try {
      const context = new AudioContextConstructor()
      const output = context.createGain()
      const compressor = context.createDynamicsCompressor()
      output.gain.value = 0.82
      compressor.threshold.value = -18
      compressor.knee.value = 14
      compressor.ratio.value = 5
      compressor.attack.value = 0.004
      compressor.release.value = 0.12
      output.connect(compressor)
      compressor.connect(context.destination)
      this.context = context
      this.output = output
      return context
    } catch {
      return null
    }
  }

  private schedulePlan(context: AudioContext, plan: readonly MatchPairsTone[]) {
    const output = this.output
    if (!output) return

    for (const item of plan) {
      const start = context.currentTime + item.delayMs / 1000 + 0.004
      const duration = item.durationMs / 1000
      const end = start + duration
      const attack = Math.min(0.012, duration * 0.22)
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const voice = { oscillator, gain }

      oscillator.type = item.wave
      oscillator.frequency.setValueAtTime(item.frequency, start)
      oscillator.frequency.exponentialRampToValueAtTime(item.endFrequency, end)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(item.gain, start + attack)
      gain.gain.exponentialRampToValueAtTime(0.0001, end)
      oscillator.connect(gain)
      gain.connect(output)
      oscillator.addEventListener('ended', () => {
        this.voices.delete(voice)
        oscillator.disconnect()
        gain.disconnect()
      }, { once: true })
      this.voices.add(voice)
      oscillator.start(start)
      oscillator.stop(end + 0.018)
    }
  }

  private stopVoices() {
    const context = this.context
    if (!context) {
      this.voices.clear()
      return
    }

    const now = context.currentTime
    for (const { oscillator, gain } of this.voices) {
      try {
        gain.gain.cancelScheduledValues(now)
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018)
        oscillator.stop(now + 0.022)
      } catch {
        // The voice may already have ended between collection and cleanup.
      }
    }
  }
}

function tone(
  delayMs: number,
  durationMs: number,
  frequency: number,
  endFrequency: number,
  gain: number,
  wave: OscillatorType,
): MatchPairsTone {
  return { delayMs, durationMs, frequency, endFrequency, gain, wave }
}
