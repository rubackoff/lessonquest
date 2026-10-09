import { describe, expect, it } from 'vitest'
import { parseCreateActivityInput } from './activity-api'

function matchPairsInput(pairs: Array<{ id: string; left: string; right: string }>) {
  return {
    gameId: 'match-pairs',
    title: 'Checking pairs',
    level: {
      id: 1,
      title: 'Couples',
      subject: 'Test',
      grade: 'Adults',
      prompt: 'Connect the pairs',
      teacherNote: 'API check',
      pairs,
    },
  }
}

describe('parseCreateActivityInput for match-pairs', () => {
  it('accepts a valid set of pairs', () => {
    const input = matchPairsInput([
      { id: 'first', left: 'A', right: '1' },
      { id: 'second', left: 'B', right: '2' },
    ])

    expect(parseCreateActivityInput(input)).not.toBeNull()
  })

  it('rejects more than eight pairs', () => {
    const pairs = Array.from({ length: 9 }, (_, index) => ({
      id: `pair-${index}`,
      left: `Left ${index}`,
      right: `Right ${index}`,
    }))

    expect(parseCreateActivityInput(matchPairsInput(pairs))).toBeNull()
  })

  it('rejects duplicate pair ids', () => {
    const input = matchPairsInput([
      { id: 'duplicate', left: 'A', right: '1' },
      { id: 'duplicate', left: 'B', right: '2' },
    ])

    expect(parseCreateActivityInput(input)).toBeNull()
  })

  it('rejects card text longer than the editor limit', () => {
    const input = matchPairsInput([
      { id: 'first', left: 'A'.repeat(161), right: '1' },
      { id: 'second', left: 'B', right: '2' },
    ])

    expect(parseCreateActivityInput(input)).toBeNull()
  })
})
