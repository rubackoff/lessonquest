'use client'

import Image from 'next/image'
import { Check, Target } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { PhaserHost } from '@/components/game-runtime/phaser-host'
import { useGameRuntimeBridge } from '@/components/game-runtime/use-game-runtime-bridge'
import { GeometryDiagram } from '@/components/geometry-diagram'
import { LearningImageView } from '@/components/learning-image'
import type {
  MatchPairsRuntimeLayout,
  RuntimePoint,
} from '@/lib/game-runtime/contracts'
import type { MatchConnection, MatchPairsLevel, MatchPairsResult } from '@/lib/match-pairs'
import { getVisualThemeId } from '@/lib/visual-themes'
import { createMatchPairsRuntime } from './match-pairs-runtime'
import styles from './match-pairs.module.css'

export type MatchPairsGameProps = {
  level: MatchPairsLevel
  connections: MatchConnection[]
  result: MatchPairsResult
  running: boolean
  mode?: 'player' | 'preview'
  muted?: boolean
  resultStatus?: string
  sessionRevision?: number
  onConnect: (leftIndex: number, rightIndex: number) => void
}

type DragState = {
  sessionId: string
  leftIndex: number
  point: RuntimePoint
}

type SelectedLeftState = {
  sessionId: string
  index: number
}

type RejectedPair = {
  sessionId: string
  leftIndex: number
  rightIndex: number
  attempt: number
}

type CoachReaction = {
  sessionId: string
  kind: 'correct' | 'wrong'
  sequence: number
}

const emptyLayout: MatchPairsRuntimeLayout = {
  width: 1,
  height: 1,
  left: [],
  right: [],
  connections: [],
}

