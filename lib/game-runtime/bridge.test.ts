import { describe, expect, it, vi } from 'vitest'
import { RuntimeBridge } from './bridge'

type Command = { type: 'pause' } | { type: 'resume' }
type Event = { type: 'ready' } | { type: 'error'; message: string }

describe('RuntimeBridge', () => {
  it('delivers commands and stops after unsubscribe', () => {
    const bridge = new RuntimeBridge<Command, Event>()
    const listener = vi.fn()
    const unsubscribe = bridge.subscribeCommands(listener)

    bridge.sendCommand({ type: 'pause' })
    unsubscribe()
    bridge.sendCommand({ type: 'resume' })

    expect(listener).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledWith({ type: 'pause' })
  })

  it('keeps commands and events on separate channels', () => {
    const bridge = new RuntimeBridge<Command, Event>()
    const commandListener = vi.fn()
    const eventListener = vi.fn()

    bridge.subscribeCommands(commandListener)
    bridge.subscribeEvents(eventListener)
    bridge.emitEvent({ type: 'ready' })

    expect(commandListener).not.toHaveBeenCalled()
    expect(eventListener).toHaveBeenCalledWith({ type: 'ready' })
  })

  it('removes every listener on clear', () => {
    const bridge = new RuntimeBridge<Command, Event>()
    const commandListener = vi.fn()
    const eventListener = vi.fn()

    bridge.subscribeCommands(commandListener)
    bridge.subscribeEvents(eventListener)
    bridge.clear()
    bridge.sendCommand({ type: 'pause' })
    bridge.emitEvent({ type: 'ready' })

    expect(commandListener).not.toHaveBeenCalled()
    expect(eventListener).not.toHaveBeenCalled()
  })
})
