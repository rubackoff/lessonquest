'use client'

import Image from 'next/image'
import { Check, Target } from 'lucide-react'
import { animate, LayoutGroup, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { LearningImageView } from '@/components/learning-image'
import type { GroupPlacement, GroupSortGroup, GroupSortItem, GroupSortLevel, GroupSortResult } from '@/lib/group-sort'
import { getVisualThemeId } from '@/lib/visual-themes'

type GroupSortCanvasProps = {
  level: GroupSortLevel
  placements: GroupPlacement[]
  result: GroupSortResult
  running: boolean
  onPlace: (itemId: string, groupId: string) => void
  onReject?: (itemId: string, groupId: string) => void
}

type FeedbackState = {
  itemId: string
  groupId: string
  kind: 'correct' | 'wrong'
}

type TrailPoint = {
  x: number
  y: number
}

type CardDragInfo = {
  point: TrailPoint
  offset: TrailPoint
  velocity: TrailPoint
}

const stationClasses = ['station-mint', 'station-sky', 'station-sand'] as const

export function GroupSortCanvas({
  level,
  placements,
  result,
  running,
  onPlace,
  onReject,
}: GroupSortCanvasProps) {
  const themeId = getVisualThemeId(level)
  const stageRef = useRef<HTMLElement>(null)
  const stationRefs = useRef(new Map<string, HTMLElement>())
  const trailPathRef = useRef<SVGPathElement>(null)
  const trailDotRef = useRef<SVGCircleElement>(null)
  const trailStartRef = useRef<TrailPoint | null>(null)
  const activeGroupRef = useRef<string | null>(null)
  const feedbackTimerRef = useRef<number | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [trailVisible, setTrailVisible] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const levelRevisionKey = useMemo(
    () => [
      level.id,
      ...level.groups.map((group) => `${group.id}:${group.title}`),
      ...level.items.map((item) => `${item.id}:${item.groupId}:${item.label}:${item.media?.src.length ?? 0}`),
    ].join('|'),
    [level],
  )

  const placedIds = useMemo(
    () => new Set(placements.map((placement) => placement.itemId)),
    [placements],
  )
  const unplacedItems = level.items.filter((item) => !placedIds.has(item.id))
  const progress = result.total === 0 ? 0 : (result.correct / result.total) * 100

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = null
    activeGroupRef.current = null
    trailStartRef.current = null
    const frame = window.requestAnimationFrame(() => {
      setActiveGroupId(null)
      setDraggedItemId(null)
      setTrailVisible(false)
      setFeedback(null)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [levelRevisionKey])

  const findGroupAtPoint = (point: TrailPoint) => {
    for (const group of level.groups) {
      const station = stationRefs.current.get(group.id)
      if (!station) continue
      const rect = station.getBoundingClientRect()
      const margin = 10
      if (
        point.x >= rect.left - margin
        && point.x <= rect.right + margin
        && point.y >= rect.top - margin
        && point.y <= rect.bottom + margin
      ) {
        return group.id
      }
    }
    return null
  }

  const updateActiveGroup = (groupId: string | null) => {
    if (activeGroupRef.current === groupId) return
    activeGroupRef.current = groupId
    setActiveGroupId(groupId)
  }

  const updateTrail = (point: TrailPoint) => {
    const stage = stageRef.current
    const start = trailStartRef.current
    const path = trailPathRef.current
    const dot = trailDotRef.current
    if (!stage || !start || !path || !dot) return

    const rect = stage.getBoundingClientRect()
    const endX = point.x - rect.left
    const endY = point.y - rect.top
    const distance = Math.max(46, Math.abs(endY - start.y) * 0.42)
    const controlOneY = start.y - distance
    const controlTwoY = endY + distance * 0.56
    path.setAttribute(
      'd',
      `M ${start.x} ${start.y} C ${start.x} ${controlOneY}, ${endX} ${controlTwoY}, ${endX} ${endY}`,
    )
    dot.setAttribute('cx', String(endX))
    dot.setAttribute('cy', String(endY))
  }

  const startDrag = (
    itemId: string,
    card: HTMLElement,
    info: CardDragInfo,
  ) => {
    if (!running) return
    const stage = stageRef.current
    if (stage && card) {
      const stageRect = stage.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      trailStartRef.current = {
        x: cardRect.left - stageRect.left + cardRect.width / 2,
        y: cardRect.top - stageRect.top + cardRect.height / 2,
      }
      updateTrail(info.point)
    }
    setDraggedItemId(itemId)
    setTrailVisible(!prefersReducedMotion)
  }

  const moveDrag = (info: CardDragInfo) => {
    updateActiveGroup(findGroupAtPoint(info.point))
    if (!prefersReducedMotion) updateTrail(info.point)
  }

  const finishDrag = (
    item: GroupSortItem,
    info: CardDragInfo,
  ) => {
    const groupId = findGroupAtPoint(info.point)
    updateActiveGroup(null)
    setDraggedItemId(null)
    setTrailVisible(false)
    trailStartRef.current = null

    if (!groupId) return false

    const kind = item.groupId === groupId ? 'correct' : 'wrong'
    setFeedback({ itemId: item.id, groupId, kind })
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null)
      feedbackTimerRef.current = null
    }, kind === 'correct' ? 900 : 720)

    if (kind === 'correct') onPlace(item.id, groupId)
    else onReject?.(item.id, groupId)
    return kind === 'correct'
  }

  const coachMessage = feedback?.kind === 'correct'
    ? 'Exactly. The card is in its place.'
    : feedback?.kind === 'wrong'
      ? 'Almost. Try a different collection.'
      : result.complete
        ? 'All collections have been collected.'
        : running
          ? 'Select a card and find a collection for it.'
          : 'The game is paused. The cards will remain in place.'

  return (
    <LayoutGroup id={`group-sort-${level.id}`}>
      <section
        ref={stageRef}
        className={`group-canvas group-sort-stage${trailVisible ? ' is-dragging' : ''}`}
        data-game-theme={themeId}
        aria-label="Game &quot;Put into groups&quot;"
      >
        <header className="group-sort-header">
          <span className="group-sort-mark" aria-hidden="true"><Target size={30} strokeWidth={2.35} /></span>
          <div className="group-sort-heading">
            <h2>Sort into groups</h2>
            <p>Drag the card to the appropriate collection</p>
          </div>
          <div
            className="group-sort-progress"
            style={{ '--group-progress': `${progress}%` } as CSSProperties}
            aria-label={`${result.correct} from ${result.total} cards posted`}
          >
            <strong>{result.correct} from {result.total}</strong>
            <span aria-hidden="true"><i /></span>
          </div>
        </header>

        <div className="group-sort-world" aria-hidden="true">
          <span className="group-sort-ambient ambient-one" />
          <span className="group-sort-ambient ambient-two" />
          <span className="group-sort-architecture architecture-one" />
          <span className="group-sort-architecture architecture-two" />
        </div>

        <div className="group-sort-stations">
          {level.groups.map((group, index) => {
            const groupPlacements = placements.filter((placement) => placement.groupId === group.id)
            const isActive = activeGroupId === group.id
            const groupFeedback = feedback?.groupId === group.id ? feedback.kind : null

            return (
              <motion.section
                ref={(node) => {
                  if (node) stationRefs.current.set(group.id, node)
                  else stationRefs.current.delete(group.id)
                }}
                className={[
                  'group-sort-station',
                  stationClasses[index % stationClasses.length],
                  isActive ? 'is-active' : '',
                  groupFeedback ? `is-${groupFeedback}` : '',
                ].filter(Boolean).join(' ')}
                key={group.id}
                aria-label={`Collection "${group.title}»`}
                animate={groupFeedback === 'wrong'
                  ? { x: [0, -7, 6, -4, 2, 0] }
                  : isActive
                    ? { y: -7, scale: 1.018 }
                    : { x: 0, y: 0, scale: 1 }}
                transition={groupFeedback === 'wrong'
                  ? { duration: prefersReducedMotion ? 0 : 0.42, ease: 'easeOut' }
                  : { type: 'spring', stiffness: 330, damping: 26 }}
              >
                <div className="group-sort-station-arch">
                  <span className="group-sort-station-badge" aria-hidden="true">
                    {groupMark(group.title, index)}
                  </span>
                  <h3>{group.title}</h3>
                  <small>
                    {isActive
                      ? 'Let go here'
                      : groupFeedback === 'correct'
                        ? 'Card accepted'
                        : groupFeedback === 'wrong'
                          ? 'Other collection'
                          : `In the collection: ${groupPlacements.length}`}
                  </small>
                  <StationMotif group={group} index={index} />
                  <div className="group-sort-station-cards">
                    {groupPlacements.map((placement) => {
                      const item = level.items.find((candidate) => candidate.id === placement.itemId)
                      if (!item) return null
                      return (
                        <GroupCard
                          item={item}
                          key={item.id}
                          placed
                          correct={item.groupId === group.id}
                          feedback={feedback?.itemId === item.id ? feedback.kind : null}
                        />
                      )
                    })}
                  </div>
                </div>
                <div className="group-sort-station-platform" aria-hidden="true">
                  <span />
                  <i />
                </div>
                {groupFeedback === 'correct' ? (
                  <span className="group-sort-success-burst" aria-hidden="true">
                    {Array.from({ length: 8 }, (_, particle) => <i key={particle} />)}
                  </span>
                ) : null}
              </motion.section>
            )
          })}
        </div>

        <svg className={`group-sort-trail${trailVisible ? ' is-visible' : ''}`} aria-hidden="true">
          <defs>
            <linearGradient id="group-sort-trail-gradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#0ca6a3" stopOpacity="0.08" />
              <stop offset="0.55" stopColor="#12bdb7" stopOpacity="0.68" />
              <stop offset="1" stopColor="#66ded4" stopOpacity="0.96" />
            </linearGradient>
          </defs>
          <path ref={trailPathRef} />
          <circle ref={trailDotRef} r="7" />
        </svg>

        <aside
          className={`group-sort-coach${feedback ? ` is-${feedback.kind}` : ''}`}
          aria-label={`Corgi Helper: ${coachMessage}`}
        >
          <motion.div
            className="group-sort-coach-image"
            animate={feedback?.kind === 'correct'
              ? { y: [0, -13, 0], rotate: [0, -2, 0] }
              : feedback?.kind === 'wrong'
                ? { rotate: [0, -3, 3, 0] }
                : prefersReducedMotion
                  ? { y: 0 }
                  : { y: [0, -3, 0] }}
            transition={feedback
              ? { duration: 0.52, ease: 'easeOut' }
              : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image src="/corgi-coach-full-v3.png" alt="" width={1254} height={1254} priority />
          </motion.div>
          {feedback ? (
            <motion.p
              key={coachMessage}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
            >
              {coachMessage}
            </motion.p>
          ) : null}
        </aside>

        <div className="group-sort-conveyor" aria-label="Cards for sorting">
          <span className="group-sort-conveyor-sheen" aria-hidden="true" />
          <div className="group-sort-card-bank">
            {unplacedItems.map((item) => (
              <GroupCard
                item={item}
                key={item.id}
                draggable={running}
                muted={Boolean(draggedItemId && draggedItemId !== item.id)}
                feedback={feedback?.itemId === item.id ? feedback.kind : null}
                onDragStart={(card, info) => startDrag(item.id, card, info)}
                onDrag={moveDrag}
                onDragEnd={(info) => finishDrag(item, info)}
              />
            ))}
            {unplacedItems.length === 0 ? (
              <div className="group-sort-bank-complete"><Check size={21} /> All cards are distributed</div>
            ) : null}
          </div>
        </div>

        {!running && !result.complete ? (
          <div className="group-sort-paused" role="status">
            <strong>Pause</strong>
            <span>Progress saved</span>
          </div>
        ) : null}

        {result.complete ? (
          <motion.div
            className="group-sort-complete"
            role="status"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 25 }}
          >
            <span><Check size={25} strokeWidth={2.6} /></span>
            <div>
              <strong>All collections are collected</strong>
              <small>{result.total} cards are in their places</small>
            </div>
          </motion.div>
        ) : null}
      </section>
    </LayoutGroup>
  )
}

