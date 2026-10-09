import type Phaser from 'phaser'
import type { RuntimeBridge } from '@/lib/game-runtime/bridge'
import type { VisualThemeId } from '@/lib/visual-themes'

export type GameRuntimeMode = 'player' | 'preview'

export type RuntimePoint = {
  x: number
  y: number
}

export type MatchPairsRuntimeConnection = {
  leftIndex: number
  rightIndex: number
}

export type MatchPairsRuntimeLayout = {
  width: number
  height: number
  left: Array<RuntimePoint | null>
  right: Array<RuntimePoint | null>
  connections: MatchPairsRuntimeConnection[]
}

export type RuntimeCommand =
  | { type: 'runtime/pause' }
  | { type: 'runtime/resume' }
  | { type: 'runtime/reduced-motion'; enabled: boolean }
  | { type: 'runtime/destroy' }
  | { type: 'match/theme'; themeId: VisualThemeId }
  | { type: 'match/sound-config'; muted: boolean; paused: boolean; reducedMotion: boolean }
  | { type: 'match/tap' }
  | { type: 'match/layout'; layout: MatchPairsRuntimeLayout }
  | { type: 'match/drag'; leftIndex: number; point: RuntimePoint | null }
  | {
      type: 'match/feedback'
      correct: boolean
      leftIndex: number
      rightIndex: number
    }
  | { type: 'match/complete' }

export type RuntimeEvent =
  | { type: 'runtime/ready' }
  | { type: 'runtime/error'; message: string; recoverable: boolean }
  | { type: 'runtime/context-lost' }

export type GameRuntimeBridge = RuntimeBridge<RuntimeCommand, RuntimeEvent>

export type PhaserRuntimeFactoryContext = {
  Phaser: typeof Phaser
  parent: HTMLDivElement
  bridge: GameRuntimeBridge
  mode: GameRuntimeMode
}

export type PhaserRuntimeFactory = (
  context: PhaserRuntimeFactoryContext,
) => Phaser.Game