export function MatchPairsGame({
  level,
  connections,
  result,
  running,
  mode = 'player',
  muted = false,
  resultStatus,
  sessionRevision = 0,
  onConnect,
}: MatchPairsGameProps) {
  const bridge = useGameRuntimeBridge()
  const sessionId = `${level.id}:${sessionRevision}`
  const boardRef = useRef<HTMLDivElement>(null)
  const leftCardRefs = useRef<Array<HTMLButtonElement | null>>([])
  const leftNodeRefs = useRef<Array<HTMLSpanElement | null>>([])
  const rightNodeRefs = useRef<Array<HTMLSpanElement | null>>([])
  const rightCardRefs = useRef<Array<HTMLButtonElement | null>>([])
  const mobileSourceRef = useRef<HTMLDivElement>(null)
  const mobileNextRef = useRef<HTMLButtonElement>(null)
  const completeRef = useRef<HTMLDivElement>(null)
  const rejectTimerRef = useRef<number | null>(null)
  const coachTimerRef = useRef<number | null>(null)
  const coachSequenceRef = useRef(0)
  const completedSessionRef = useRef<string | null>(null)
  const [layout, setLayout] = useState<MatchPairsRuntimeLayout>(emptyLayout)
  const [runtimeRevision, setRuntimeRevision] = useState(0)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null)
  const [selectedLeft, setSelectedLeft] = useState<SelectedLeftState | null>(null)
  const [rejected, setRejected] = useState<RejectedPair | null>(null)
  const [coachReaction, setCoachReaction] = useState<CoachReaction | null>(null)
  const [announcement, setAnnouncement] = useState({
    sessionId,
    message: 'Select the card on the left, then the matching card on the right.',
  })
  const [mobileFocus, setMobileFocus] = useState({ sessionId, index: 0 })
  const reducedMotion = usePrefersReducedMotion()
  const themeId = getVisualThemeId(level)
  const activeDrag = drag?.sessionId === sessionId ? drag : null
  const selectedLeftIndex = selectedLeft?.sessionId === sessionId ? selectedLeft.index : null
  const activeRejected = rejected?.sessionId === sessionId ? rejected : null
  const rightOrder = useMemo(() => getRightOrder(level.pairs.length), [level.pairs.length])
  const correctLeftIndices = useMemo(() => {
    return new Set(
      connections
        .filter((connection) => isCorrectConnection(level, connection))
        .map((connection) => connection.leftIndex),
    )
  }, [connections, level])
  const correctRightIndices = useMemo(() => {
    return new Set(
      connections
        .filter((connection) => isCorrectConnection(level, connection))
        .map((connection) => connection.rightIndex),
    )
  }, [connections, level])

  useEffect(() => {
    const unsubscribe = bridge.subscribeEvents((event) => {
      if (event.type === 'runtime/ready') setRuntimeRevision((value) => value + 1)
    })
    return () => {
      unsubscribe()
    }
  }, [bridge])

  useEffect(() => {
    return () => {
      if (rejectTimerRef.current !== null) window.clearTimeout(rejectTimerRef.current)
      if (coachTimerRef.current !== null) window.clearTimeout(coachTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const board = boardRef.current
    if (!board) return

    const updateLayout = () => {
      const boardRect = board.getBoundingClientRect()
      if (!boardRect.width || !boardRect.height) return

      const pointFor = (element: HTMLElement | null): RuntimePoint | null => {
        if (!element) return null
        const rect = element.getBoundingClientRect()
        return {
          x: rect.left - boardRect.left + rect.width / 2,
          y: rect.top - boardRect.top + rect.height / 2,
        }
      }

      setLayout({
        width: boardRect.width,
        height: boardRect.height,
        left: level.pairs.map((_, index) => pointFor(leftNodeRefs.current[index])),
        right: level.pairs.map((_, index) => pointFor(rightNodeRefs.current[index])),
        connections,
      })
    }

    const frame = window.requestAnimationFrame(updateLayout)
    const observer = new ResizeObserver(updateLayout)
    observer.observe(board)
    for (const card of [...leftCardRefs.current, ...rightCardRefs.current]) {
      if (card) observer.observe(card)
    }

    void document.fonts?.ready.then(updateLayout)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [connections, level.id, level.pairs, rightOrder])

  useEffect(() => {
    bridge.sendCommand({ type: 'match/theme', themeId })
    bridge.sendCommand({
      type: 'match/layout',
      layout: { ...layout, connections },
    })
  }, [bridge, connections, layout, runtimeRevision, themeId])

  useEffect(() => {
    bridge.sendCommand({
      type: 'match/sound-config',
      muted,
      paused: !running,
      reducedMotion,
    })
  }, [bridge, muted, reducedMotion, running, runtimeRevision])

  useEffect(() => {
    bridge.sendCommand({ type: 'match/drag', leftIndex: 0, point: null })
  }, [bridge, runtimeRevision, sessionId])

  useEffect(() => {
    if (result.complete && completedSessionRef.current !== sessionId) {
      completedSessionRef.current = sessionId
      bridge.sendCommand({ type: 'match/complete' })
    }
    if (!result.complete && completedSessionRef.current === sessionId) {
      completedSessionRef.current = null
    }
  }, [bridge, result.complete, sessionId])

  useEffect(() => {
    if (!result.complete) return
    const frame = window.requestAnimationFrame(() => completeRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [result.complete])

  const attemptConnection = (leftIndex: number, rightIndex: number) => {
    const correct = level.pairs[leftIndex]?.id === level.pairs[rightIndex]?.id
    const leftLabel = pairSideLabel(level, leftIndex, 'left')
    const rightLabel = pairSideLabel(level, rightIndex, 'right')
    setAnnouncement({
      sessionId,
      message: correct
        ? `Right: ${leftLabel} — ${rightLabel}. Collected ${result.correct + 1} from ${result.total}.`
        : `Incorrect: ${leftLabel} does not correspond ${rightLabel}. Choose another pair.`,
    })

    if (coachTimerRef.current !== null) window.clearTimeout(coachTimerRef.current)
    coachSequenceRef.current += 1
    setCoachReaction({
      sessionId,
      kind: correct ? 'correct' : 'wrong',
      sequence: coachSequenceRef.current,
    })
    coachTimerRef.current = window.setTimeout(() => {
      setCoachReaction(null)
      coachTimerRef.current = null
    }, correct ? 760 : 620)

    bridge.sendCommand({
      type: 'match/feedback',
      correct,
      leftIndex,
      rightIndex,
    })

    if (correct) {
      setRejected(null)
      onConnect(leftIndex, rightIndex)
      return true
    }

    if (rejectTimerRef.current !== null) window.clearTimeout(rejectTimerRef.current)
    setRejected((current) => ({
      sessionId,
      leftIndex,
      rightIndex,
      attempt: (current?.attempt ?? 0) + 1,
    }))
    onConnect(leftIndex, rightIndex)
    rejectTimerRef.current = window.setTimeout(() => {
      setRejected(null)
      rejectTimerRef.current = null
    }, 620)
    return false
  }

  const startDrag = (leftIndex: number, event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!running || correctLeftIndices.has(leftIndex)) return
    const board = boardRef.current
    const start = layout.left[leftIndex]
    if (!board || !start) return

    event.preventDefault()
    event.stopPropagation()
    board.setPointerCapture(event.pointerId)
    setDragTargetIndex(null)
    setSelectedLeft({ sessionId, index: leftIndex })
    setDrag({ sessionId, leftIndex, point: start })
    bridge.sendCommand({ type: 'match/drag', leftIndex, point: start })
  }

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeDrag || !boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    const targetIndex = findMagneticTarget(rightCardRefs.current, event.clientX, event.clientY)
    const targetPoint = targetIndex === null ? null : layout.right[targetIndex]
    const visualPoint = targetPoint
      ? {
          x: point.x + (targetPoint.x - point.x) * 0.82,
          y: point.y + (targetPoint.y - point.y) * 0.82,
        }
      : point

    setDragTargetIndex((current) => (current === targetIndex ? current : targetIndex))
    bridge.sendCommand({
      type: 'match/drag',
      leftIndex: activeDrag.leftIndex,
      point: visualPoint,
    })
  }

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeDrag) return

    const targetIndex = findMagneticTarget(
      rightCardRefs.current,
      event.clientX,
      event.clientY,
    )

    releasePointer(boardRef.current, event.pointerId)
    bridge.sendCommand({ type: 'match/drag', leftIndex: activeDrag.leftIndex, point: null })

    if (targetIndex !== null) {
      attemptConnection(activeDrag.leftIndex, targetIndex)
      setSelectedLeft(null)
    }
    setDrag(null)
    setDragTargetIndex(null)
  }

  const cancelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    releasePointer(boardRef.current, event.pointerId)
    if (activeDrag) {
      bridge.sendCommand({ type: 'match/drag', leftIndex: activeDrag.leftIndex, point: null })
    }
    setDrag(null)
    setDragTargetIndex(null)
    setSelectedLeft(null)
  }

  const chooseLeft = (leftIndex: number, moveKeyboardFocus = false) => {
    if (!running || correctLeftIndices.has(leftIndex)) return
    bridge.sendCommand({ type: 'match/tap' })
    if (selectedLeftIndex === leftIndex) {
      setSelectedLeft(null)
      setAnnouncement({
        sessionId,
        message: 'The selection has been cancelled. Select the card on the left.',
      })
      return
    }

    setSelectedLeft({ sessionId, index: leftIndex })
    setAnnouncement({
      sessionId,
      message: `${pairSideLabel(level, leftIndex, 'left')}. Now select the card on the right.`,
    })

    if (moveKeyboardFocus) {
      const nextRightIndex = rightOrder.find((index) => !correctRightIndices.has(index))
      if (nextRightIndex !== undefined) {
        window.requestAnimationFrame(() => rightCardRefs.current[nextRightIndex]?.focus())
      }
    }
  }

  const chooseRight = (rightIndex: number, moveKeyboardFocus = false) => {
    if (!running || selectedLeftIndex === null) return
    const leftIndex = selectedLeftIndex
    const correct = attemptConnection(leftIndex, rightIndex)
    setSelectedLeft(null)

    if (moveKeyboardFocus) {
      const nextLeftIndex = correct
        ? level.pairs.findIndex((_, index) => index !== leftIndex && !correctLeftIndices.has(index))
        : leftIndex
      if (nextLeftIndex >= 0) {
        window.requestAnimationFrame(() => leftCardRefs.current[nextLeftIndex]?.focus())
      }
    }
  }

  const mobileFocusIndex = mobileFocus.sessionId === sessionId ? mobileFocus.index : 0
  const mobileOptionOrder = useMemo(
    () => getMobileOptionOrder(rightOrder, mobileFocusIndex),
    [mobileFocusIndex, rightOrder],
  )
  const mobileConnection = connections.find(
    (connection) => connection.leftIndex === mobileFocusIndex,
  )
  const mobilePair = level.pairs[mobileFocusIndex] ?? level.pairs[0]
  const mobileConfirmed = Boolean(
    mobileConnection && isCorrectConnection(level, mobileConnection),
  )

  useEffect(() => {
    if (!mobileConfirmed || result.complete || !running || !isMobileFocusLayout()) return
    const frame = window.requestAnimationFrame(() => mobileNextRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [mobileConfirmed, result.complete, running])

  const chooseMobileAnswer = (rightIndex: number) => {
    if (!running || mobileConfirmed) return
    attemptConnection(mobileFocusIndex, rightIndex)
  }

  const advanceMobileFocus = () => {
    const nextIndex = level.pairs.findIndex((_, index) => !correctLeftIndices.has(index))
    if (nextIndex >= 0) {
      bridge.sendCommand({ type: 'match/tap' })
      setMobileFocus({ sessionId, index: nextIndex })
      setAnnouncement({
        sessionId,
        message: `Next card: ${pairSideLabel(level, nextIndex, 'left')}. Select an answer.`,
      })
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => mobileSourceRef.current?.focus())
      })
    }
  }

  const coachMessage = result.complete
    ? 'Ready! All connections are in place.'
    : coachReaction?.sessionId === sessionId && coachReaction.kind === 'correct'
      ? 'Exactly! This connection is correct.'
    : activeRejected
      ? 'Almost. Look at the meaning of both cards.'
      : activeDrag
        ? 'Draw the line to the appropriate answer.'
        : selectedLeftIndex !== null
          ? 'Now select the card on the right.'
          : 'You can draw a line or select cards one by one.'
  const activeCoachReaction = coachReaction?.sessionId === sessionId ? coachReaction : null
  const coachState = result.complete
    ? 'complete'
    : activeCoachReaction?.kind
      ?? (activeDrag ? 'drag' : selectedLeftIndex !== null ? 'focus' : 'idle')
  const activeAnnouncement = announcement.sessionId === sessionId
    ? announcement.message
    : 'Select the card on the left, then the matching card on the right.'

  return (
    <section
      className={styles.scene}
      data-theme={themeId}
      data-mode={mode}
      data-complete={result.complete}
      style={{
        '--mp-scene-min-height': `${Math.max(680, 236 + level.pairs.length * 104)}px`,
        '--mp-preview-min-height': `${Math.max(600, 154 + level.pairs.length * 83)}px`,
      } as CSSProperties}
      aria-label="Game: connect pairs"
    >
      <div className={styles.background} aria-hidden="true" />
      <div className={styles.lightA} aria-hidden="true" />
      <div className={styles.lightB} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.mark} aria-hidden="true"><Target size={25} /></span>
          <div className={styles.titleBlock}>
            <h2>Gather couples</h2>
            <span className={styles.divider} aria-hidden="true" />
            <p>{level.prompt}</p>
          </div>
        </div>
        <div
          className={styles.progress}
          aria-label={`${result.correct} from ${result.total} couples collected`}
        >
          <span>{result.correct}</span>
          <i>from</i>
          <strong>{result.total}</strong>
        </div>
      </header>

      <div
        ref={boardRef}
        className={styles.board}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
      >
        <PhaserHost
          bridge={bridge}
          createGame={createMatchPairsRuntime}
          mode={mode}
          paused={!running}
          reducedMotion={reducedMotion}
          className={styles.runtime}
          fallback={<span>Effects are temporarily unavailable - the task remains operational.</span>}
        />

        <div className={`${styles.column} ${styles.leftColumn}`} aria-label="Left cards">
          {level.pairs.map((pair, leftIndex) => {
            const connection = connections.find((item) => item.leftIndex === leftIndex)
            const correct = Boolean(connection && isCorrectConnection(level, connection))
            const wrong = activeRejected?.leftIndex === leftIndex
            const selected = selectedLeftIndex === leftIndex || activeDrag?.leftIndex === leftIndex

            return (
              <button
                ref={(node) => {
                  leftCardRefs.current[leftIndex] = node
                }}
                type="button"
                className={cardClassName({ selected, correct, wrong })}
                key={pair.id}
                disabled={!running || correct}
                aria-label={withCompletionState(
                  contentLabel(pair.left, pair.leftMedia?.alt, pair.visual?.label),
                  correct,
                )}
                aria-pressed={selected}
                onClick={(event) => chooseLeft(leftIndex, event.detail === 0)}
              >
                <PairContent
                  text={pair.left}
                  media={pair.leftMedia ? <LearningImageView image={pair.leftMedia} /> : null}
                  visual={!pair.leftMedia && pair.visual
                    ? <GeometryDiagram spec={pair.visual} compact decorative />
                    : null}
                />
                <span
                  ref={(node) => {
                    leftNodeRefs.current[leftIndex] = node
                  }}
                  className={`${styles.node} ${styles.leftNode}`}
                  aria-hidden="true"
                  onPointerDown={(event) => startDrag(leftIndex, event)}
                />
              </button>
            )
          })}
        </div>

        <div className={`${styles.column} ${styles.rightColumn}`} aria-label="Right cards">
          {rightOrder.map((rightIndex) => {
            const pair = level.pairs[rightIndex]
            const connection = connections.find((item) => item.rightIndex === rightIndex)
            const correct = Boolean(connection && isCorrectConnection(level, connection))
            const wrong = activeRejected?.rightIndex === rightIndex
            const target = activeDrag
              ? dragTargetIndex === rightIndex
              : selectedLeftIndex !== null

            return (
              <button
                ref={(node) => {
                  rightCardRefs.current[rightIndex] = node
                }}
                type="button"
                className={cardClassName({ correct, wrong, target })}
                key={pair.id}
                disabled={!running || correct}
                aria-disabled={!running || correct || selectedLeftIndex === null}
                aria-label={withCompletionState(
                  contentLabel(pair.right, pair.rightMedia?.alt),
                  correct,
                )}
                tabIndex={selectedLeftIndex === null && !activeDrag ? -1 : undefined}
                onClick={(event) => chooseRight(rightIndex, event.detail === 0)}
              >
                <span
                  ref={(node) => {
                    rightNodeRefs.current[rightIndex] = node
                  }}
                  className={`${styles.node} ${styles.rightNode}`}
                  aria-hidden="true"
                />
                <PairContent
                  text={pair.right}
                  media={pair.rightMedia ? <LearningImageView image={pair.rightMedia} /> : null}
                />
                {correct ? (
                  <span className={styles.cardState} aria-hidden="true"><Check size={18} /></span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.mobileFocus} aria-label="Mobile pairing mode">
        <span className={styles.mobileEyebrow}>Find a pair</span>
        <div
          ref={mobileSourceRef}
          className={styles.mobileSource}
          role="group"
          tabIndex={-1}
          aria-label={`Current card: ${pairSideLabel(level, mobileFocusIndex, 'left')}`}
        >
          <PairContent
            text={mobilePair.left}
            media={mobilePair.leftMedia ? <LearningImageView image={mobilePair.leftMedia} /> : null}
            visual={!mobilePair.leftMedia && mobilePair.visual
              ? <GeometryDiagram spec={mobilePair.visual} compact decorative />
              : null}
          />
        </div>
        <div className={styles.mobileOptions}>
          {mobileOptionOrder.map((rightIndex) => {
            const pair = level.pairs[rightIndex]
            const isSelected = mobileConnection?.rightIndex === rightIndex
            const correct = Boolean(isSelected && mobileConfirmed)
            const wrong = activeRejected?.rightIndex === rightIndex

            return (
              <button
                type="button"
                className={cardClassName({ correct, wrong })}
                key={pair.id}
                disabled={!running || mobileConfirmed}
                aria-label={withCompletionState(
                  contentLabel(pair.right, pair.rightMedia?.alt),
                  correct,
                )}
                onClick={() => chooseMobileAnswer(rightIndex)}
              >
                <PairContent
                  text={pair.right}
                  media={pair.rightMedia ? <LearningImageView image={pair.rightMedia} /> : null}
                />
                {correct ? <Check size={18} aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>
        {mobileConfirmed && !result.complete ? (
          <button
            ref={mobileNextRef}
            type="button"
            className={styles.mobileNext}
            disabled={!running}
            onClick={advanceMobileFocus}
          >
            Next couple <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </div>

      <aside
        className={styles.coach}
        data-state={coachState}
        aria-label={`Corgi coach: ${coachMessage}`}
      >
        <span className={styles.coachAura} aria-hidden="true" />
        <Image
          key={`${coachState}-${activeCoachReaction?.sequence ?? 0}`}
          src="/corgi-coach-full-v3.png"
          alt=""
          width={1254}
          height={1254}
          priority
        />
        <span className={styles.coachSignal} aria-hidden="true" />
        <p>{coachMessage}</p>
      </aside>

      {result.complete ? (
        <div ref={completeRef} className={styles.complete} role="status" tabIndex={-1} aria-live="polite">
          <span aria-hidden="true"><Check size={25} /></span>
          <div>
            <strong>All pairs are collected</strong>
            <small>
              <span>{result.total} couples</span>
              <span>{result.attempts} attempts</span>
              <span>{result.accuracy}% accuracy</span>
            </small>
            {resultStatus ? <p>{resultStatus}</p> : null}
          </div>
        </div>
      ) : null}

      {!running && !result.complete ? (
        <div className={styles.paused} role="status">
          <strong>Pause</strong>
          <span>The connections will remain in place.</span>
        </div>
      ) : null}

      <span className={styles.srOnly} role="status" aria-live="polite">
        {activeAnnouncement}
      </span>
    </section>
  )

  function cardClassName({
    selected = false,
    correct = false,
    wrong = false,
    target = false,
  }: {
    selected?: boolean
    correct?: boolean
    wrong?: boolean
    target?: boolean
  }) {
    return [
      styles.card,
      selected ? styles.selected : '',
      correct ? styles.correct : '',
      wrong ? styles.wrong : '',
      target ? styles.target : '',
    ].filter(Boolean).join(' ')
  }
}

function PairContent({
  text,
  media,
  visual,
}: {
  text?: string
  media?: ReactNode
  visual?: ReactNode
}) {
  const hasVisual = Boolean(media || visual)
  return (
    <span className={`${styles.cardContent} ${hasVisual ? styles.hasVisual : ''}`}>
      {media}
      {visual}
      {text ? <span className={styles.cardText}>{text}</span> : null}
    </span>
  )
}

function getRightOrder(length: number) {
  if (length === 4) return [2, 0, 3, 1]
  return Array.from({ length }, (_, index) => (index + 1) % length)
}

function getMobileOptionOrder(rightOrder: number[], correctIndex: number) {
  if (rightOrder.length <= 4) return rightOrder

  const included = new Set([
    correctIndex,
    ...rightOrder.filter((index) => index !== correctIndex).slice(0, 3),
  ])
  return rightOrder.filter((index) => included.has(index))
}

function findMagneticTarget(
  cards: Array<HTMLButtonElement | null>,
  clientX: number,
  clientY: number,
) {
  const magneticPadding = 30
  let nearestIndex: number | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  cards.forEach((card, index) => {
    if (!card || card.disabled) return
    const rect = card.getBoundingClientRect()
    if (
      clientX < rect.left - magneticPadding
      || clientX > rect.right + magneticPadding
      || clientY < rect.top - magneticPadding
      || clientY > rect.bottom + magneticPadding
    ) return

    const distance = Math.hypot(
      clientX - (rect.left + rect.width / 2),
      clientY - (rect.top + rect.height / 2),
    )
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })

  return nearestIndex
}

function isCorrectConnection(level: MatchPairsLevel, connection: MatchConnection) {
  return level.pairs[connection.leftIndex]?.id === level.pairs[connection.rightIndex]?.id
}

function releasePointer(element: HTMLElement | null, pointerId: number) {
  if (element?.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId)
}

function contentLabel(...values: Array<string | undefined>) {
  const labels = values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
  const uniqueLabels = [...new Set(labels)]
  return uniqueLabels.length > 0 ? uniqueLabels.join('. ') : 'Mission card'
}

function pairSideLabel(
  level: MatchPairsLevel,
  index: number,
  side: 'left' | 'right',
) {
  const pair = level.pairs[index]
  if (!pair) return 'Mission card'
  return side === 'left'
    ? contentLabel(pair.left, pair.leftMedia?.alt, pair.visual?.label)
    : contentLabel(pair.right, pair.rightMedia?.alt)
}

function withCompletionState(label: string, correct: boolean) {
  return correct ? `${label}. The couple is assembled.` : label
}

function isMobileFocusLayout() {
  return window.matchMedia('(max-width: 680px)').matches
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}
