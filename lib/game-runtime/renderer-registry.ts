import type { GameId } from '../activity-runtime'

export type GameRendererId = 'legacy' | 'phaser-v1'

export const rendererByGameId = {
  'force-lab': 'phaser-v1',
  'mistake-arena': 'phaser-v1',
  'match-pairs': 'phaser-v1',
  'group-sort': 'phaser-v1',
  'quiz-rush': 'phaser-v1',
  'recall-deck': 'phaser-v1',
} as const satisfies Record<GameId, GameRendererId>

export function getGameRenderer(gameId: GameId): GameRendererId {
  return rendererByGameId[gameId]
}
