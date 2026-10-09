import { describe, expect, it } from 'vitest'
import { activities } from '../activity-runtime'
import { getGameRenderer, rendererByGameId } from './renderer-registry'

describe('game renderer registry', () => {
  it('routes every shipped game to the Phaser renderer', () => {
    expect(
      activities.every((activity) => getGameRenderer(activity.id) === 'phaser-v1'),
    ).toBe(true)
  })

  it('contains one renderer entry for every known game', () => {
    expect(Object.keys(rendererByGameId).sort()).toEqual(
      activities.map((activity) => activity.id).sort(),
    )
  })
})
