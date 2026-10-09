'use client'

import { useEffect, useState } from 'react'
import { RuntimeBridge } from '@/lib/game-runtime/bridge'
import type { RuntimeCommand, RuntimeEvent } from '@/lib/game-runtime/contracts'

export function useGameRuntimeBridge() {
  const [bridge] = useState(() => new RuntimeBridge<RuntimeCommand, RuntimeEvent>())

  useEffect(() => {
    return () => bridge.clear()
  }, [bridge])

  return bridge
}
