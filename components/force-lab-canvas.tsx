'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Check, Flag, Gauge, MoveUpRight, Target } from 'lucide-react'
import type { BalanceResult, ForceLabLevel } from '@/lib/force-lab'
import { clamp } from '@/lib/force-lab'

type ForceLabCanvasProps = {
  level: ForceLabLevel
  force: number
  angle: number
  result: BalanceResult
  running: boolean
  onVectorChange: (force: number, angle: number) => void
}

type SceneSize = {
  width: number
  height: number
}

type VectorPoint = {
  x: number
  y: number
}

const ORIGIN_X = 0.365
const ORIGIN_Y = 0.69
const MAX_VECTOR_WIDTH = 0.37

export function ForceLabCanvas({
  level,
  force,
  angle,
  result,
  running,
  onVectorChange,
}: ForceLabCanvasProps) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const pendingVectorRef = useRef({ force, angle })
  const prefersReducedMotion = useReducedMotion()
  const [sceneSize, setSceneSize] = useState<SceneSize>({ width: 1000, height: 560 })
  const [dragging, setDragging] = useState(false)
  const [previewVector, setPreviewVector] = useState({ force, angle })

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const updateSize = () => {
      const rect = scene.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setSceneSize({ width: rect.width, height: rect.height })
      }
    }

    const observer = new ResizeObserver(updateSize)
    observer.observe(scene)
    updateSize()
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    }
  }, [])

  useEffect(() => {
    if (!dragging) pendingVectorRef.current = { force, angle }
  }, [angle, dragging, force])

  const commitVector = (nextForce: number, nextAngle: number) => {
    pendingVectorRef.current = { force: nextForce, angle: nextAngle }
    if (frameRef.current !== null) return

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null
      onVectorChange(pendingVectorRef.current.force, pendingVectorRef.current.angle)
    })
  }

  const updateFromPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const scene = sceneRef.current
    if (!scene) return

    const rect = scene.getBoundingClientRect()
    const originX = rect.width * ORIGIN_X
    const originY = rect.height * ORIGIN_Y
    const dx = event.clientX - rect.left - originX
    const dy = originY - (event.clientY - rect.top)
    const nextAngle = clamp(Math.round((Math.atan2(dy, Math.max(dx, 1)) * 180) / Math.PI), 0, 55)
    const nextForce = clamp(Math.round((Math.hypot(dx, dy) / (rect.width * MAX_VECTOR_WIDTH)) * 18), 1, 18)

    setPreviewVector({ force: nextForce, angle: nextAngle })
    commitVector(nextForce, nextAngle)
  }

  const startDragging = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!running || result.gateOpen) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    updateFromPointer(event)
  }

  const moveDragging = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging) return
    updateFromPointer(event)
  }

  const finishDragging = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDragging(false)
  }

  const adjustVectorFromKeyboard = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!running || result.gateOpen) return

    let nextForce = pendingVectorRef.current.force
    let nextAngle = pendingVectorRef.current.angle
    if (event.key === 'ArrowUp') nextForce = clamp(nextForce + 1, 1, 18)
    else if (event.key === 'ArrowDown') nextForce = clamp(nextForce - 1, 1, 18)
    else if (event.key === 'ArrowRight') nextAngle = clamp(nextAngle + 1, 0, 55)
    else if (event.key === 'ArrowLeft') nextAngle = clamp(nextAngle - 1, 0, 55)
    else return

    event.preventDefault()
    setPreviewVector({ force: nextForce, angle: nextAngle })
    commitVector(nextForce, nextAngle)
  }

  const vector = dragging ? previewVector : { force, angle }
  const origin = getOrigin(sceneSize)
  const endpoint = getVectorEndpoint(sceneSize, vector.force, vector.angle)
  const targetEndpoint = getVectorEndpoint(sceneSize, level.targetForce, level.targetAngle)
  const nearTarget = result.forceGap <= 2 && result.angleGap <= 8
  const coachMessage = result.gateOpen
    ? 'The hit is accurate. The gate is open.'
    : dragging
      ? nearTarget
        ? 'Almost in the center - release gently.'
        : 'Watch the length and angle at the same time.'
      : result.answerCorrect
        ? 'The answer is ready. All that remains is to combine the vector.'
        : 'Solve the equation first, then set up F2.'

  return (
    <section
      className={`game-canvas force-canvas force-stage-v2${dragging ? ' is-dragging' : ''}${nearTarget ? ' is-near-target' : ''}${result.vectorAligned ? ' is-aligned' : ''}${result.gateOpen ? ' is-complete' : ''}`}
      aria-label="Game &quot;Laboratory of Forces&quot;"
    >
      <header className="force-v2-header">
        <div className="force-v2-heading">
          <span className="force-v2-mark" aria-hidden="true"><Target size={24} /></span>
          <div>
            <h2>Forces laboratory</h2>
            <p>Align vector F2 with the magnetic target</p>
          </div>
        </div>
        <div className={`force-v2-progress${result.vectorAligned ? ' is-aligned' : ''}`}>
          <strong>{result.efficiency}%</strong>
          <span>accuracy</span>
          <i aria-hidden="true"><b style={{ width: `${result.efficiency}%` }} /></i>
        </div>
      </header>

      <div className="force-v2-scene" ref={sceneRef}>
        <div className="force-v2-ambient ambient-one" aria-hidden="true" />
        <div className="force-v2-ambient ambient-two" aria-hidden="true" />

        <motion.article
          className={`force-v2-equation${result.answerCorrect ? ' is-solved' : ''}`}
          initial={prefersReducedMotion ? false : { opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 230, damping: 24 }}
        >
          <span>Equation</span>
          <strong>{level.equation}</strong>
          <small>
            {result.answerCorrect ? <><Check size={15} /> x = {level.answer}</> : <>solve x in the left panel</>}
          </small>
        </motion.article>

        <div
          className={`force-v2-target${nearTarget ? ' is-near' : ''}${result.vectorAligned ? ' is-aligned' : ''}`}
          style={{ left: targetEndpoint.x, top: targetEndpoint.y }}
          aria-hidden="true"
        >
          <span />
          <i />
          <b>{level.targetForce} N</b>
          <small>{level.targetAngle}°</small>
        </div>

        <svg
          className="force-v2-vectors"
          viewBox={`0 0 ${sceneSize.width} ${sceneSize.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker id={`force-target-arrow-${level.id}`} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="rgba(12,166,163,.24)" />
            </marker>
            <marker id={`force-player-arrow-${level.id}`} markerWidth="10" markerHeight="10" refX="7.5" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" fill={result.vectorAligned ? '#15945b' : '#0ca6a3'} />
            </marker>
            <filter id={`force-vector-glow-${level.id}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <line
            className="force-v2-target-vector"
            x1={origin.x}
            y1={origin.y}
            x2={targetEndpoint.x}
            y2={targetEndpoint.y}
            markerEnd={`url(#force-target-arrow-${level.id})`}
          />
          <line
            className="force-v2-player-vector-shadow"
            x1={origin.x}
            y1={origin.y}
            x2={endpoint.x}
            y2={endpoint.y}
          />
          <line
            className="force-v2-player-vector"
            x1={origin.x}
            y1={origin.y}
            x2={endpoint.x}
            y2={endpoint.y}
            markerEnd={`url(#force-player-arrow-${level.id})`}
            filter={`url(#force-vector-glow-${level.id})`}
          />
          <path
            className="force-v2-angle-arc"
            d={makeAngleArc(origin, vector.angle, Math.min(sceneSize.width * 0.09, 86))}
          />
        </svg>

        <div
          className="force-v2-handle-anchor"
          style={{ left: endpoint.x, top: endpoint.y }}
        >
          <motion.button
            type="button"
            className="force-v2-handle"
            disabled={!running || result.gateOpen}
            aria-label={`Vector F2: ${vector.force} N, angle ${vector.angle} degrees. The up and down arrows change the strength, left and right - the angle.`}
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
            onKeyDown={adjustVectorFromKeyboard}
            onPointerDown={startDragging}
            onPointerMove={moveDragging}
            onPointerUp={finishDragging}
            onPointerCancel={finishDragging}
            animate={prefersReducedMotion || dragging ? undefined : { scale: [1, 1.055, 1] }}
            transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            whileHover={running && !prefersReducedMotion ? { scale: 1.08 } : undefined}
            whileTap={running && !prefersReducedMotion ? { scale: 0.96 } : undefined}
          >
            <MoveUpRight size={19} aria-hidden="true" />
            <span><strong>{vector.force} N</strong><small>{vector.angle}°</small></span>
          </motion.button>
        </div>

        <div
          className="force-v2-rover"
          aria-hidden="true"
        >
          <span className="force-v2-rover-antenna"><i /></span>
          <span className="force-v2-rover-body"><b>F2</b><i /></span>
          <span className="force-v2-rover-wheel wheel-one" />
          <span className="force-v2-rover-wheel wheel-two" />
        </div>

        <div className={`force-v2-gate${result.gateOpen ? ' is-open' : ''}`} aria-hidden="true">
          <span className="force-v2-gate-badge"><Flag size={18} /></span>
          <i />
          <b />
          <small>{result.gateOpen ? 'Open' : 'Finish'}</small>
        </div>

        <div className="force-v2-platform" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>

        <aside className={`force-v2-coach${result.gateOpen ? ' is-complete' : ''}`} aria-label={`Corgi Helper: ${coachMessage}`}>
          <motion.div
            animate={prefersReducedMotion ? undefined : result.gateOpen
              ? { y: [0, -9, 0], rotate: [0, -2, 2, 0] }
              : { y: [0, -2, 0] }}
            transition={result.gateOpen
              ? { duration: 0.65 }
              : { duration: 3.3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            <Image src="/corgi-coach-full-v3.png" alt="Corgi helper" width={1254} height={1254} priority />
          </motion.div>
          {(dragging || result.answerCorrect || result.gateOpen) ? <p>{coachMessage}</p> : null}
        </aside>

        <div className={`force-v2-readout${nearTarget ? ' is-near' : ''}${result.vectorAligned ? ' is-aligned' : ''}`}>
          <Gauge size={18} aria-hidden="true" />
          <div><span>F2</span><strong>{vector.force} N · {vector.angle}°</strong></div>
        </div>

        {result.gateOpen ? (
          <div className="force-v2-success" role="status">
            <span><Check size={22} /></span>
            <div><strong>Vector coincided</strong><small>The experiment is completed</small></div>
          </div>
        ) : null}
      </div>

      {!running && !result.gateOpen ? (
        <div className="force-v2-paused" role="status">
          <strong>Pause</strong>
          <span>Vector position saved</span>
        </div>
      ) : null}
    </section>
  )
}

function getOrigin(size: SceneSize): VectorPoint {
  return { x: size.width * ORIGIN_X, y: size.height * ORIGIN_Y }
}

function getVectorEndpoint(size: SceneSize, force: number, angle: number): VectorPoint {
  const origin = getOrigin(size)
  const length = size.width * MAX_VECTOR_WIDTH * (force / 18)
  const radians = (angle * Math.PI) / 180
  return {
    x: origin.x + Math.cos(radians) * length,
    y: origin.y - Math.sin(radians) * length,
  }
}

function makeAngleArc(origin: VectorPoint, angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180
  const endX = origin.x + Math.cos(radians) * radius
  const endY = origin.y - Math.sin(radians) * radius
  return `M ${origin.x + radius} ${origin.y} A ${radius} ${radius} 0 0 0 ${endX} ${endY}`
}
