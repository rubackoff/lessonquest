'use client'

import { Check, Gauge, MoveUpRight, Target } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { PhaserHost } from '@/components/game-runtime/phaser-host'
import { useGameRuntimeBridge } from '@/components/game-runtime/use-game-runtime-bridge'
import { RuntimeBridge } from '@/lib/game-runtime/bridge'
import type { BalanceResult, ForceLabLevel } from '@/lib/force-lab'
import { clamp } from '@/lib/force-lab'
import {
  createForceLabRuntime,
  type ForceLabRuntimeEvent,
  type ForceLabVisualCommand,
} from './force-lab-runtime'
import styles from './force-lab.module.css'

export type ForceLabGameProps = {
  level: ForceLabLevel
  force: number
  angle: number
  result: BalanceResult
  running: boolean
  onVectorChange: (force: number, angle: number) => void
  answer?: string
  onAnswerChange?: (answer: string) => void
  onSnap?: () => void
  onVerify?: () => void
}

export function ForceLabGame({
  level,
  force,
  angle,
  result,
  running,
  onVectorChange,
  answer,
  onAnswerChange,
  onSnap,
  onVerify,
}: ForceLabGameProps) {
  const lifecycleBridge = useGameRuntimeBridge()
  const [visualBridge] = useState(
    () => new RuntimeBridge<ForceLabVisualCommand, ForceLabRuntimeEvent>(),
  )
  const createRuntime = useMemo(
    () => createForceLabRuntime(visualBridge),
    [visualBridge],
  )
  const reducedMotion = Boolean(useReducedMotion())
  const onVectorChangeRef = useRef(onVectorChange)
  const vectorRef = useRef({ force, angle })
  const [runtimeRevision, setRuntimeRevision] = useState(0)
  const [dragging, setDragging] = useState(false)
  const nearTarget = result.forceGap <= 2 && result.angleGap <= 8

  useEffect(() => {
    onVectorChangeRef.current = onVectorChange
  }, [onVectorChange])

  useEffect(() => {
    vectorRef.current = { force, angle }
  }, [angle, force])

  useEffect(() => {
    const unsubscribeLifecycle = lifecycleBridge.subscribeEvents((event) => {
      if (event.type === 'runtime/ready') setRuntimeRevision((revision) => revision + 1)
    })
    const unsubscribeVisual = visualBridge.subscribeEvents((event) => {
      if (event.type === 'force/drag-state') {
        setDragging(event.dragging)
        return
      }
      vectorRef.current = { force: event.force, angle: event.angle }
      onVectorChangeRef.current(event.force, event.angle)
    })

    return () => {
      unsubscribeLifecycle()
      unsubscribeVisual()
    }
  }, [lifecycleBridge, visualBridge])

  useEffect(() => {
    return () => visualBridge.clear()
  }, [visualBridge])

  useEffect(() => {
    visualBridge.sendCommand({ type: 'force/reset' })
  }, [level.id, runtimeRevision, visualBridge])

  useEffect(() => {
    visualBridge.sendCommand({
      type: 'force/state',
      state: {
        levelId: level.id,
        force,
        angle,
        targetForce: level.targetForce,
        targetAngle: level.targetAngle,
        answerCorrect: result.answerCorrect,
        vectorAligned: result.vectorAligned,
        gateOpen: result.gateOpen,
        forceGap: result.forceGap,
        angleGap: result.angleGap,
        efficiency: result.efficiency,
        running,
      },
    })
  }, [angle, force, level.id, level.targetAngle, level.targetForce, result, running, runtimeRevision, visualBridge])

  useEffect(() => {
    if (running && !result.gateOpen) return
    const frame = window.requestAnimationFrame(() => setDragging(false))
    return () => window.cancelAnimationFrame(frame)
  }, [result.gateOpen, running])

  const adjustVectorFromKeyboard = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!running || result.gateOpen) return

    let nextForce = vectorRef.current.force
    let nextAngle = vectorRef.current.angle
    if (event.key === 'ArrowUp') nextForce = clamp(nextForce + 1, 1, 18)
    else if (event.key === 'ArrowDown') nextForce = clamp(nextForce - 1, 1, 18)
    else if (event.key === 'ArrowRight') nextAngle = clamp(nextAngle + 1, 0, 55)
    else if (event.key === 'ArrowLeft') nextAngle = clamp(nextAngle - 1, 0, 55)
    else return

    event.preventDefault()
    vectorRef.current = { force: nextForce, angle: nextAngle }
    onVectorChangeRef.current(nextForce, nextAngle)
  }

  const announcement = result.gateOpen
    ? `The vector coincided. The gate is open. Strength ${force} newtons, angle ${angle} degrees.`
    : dragging
      ? nearTarget
        ? `Almost there. Strength ${force} newtons, angle ${angle} degrees.`
        : `Vector setting. Strength ${force} newtons, angle ${angle} degrees.`
      : result.vectorAligned
        ? 'The vector is configured correctly. Solve the equation to open the gate.'
        : result.answerCorrect
          ? 'The equation is solved. Align the vector with the magnetic target.'
          : 'First solve the equation, then adjust the F2 vector.'

  return (
    <section
      className={styles.scene}
      data-game-shell="force-lab"
      data-dragging={dragging}
      data-near-target={nearTarget}
      data-aligned={result.vectorAligned}
      data-complete={result.gateOpen}
      style={{ '--force-efficiency': `${result.efficiency}%` } as CSSProperties}
      aria-label="Game &quot;Laboratory of Forces&quot;"
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.mark} aria-hidden="true"><Target size={27} strokeWidth={2.35} /></span>
          <div className={styles.titleBlock}>
            <h2>Forces laboratory</h2>
            <p>Align vector F2 with magnetic target</p>
          </div>
        </div>
        <div className={styles.progress} aria-label={`Setting accuracy ${result.efficiency}%`}>
          <div><strong>{result.efficiency}%</strong><span>accuracy</span></div>
          <i aria-hidden="true"><b /></i>
        </div>
      </header>

      <div className={styles.world}>
        <PhaserHost
          bridge={lifecycleBridge}
          createGame={createRuntime}
          paused={!running}
          reducedMotion={reducedMotion}
          interactive={running && !result.gateOpen}
          className={styles.runtime}
          fallback={<span>The interactive scene is temporarily unavailable. Numerical control remains active.</span>}
        />

        <article
          className={styles.equation}
          data-solved={result.answerCorrect}
          data-editable={Boolean(onAnswerChange)}
        >
          <span>Equation</span>
          <strong>{level.equation}</strong>
          <div>
            <small>{level.unknown} =</small>
            {result.answerCorrect ? (
              <b>{level.answer}</b>
            ) : onAnswerChange ? (
              <input
                value={answer ?? ''}
                inputMode="decimal"
                aria-label={`Reply for ${level.unknown}`}
                placeholder="answer"
                disabled={!running}
                onChange={(event) => onAnswerChange(event.target.value)}
              />
            ) : (
              <b>—</b>
            )}
            {result.answerCorrect ? <i aria-label="The answer is correct"><Check size={17} /></i> : null}
          </div>
          {!result.answerCorrect && !onAnswerChange ? <p>Decide {level.unknown} in the task panel</p> : null}
          {onAnswerChange && !result.gateOpen ? (
            <div className={styles.equationActions}>
              {onSnap ? <button type="button" aria-label="Set the vector to the target" disabled={!running} onClick={onSnap}>Goal</button> : null}
              {onVerify ? <button type="button" disabled={!running} onClick={onVerify}>Check</button> : null}
            </div>
          ) : null}
        </article>

        <div className={styles.targetReadout} aria-label={`Goal: ${level.targetForce} newtons, angle ${level.targetAngle} degrees`}>
          <Target size={17} aria-hidden="true" />
          <span>goal</span>
          <strong>{level.targetForce} N · {level.targetAngle}°</strong>
        </div>

        <button
          type="button"
          className={styles.vectorControl}
          disabled={!running || result.gateOpen}
          aria-label={`Vector F2: ${force} newtons, angle ${angle} degrees. The up and down arrows change the strength, left and right - the angle.`}
          aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
          onKeyDown={adjustVectorFromKeyboard}
          onFocus={() => visualBridge.sendCommand({ type: 'force/focus', focused: true })}
          onBlur={() => visualBridge.sendCommand({ type: 'force/focus', focused: false })}
        >
          <MoveUpRight size={20} aria-hidden="true" />
          <span><small>F2</small><strong>{force} N · {angle}°</strong></span>
          <kbd aria-hidden="true">↑↓ force ←→ angle</kbd>
        </button>

        <aside className={styles.metrics} aria-label="Experiment parameters">
          <Gauge size={17} aria-hidden="true" />
          <span>mass <strong>{level.mass} kg</strong></span>
          <span>friction <strong>{level.friction} N</strong></span>
        </aside>

        <p className={styles.liveRegion} role="status" aria-live="polite">{announcement}</p>

        {!running && !result.gateOpen ? (
          <div className={styles.paused} role="status">
            <strong>Pause</strong>
            <span>Vector position saved</span>
          </div>
        ) : null}

        {result.gateOpen ? (
          <div className={styles.complete} role="status">
            <span><Check size={23} /></span>
            <div><strong>Vector coincided</strong><small>The gate is open, the experiment is completed</small></div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
