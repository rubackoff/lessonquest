import { describe, expect, it } from 'vitest'
import { getRectCenter, toLocalPoint } from './coordinate-space'

describe('game coordinate space', () => {
  const container = { left: 120, top: 80, width: 900, height: 600 }

  it('converts a client point into container-local coordinates', () => {
    expect(toLocalPoint({ x: 170, y: 110 }, container)).toEqual({ x: 50, y: 30 })
  })

  it('returns a DOM anchor center in local coordinates', () => {
    const card = { left: 220, top: 180, width: 300, height: 120 }
    expect(getRectCenter(card, container)).toEqual({ x: 250, y: 160 })
  })
})
