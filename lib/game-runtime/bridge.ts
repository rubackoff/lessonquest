export type RuntimeListener<Message> = (message: Message) => void

export class RuntimeBridge<Command, Event> {
  private readonly commandListeners = new Set<RuntimeListener<Command>>()
  private readonly eventListeners = new Set<RuntimeListener<Event>>()

  sendCommand(command: Command) {
    for (const listener of this.commandListeners) listener(command)
  }

  subscribeCommands(listener: RuntimeListener<Command>) {
    this.commandListeners.add(listener)
    return () => this.commandListeners.delete(listener)
  }

  emitEvent(event: Event) {
    for (const listener of this.eventListeners) listener(event)
  }

  subscribeEvents(listener: RuntimeListener<Event>) {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  clear() {
    this.commandListeners.clear()
    this.eventListeners.clear()
  }
}
