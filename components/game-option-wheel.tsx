'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

type GameOptionWheelProps = {
  items: string[]
  defaultSelected?: number
  disabled?: boolean
  onChange: (index: number) => void
}

const ROW_HEIGHT = 40

export function GameOptionWheel({
  items,
  defaultSelected = 0,
  disabled = false,
  onChange,
}: GameOptionWheelProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const positionRef = useRef(defaultSelected)
  const targetRef = useRef(defaultSelected)
  const selectedRef = useRef(defaultSelected)
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameRef = useRef(0)
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragRef = useRef<{ y: number; start: number; pointerId: number } | null>(null)
  const dragMovedRef = useRef(false)
  const [selectedIndex, setSelectedIndex] = useState(defaultSelected)
  const [isDragging, setIsDragging] = useState(false)
  const optionId = useId()

  const startLoop = useCallback(() => {
    if (animationFrameRef.current !== null) return

    const runFrame = (now: number) => {
      const elapsed = Math.min((now - lastFrameRef.current) / 1000, 0.05)
      const easing = 1 - Math.exp(-elapsed / 0.18)
      const target = targetRef.current
      const current = positionRef.current
      let next = current + (target - current) * easing
      const settled = Math.abs(target - next) < 0.001

      lastFrameRef.current = now
      if (settled) next = target
      positionRef.current = next

      const radius = ROW_HEIGHT / ((7 * Math.PI) / 180)
      for (let index = 0; index < items.length; index += 1) {
        const element = itemRefs.current[index]
        if (!element) continue

        const distance = index - next
        const angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, distance * ((7 * Math.PI) / 180)))
        const y = radius * Math.sin(angle)
        const x = -radius * (1 - Math.cos(angle)) * 0.88
        const rotation = (angle * 180) / Math.PI
        const strength = Math.max(0, 1 - Math.min(Math.abs(distance), 1))

        element.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rotation.toFixed(2)}deg)`
        element.style.opacity = String(Math.max(0.13, 1 - Math.abs(distance) * 0.28))
        element.style.filter = `blur(${(Math.abs(distance) * 0.55).toFixed(2)}px)`
        element.style.setProperty('--wheel-strength', strength.toFixed(3))
      }

      animationFrameRef.current = settled ? null : requestAnimationFrame(runFrame)
    }

    lastFrameRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(runFrame)
  }, [items.length])

  const applyTarget = useCallback((value: number, snap: boolean) => {
    if (items.length === 0) return

    const clamped = Math.min(Math.max(value, 0), items.length - 1)
    const target = snap ? Math.round(clamped) : clamped
    const nextIndex = Math.round(target)
    targetRef.current = target

    if (nextIndex !== selectedRef.current) {
      selectedRef.current = nextIndex
      setSelectedIndex(nextIndex)
      onChange(nextIndex)
    }

    startLoop()
  }, [items.length, onChange, startLoop])

  useEffect(() => {
    startLoop()
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [startLoop])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const handleWheel = (event: WheelEvent) => {
      if (disabled) return
      event.preventDefault()
      const delta = event.deltaMode === 1 ? event.deltaY * 24 : event.deltaY
      const step = Math.max(-1, Math.min(1, delta / ROW_HEIGHT))
      applyTarget(targetRef.current + step, false)
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
      wheelTimerRef.current = setTimeout(() => applyTarget(targetRef.current, true), 130)
    }

    root.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      root.removeEventListener('wheel', handleWheel)
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
    }
  }, [applyTarget, disabled])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return
    dragRef.current = { y: event.clientY, start: targetRef.current, pointerId: event.pointerId }
    dragMovedRef.current = false
    setIsDragging(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return

    const distance = event.clientY - drag.y
    if (!dragMovedRef.current && Math.abs(distance) > 4) {
      dragMovedRef.current = true
      rootRef.current?.setPointerCapture(drag.pointerId)
    }
    if (dragMovedRef.current) applyTarget(drag.start - distance / ROW_HEIGHT, false)
  }

  const handlePointerEnd = () => {
    if (!dragRef.current) return
    dragRef.current = null
    setIsDragging(false)
    if (dragMovedRef.current) applyTarget(targetRef.current, true)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const direction = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
      ? -1
      : event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 1
        : 0

    if (direction === 0) return
    event.preventDefault()
    applyTarget(Math.round(targetRef.current) + direction, true)
  }

  return (
    <div
      ref={rootRef}
      className={`game-option-wheel${isDragging ? ' is-dragging' : ''}${disabled ? ' is-disabled' : ''}`}
      role="listbox"
      tabIndex={disabled ? -1 : 0}
      aria-label="Answer options"
      aria-activedescendant={`${optionId}-${selectedIndex}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      <span className="game-option-wheel-marker" aria-hidden="true" />
      {items.map((item, index) => (
        <button
          ref={(element) => {
            itemRefs.current[index] = element
          }}
          id={`${optionId}-${index}`}
          type="button"
          className={index === selectedIndex ? 'is-selected' : ''}
          role="option"
          aria-selected={index === selectedIndex}
          disabled={disabled}
          onClick={() => {
            if (!dragMovedRef.current) applyTarget(index, true)
          }}
          key={`${item}-${index}`}
          style={{ '--wheel-strength': 0 } as CSSProperties}
        >
          <span>{String.fromCharCode(65 + index)}</span>
          <strong>{item}</strong>
        </button>
      ))}
    </div>
  )
}
