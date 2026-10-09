import { describe, expect, it } from 'vitest'
import { matchPairsLevels, type MatchPairsLevel } from '../match-pairs'
import { transitionMatchPairsAttempt, type MatchPairsSessionState } from './match-pairs-session'

const level: MatchPairsLevel = {
  id: 1,
  title: 'Test pairs',
  subject: 'Test',
  grade: 'Test',
  prompt: 'Connect the pairs',
  teacherNote: 'Test fixture',
  pairs: [
    { id: 'alpha', left: 'A', right: 'Alpha' },
    { id: 'beta', left: 'B', right: 'Beta' },
    { id: 'gamma', left: 'C', right: 'Gamma' },
  ],
}

describe('transitionMatchPairsAttempt', () => {
  it('counts an incorrect attempt without changing connections', () => {
    const connections = [{ leftIndex: 0, rightIndex: 0 }]
    const state: MatchPairsSessionState = { connections, attempts: 2 }

    const transition = transitionMatchPairsAttempt(level, state, 1, 2)

    expect(transition.correct).toBe(false)
    expect(transition.state.attempts).toBe(3)
    expect(transition.state.connections).toBe(connections)
    expect(transition.result).toMatchObject({
      attempts: 3,
      connected: 1,
      correct: 1,
      complete: false,
      accuracy: 33,
    })
  })

  it('adds a correct connection and keeps connections sorted by left index', () => {
    const state: MatchPairsSessionState = {
      connections: [
        { leftIndex: 2, rightIndex: 2 },
        { leftIndex: 0, rightIndex: 0 },
      ],
      attempts: 2,
    }

    const transition = transitionMatchPairsAttempt(level, state, 1, 1)

    expect(transition.correct).toBe(true)
    expect(transition.state).toEqual({
      connections: [
        { leftIndex: 0, rightIndex: 0 },
        { leftIndex: 1, rightIndex: 1 },
        { leftIndex: 2, rightIndex: 2 },
      ],
      attempts: 3,
    })
    expect(transition.result).toMatchObject({
      attempts: 3,
      connected: 3,
      correct: 3,
      complete: true,
      accuracy: 100,
    })
  })

  it('replaces connections that conflict on either side', () => {
    const state: MatchPairsSessionState = {
      connections: [
        { leftIndex: 0, rightIndex: 1 },
        { leftIndex: 2, rightIndex: 0 },
        { leftIndex: 1, rightIndex: 2 },
      ],
      attempts: 3,
    }

    const transition = transitionMatchPairsAttempt(level, state, 0, 0)

    expect(transition.state.connections).toEqual([
      { leftIndex: 0, rightIndex: 0 },
      { leftIndex: 1, rightIndex: 2 },
    ])
    expect(transition.state.attempts).toBe(4)
  })

  it('does not mutate the previous state when a correct attempt transitions it', () => {
    const connections = [{ leftIndex: 2, rightIndex: 2 }]
    const state: MatchPairsSessionState = { connections, attempts: 1 }

    transitionMatchPairsAttempt(level, state, 0, 0)

    expect(state).toEqual({ connections: [{ leftIndex: 2, rightIndex: 2 }], attempts: 1 })
  })

  it('preserves the canonical result for the built-in physics level', () => {
    const builtInLevel = matchPairsLevels[0]
    let state: MatchPairsSessionState = { connections: [], attempts: 0 }

    let transition = transitionMatchPairsAttempt(builtInLevel, state, 0, 2)
    state = transition.state
    for (let index = 0; index < builtInLevel.pairs.length; index += 1) {
      transition = transitionMatchPairsAttempt(builtInLevel, state, index, index)
      state = transition.state
    }

    expect(state).toEqual({
      connections: [
        { leftIndex: 0, rightIndex: 0 },
        { leftIndex: 1, rightIndex: 1 },
        { leftIndex: 2, rightIndex: 2 },
        { leftIndex: 3, rightIndex: 3 },
      ],
      attempts: 5,
    })
    expect(transition.result).toMatchObject({
      total: 4,
      connected: 4,
      correct: 4,
      attempts: 5,
      complete: true,
      accuracy: 80,
      status: 'all pairs are collected',
    })
  })
})
