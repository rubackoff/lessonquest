'use client'

import { useEffect, useRef, type HTMLAttributes, type PropsWithChildren } from 'react'

// Adapted from React Bits / ClickSpark (MIT + Commons Clause).
// Source: https://github.com/DavidHDev/react-bits/tree/main/src/ts-default/Animations/ClickSpark
type Spark = {
  x: number
  y: number
  angle: number
  color: string
  startTime: number
}

type ClickSparkLayerProps = {
  color?: string
  count?: number
  duration?: number
  radius?: number
  size?: number
}

export function ClickSparkLayer({
  color = '#48b9ad',
  count = 8,
  duration = 380,
  radius = 24,
  size = 11,
}: ClickSparkLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparksRef = useRef<Spark[]>([])
  const animationRef = useRef<number | null>(null)
  const sizeRef = useRef({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

    const context = canvas.getContext('2d')
    if (!context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      sizeRef.current = { width: rect.width, height: rect.height }
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (timestamp: number) => {
      const { width, height } = sizeRef.current
      context.clearRect(0, 0, width, height)

      sparksRef.current = sparksRef.current.filter((spark) => {
        const progress = (timestamp - spark.startTime) / duration
        if (progress >= 1) return false

        const eased = progress * (2 - progress)
        const distance = eased * radius
        const lineLength = size * (1 - eased)
        const startX = spark.x + distance * Math.cos(spark.angle)
        const startY = spark.y + distance * Math.sin(spark.angle)
        const endX = spark.x + (distance + lineLength) * Math.cos(spark.angle)
        const endY = spark.y + (distance + lineLength) * Math.sin(spark.angle)

        context.globalAlpha = 1 - progress
        context.strokeStyle = spark.color
        context.lineCap = 'round'
        context.lineWidth = 2
        context.beginPath()
        context.moveTo(startX, startY)
        context.lineTo(endX, endY)
        context.stroke()
        return true
      })

      context.globalAlpha = 1
      animationRef.current = sparksRef.current.length > 0
        ? window.requestAnimationFrame(draw)
        : null
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (reducedMotion.matches || event.button > 0) return

      const target = event.target instanceof Element ? event.target : null
      const interactive = target?.closest('button, a, [role="button"], .match-node')
      if (!interactive || !parent.contains(interactive)) return

      const rect = parent.getBoundingClientRect()
      const targetColor = interactive.classList.contains('is-wrong')
        ? '#ee8175'
        : interactive.classList.contains('is-correct')
          ? '#4eb482'
          : color
      const now = performance.now()

      sparksRef.current.push(
        ...Array.from({ length: count }, (_, index) => ({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          angle: (Math.PI * 2 * index) / count,
          color: targetColor,
          startTime: now,
        })),
      )

      if (animationRef.current === null) {
        animationRef.current = window.requestAnimationFrame(draw)
      }
    }

    const observer = new ResizeObserver(resize)
    observer.observe(parent)
    resize()
    parent.addEventListener('pointerdown', handlePointerDown)

    return () => {
      observer.disconnect()
      parent.removeEventListener('pointerdown', handlePointerDown)
      if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current)
    }
  }, [color, count, duration, radius, size])

  return <canvas ref={canvasRef} className="game-click-spark" aria-hidden="true" />
}

// Adapted from React Bits / DotField (MIT + Commons Clause).
// Source: https://github.com/DavidHDev/react-bits/tree/main/src/ts-default/Backgrounds/DotField
type Dot = { x: number; y: number }

type DotFieldLayerProps = {
  spacing?: number
  radius?: number
  influence?: number
}

export function DotFieldLayer({ spacing = 34, radius = 1.35, influence = 150 }: DotFieldLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const pointerRef = useRef({ x: -9999, y: -9999, strength: 0 })
  const animationRef = useRef<number | null>(null)
  const sizeRef = useRef({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

    const context = canvas.getContext('2d')
    if (!context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const draw = () => {
      const { width, height } = sizeRef.current
      const pointer = pointerRef.current
      const dotColor = getComputedStyle(canvas).getPropertyValue('--game-dot-color').trim() || 'rgba(57, 191, 174, 0.24)'

      context.clearRect(0, 0, width, height)
      context.fillStyle = dotColor
      context.beginPath()

      for (const dot of dotsRef.current) {
        const deltaX = pointer.x - dot.x
        const deltaY = pointer.y - dot.y
        const distance = Math.hypot(deltaX, deltaY)
        const proximity = Math.max(0, 1 - distance / influence)
        const push = reducedMotion.matches ? 0 : proximity * proximity * 18 * pointer.strength
        const angle = Math.atan2(deltaY, deltaX)
        const x = dot.x - Math.cos(angle) * push
        const y = dot.y - Math.sin(angle) * push
        const dotRadius = radius + proximity * pointer.strength * 0.8

        context.moveTo(x + dotRadius, y)
        context.arc(x, y, dotRadius, 0, Math.PI * 2)
      }

      context.fill()
    }

    const settle = () => {
      pointerRef.current.strength *= 0.8
      draw()
      animationRef.current = pointerRef.current.strength > 0.015
        ? window.requestAnimationFrame(settle)
        : null
    }

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      sizeRef.current = { width: rect.width, height: rect.height }
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const dots: Dot[] = []
      const offsetX = (rect.width % spacing) / 2
      const offsetY = (rect.height % spacing) / 2
      for (let y = offsetY; y < rect.height; y += spacing) {
        for (let x = offsetX; x < rect.width; x += spacing) dots.push({ x, y })
      }
      dotsRef.current = dots
      draw()
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion.matches || event.pointerType === 'touch') return
      const rect = parent.getBoundingClientRect()
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        strength: 1,
      }
      draw()
    }

    const handlePointerLeave = () => {
      if (reducedMotion.matches) return
      if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current)
      animationRef.current = window.requestAnimationFrame(settle)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(parent)
    parent.addEventListener('pointermove', handlePointerMove)
    parent.addEventListener('pointerleave', handlePointerLeave)
    resize()

    return () => {
      observer.disconnect()
      parent.removeEventListener('pointermove', handlePointerMove)
      parent.removeEventListener('pointerleave', handlePointerLeave)
      if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current)
    }
  }, [influence, radius, spacing])

  return <canvas ref={canvasRef} className="game-dot-field" aria-hidden="true" />
}

// Adapted from React Bits / SpotlightCard (MIT + Commons Clause).
// Source: https://github.com/DavidHDev/react-bits/tree/main/src/ts-default/Components/SpotlightCard
type SpotlightAsideProps = PropsWithChildren<HTMLAttributes<HTMLElement>>

export function SpotlightAside({ children, className = '', ...props }: SpotlightAsideProps) {
  const ref = useRef<HTMLElement>(null)

  return (
    <aside
      ref={ref}
      className={`game-spotlight-surface ${className}`.trim()}
      onPointerMove={(event) => {
        if (event.pointerType === 'touch') return
        const rect = event.currentTarget.getBoundingClientRect()
        event.currentTarget.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`)
        event.currentTarget.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`)
      }}
      {...props}
    >
      {children}
    </aside>
  )
}
