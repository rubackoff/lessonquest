'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

type GameRuntimeErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
}

type GameRuntimeErrorBoundaryState = {
  failed: boolean
}

export class GameRuntimeErrorBoundary extends Component<
  GameRuntimeErrorBoundaryProps,
  GameRuntimeErrorBoundaryState
> {
  state: GameRuntimeErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): GameRuntimeErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Game runtime failed to render.', error, info.componentStack)
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}

export function GameRuntimeFallback() {
  return (
    <div role="status">
      Game graphics are not available. The task continues to work in simplified mode.
    </div>
  )
}
