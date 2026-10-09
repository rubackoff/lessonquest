import { describe, expect, it } from 'vitest'
import {
  getMatchPairsSoundPlan,
  shouldPlayMatchPairsSound,
  type MatchPairsSoundCue,
} from './match-pairs-sound'

const cues: MatchPairsSoundCue[] = ['tap', 'drag', 'correct', 'wrong', 'complete']

describe('match-pairs sound plans', () => {
  it.each(cues)('builds a safe, ordered plan for %s', (cue) => {
    const plan = getMatchPairsSoundPlan(cue, false)

    expect(plan.length).toBeGreaterThan(0)
    expect(plan.map((item) => item.delayMs)).toEqual(
      [...plan].map((item) => item.delayMs).sort((first, second) => first - second),
    )
    for (const item of plan) {
      expect(item.durationMs).toBeGreaterThan(0)
      expect(item.frequency).toBeGreaterThan(0)
      expect(item.endFrequency).toBeGreaterThan(0)
      expect(item.gain).toBeGreaterThan(0)
      expect(item.gain).toBeLessThanOrEqual(0.05)
    }
  })

  it('uses a shorter, calmer completion cue for reduced motion', () => {
    const standard = getMatchPairsSoundPlan('complete', false)
    const reduced = getMatchPairsSoundPlan('complete', true)
    const tail = (plan: typeof standard) => Math.max(
      ...plan.map((item) => item.delayMs + item.durationMs),
    )

    expect(reduced.length).toBeLessThan(standard.length)
    expect(tail(reduced)).toBeLessThan(tail(standard))
  })
})

describe('match-pairs sound gate', () => {
  it('plays only while the game is active and unmuted', () => {
    expect(shouldPlayMatchPairsSound({ muted: false, paused: false, reducedMotion: false })).toBe(true)
    expect(shouldPlayMatchPairsSound({ muted: true, paused: false, reducedMotion: false })).toBe(false)
    expect(shouldPlayMatchPairsSound({ muted: false, paused: true, reducedMotion: false })).toBe(false)
  })
})
