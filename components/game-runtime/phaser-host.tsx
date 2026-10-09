'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import type {
  GameRuntimeBridge,
  GameRuntimeMode,
  PhaserRuntimeFactory,
} from '@/lib/game-runtime/contracts'
import { GameRuntimeErrorBoundary } from '@/components/game-runtime/game-error-fallback'
import type { PhaserHostClientProps } from '@/components/game-runtime/phaser-host-client'

const ClientHost = dynamic<PhaserHostClientProps>(
  () => import('@/components/game-runtime/phaser-host-client').then((module) => module.PhaserHostClient),
  { ssr: false },
)

type PhaserHostProps = {
  bridge: GameRuntimeBridge
  createGame: PhaserRuntimeFactory
  mode?: GameRuntimeMode
  paused?: boolean
  reducedMotion?: boolean
  interactive?: boolean
  className?: string
  fallback?: ReactNode
}

export function PhaserHost({
  bridge,
  createGame,
  mode = 'player',
  paused = false,
  reducedMotion = false,
  interactive = false,
  className,
  fallback,
}: PhaserHostProps) {
  return (
    <GameRuntimeErrorBoundary fallback={fallback}>
      <ClientHost
        bridge={bridge}
        createGame={createGame}
        mode={mode}
        paused={paused}
        reducedMotion={reducedMotion}
        interactive={interactive}
        className={className}
        fallback={fallback}
      />
    </GameRuntimeErrorBoundary>
  )
}
