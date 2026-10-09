'use client'

import Phaser from 'phaser'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type {
  GameRuntimeBridge,
  GameRuntimeMode,
  PhaserRuntimeFactory,
} from '@/lib/game-runtime/contracts'
import styles from './phaser-host.module.css'

export type PhaserHostClientProps = {
  bridge: GameRuntimeBridge
  createGame: PhaserRuntimeFactory
  mode: GameRuntimeMode
  paused: boolean
  reducedMotion: boolean
  interactive: boolean
  className?: string
  fallback?: ReactNode
}

export function PhaserHostClient({
  bridge,
  createGame,
  mode,
  paused,
  reducedMotion,
  interactive,
  className,
  fallback,
}: PhaserHostClientProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const parent = parentRef.current
    if (!parent) return

    let destroyed = false
    let game: Phaser.Game | null = null

    const reportError = (error: unknown, recoverable: boolean) => {
      const message = error instanceof Error ? error.message : 'The game runtime failed to start.'
      bridge.emitEvent({ type: 'runtime/error', message, recoverable })
      setFailed(true)
    }

    try {
      game = createGame({ Phaser, parent, bridge, mode })
      gameRef.current = game

      game.events.once(Phaser.Core.Events.READY, () => {
        if (destroyed) return
        bridge.emitEvent({ type: 'runtime/ready' })
      })
      game.events.on(Phaser.Core.Events.CONTEXT_LOST, () => {
        if (destroyed) return
        bridge.emitEvent({ type: 'runtime/context-lost' })
        setFailed(true)
      })
    } catch (error) {
      reportError(error, false)
    }

    const unsubscribe = bridge.subscribeCommands((command) => {
      if (!game || destroyed) return
      if (command.type === 'runtime/pause') game.pause()
      if (command.type === 'runtime/resume') game.resume()
      if (command.type === 'runtime/destroy') {
        destroyed = true
        game.destroy(true)
        gameRef.current = null
      }
    })

    return () => {
      destroyed = true
      unsubscribe()
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
      parent.replaceChildren()
    }
  }, [bridge, createGame, mode])

  useEffect(() => {
    bridge.sendCommand(paused ? { type: 'runtime/pause' } : { type: 'runtime/resume' })
  }, [bridge, paused])

  useEffect(() => {
    bridge.sendCommand({ type: 'runtime/reduced-motion', enabled: reducedMotion })
  }, [bridge, reducedMotion])

  return (
    <div
      ref={parentRef}
      className={[styles.host, className].filter(Boolean).join(' ')}
      data-interactive={interactive}
      data-runtime-status={failed ? 'failed' : paused ? 'paused' : 'running'}
      aria-hidden="true"
    >
      {failed && fallback ? <div className={styles.fallback}>{fallback}</div> : null}
    </div>
  )
}