function GroupCard({
  item,
  draggable = false,
  placed = false,
  correct = true,
  muted = false,
  feedback,
  onDragStart,
  onDrag,
  onDragEnd,
}: {
  item: GroupSortItem
  draggable?: boolean
  placed?: boolean
  correct?: boolean
  muted?: boolean
  feedback?: FeedbackState['kind'] | null
  onDragStart?: (card: HTMLElement, info: CardDragInfo) => void
  onDrag?: (info: CardDragInfo) => void
  onDragEnd?: (info: CardDragInfo) => boolean
}) {
  const prefersReducedMotion = useReducedMotion()
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const returnXRef = useRef<{ stop: () => void } | null>(null)
  const returnYRef = useRef<{ stop: () => void } | null>(null)
  const pointerSessionRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    baseX: number
    baseY: number
    lastX: number
    lastY: number
    lastTime: number
    velocityX: number
    velocityY: number
  } | null>(null)
  const [pointerDragging, setPointerDragging] = useState(false)

  useEffect(() => () => {
    returnXRef.current?.stop()
    returnYRef.current?.stop()
  }, [])

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    returnXRef.current?.stop()
    returnYRef.current?.stop()
    const now = performance.now()
    pointerSessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: dragX.get(),
      baseY: dragY.get(),
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: now,
      velocityX: 0,
      velocityY: 0,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setPointerDragging(true)
    onDragStart?.(event.currentTarget, {
      point: { x: event.clientX, y: event.clientY },
      offset: { x: dragX.get(), y: dragY.get() },
      velocity: { x: 0, y: 0 },
    })
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const session = pointerSessionRef.current
    if (!session || session.pointerId !== event.pointerId) return
    event.preventDefault()
    const now = performance.now()
    const elapsed = Math.max(1, now - session.lastTime) / 1000
    session.velocityX = (event.clientX - session.lastX) / elapsed
    session.velocityY = (event.clientY - session.lastY) / elapsed
    session.lastX = event.clientX
    session.lastY = event.clientY
    session.lastTime = now
    const offset = {
      x: session.baseX + event.clientX - session.startX,
      y: session.baseY + event.clientY - session.startY,
    }
    dragX.set(offset.x)
    dragY.set(offset.y)
    onDrag?.({
      point: { x: event.clientX, y: event.clientY },
      offset,
      velocity: { x: session.velocityX, y: session.velocityY },
    })
  }

  const finishPointerSession = (
    event: ReactPointerEvent<HTMLButtonElement>,
    cancelled = false,
  ) => {
    const session = pointerSessionRef.current
    if (!session || session.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    pointerSessionRef.current = null
    setPointerDragging(false)
    const info: CardDragInfo = {
      point: cancelled ? { x: -10000, y: -10000 } : { x: event.clientX, y: event.clientY },
      offset: { x: dragX.get(), y: dragY.get() },
      velocity: cancelled ? { x: 0, y: 0 } : { x: session.velocityX, y: session.velocityY },
    }
    const accepted = onDragEnd?.(info) ?? false
    if (accepted) return

    if (prefersReducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dragX.set(0)
      dragY.set(0)
      return
    }

    returnXRef.current = animate(dragX, 0, {
      type: 'spring',
      stiffness: 430,
      damping: 29,
      velocity: info.velocity.x,
    })
    returnYRef.current = animate(dragY, 0, {
      type: 'spring',
      stiffness: 430,
      damping: 29,
      velocity: info.velocity.y,
    })
  }

  const content = (
    <>
      {item.media ? <LearningImageView image={item.media} className="group-sort-card-media" /> : null}
      <span className="group-sort-card-label">{item.label}</span>
      {!placed ? <span className="group-sort-card-handle" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span> : null}
    </>
  )

  const className = [
    'group-sort-card',
    placed ? 'is-placed' : 'is-bank-card',
    placed && correct ? 'is-correct' : '',
    correct ? '' : 'is-incorrect',
    muted ? 'is-muted' : '',
    feedback ? `is-${feedback}` : '',
  ].filter(Boolean).join(' ')

  if (!draggable) {
    return (
      <motion.div
        className={className}
        initial={placed && !prefersReducedMotion ? { opacity: 0, y: 10, scale: 0.92 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 31, mass: 0.72 }}
      >
        {content}
      </motion.div>
    )
  }

  return (
    <motion.button
      type="button"
      className={className}
      style={{ x: dragX, y: dragY, zIndex: pointerDragging ? 12 : 'auto' }}
      animate={pointerDragging && !prefersReducedMotion ? { scale: 1.055, rotate: -1.4 } : { scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 460, damping: 30 }}
      whileHover={{ scale: 1.018 }}
      whileTap={{ scale: 0.99 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => finishPointerSession(event)}
      onPointerCancel={(event) => finishPointerSession(event, true)}
      aria-label={`Drag the card "${item.label}»`}
    >
      {content}
    </motion.button>
  )
}

function StationMotif({ group, index }: { group: GroupSortGroup; index: number }) {
  const normalized = group.title.toLowerCase()

  if (normalized.includes('alg') || normalized.includes('checkmate') || normalized.includes('eq')) {
    return (
      <svg className="group-sort-station-motif" viewBox="0 0 180 118" aria-hidden="true">
        <path d="M22 96V23M22 96h136" />
        <path d="M29 87l34-29 27 13 48-49" />
        <path d="M129 22h9v9" />
        <path d="M54 28v68M88 28v68M122 28v68M22 62h136" opacity=".38" />
      </svg>
    )
  }

  if (normalized.includes('physical') || normalized.includes('strength') || normalized.includes('soon')) {
    return (
      <svg className="group-sort-station-motif" viewBox="0 0 180 118" aria-hidden="true">
        <ellipse cx="90" cy="60" rx="62" ry="23" />
        <ellipse cx="90" cy="60" rx="62" ry="23" transform="rotate(60 90 60)" />
        <ellipse cx="90" cy="60" rx="62" ry="23" transform="rotate(-60 90 60)" />
        <circle cx="90" cy="60" r="7" />
      </svg>
    )
  }

  if (normalized.includes('rus') || normalized.includes('language') || normalized.includes('words')) {
    return (
      <svg className="group-sort-station-motif" viewBox="0 0 180 118" aria-hidden="true">
        <path d="M26 31c23-8 43-2 64 11v61c-21-13-41-19-64-11z" />
        <path d="M154 31c-23-8-43-2-64 11v61c21-13 41-19 64-11z" />
        <path d="M43 52c12-2 23 1 33 6M43 67c12-2 23 1 33 6M137 52c-12-2-23 1-33 6M137 67c-12-2-23 1-33 6" />
      </svg>
    )
  }

  return (
    <svg className="group-sort-station-motif" viewBox="0 0 180 118" aria-hidden="true">
      <circle cx="52" cy="60" r="25" />
      <circle cx="128" cy="60" r="25" />
      <path d="M77 60h26M96 52l8 8-8 8" />
      <text x="90" y="108" textAnchor="middle">{index + 1}</text>
    </svg>
  )
}

function groupMark(title: string, index: number) {
  const normalized = title.toLowerCase()
  if (normalized.includes('alg') || normalized.includes('checkmate') || normalized.includes('eq')) return 'x²'
  if (normalized.includes('physical') || normalized.includes('strength') || normalized.includes('soon')) return 'F'
  if (normalized.includes('rus') || normalized.includes('language') || normalized.includes('words')) return 'Aya'
  return String(index + 1)
}
