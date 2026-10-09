'use client'

import Image from 'next/image'
import { Check, GripVertical, Target, X } from 'lucide-react'
import { animate, LayoutGroup, motion, useMotionValue, useReducedMotion } from 'motion/react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { PhaserHost } from '@/components/game-runtime/phaser-host'
import { useGameRuntimeBridge } from '@/components/game-runtime/use-game-runtime-bridge'
import { LearningImageView } from '@/components/learning-image'
import type { RuntimePoint } from '@/lib/game-runtime/contracts'
import type {
  GroupPlacement,
  GroupSortGroup,
  GroupSortItem,
  GroupSortLevel,
  GroupSortResult,
} from '@/lib/group-sort'
import { getVisualThemeId } from '@/lib/visual-themes'
import {
  createGroupSortRuntime,
  GroupSortVisualBridge,
  type GroupSortRuntimeInteraction,
  type GroupSortRuntimeLayout,
} from './group-sort-runtime'
import styles from './group-sort.module.css'

export type GroupSortGameProps = {
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
  sequence: number
}

type CardDragInfo = {
  point: RuntimePoint
  velocity: RuntimePoint
}

const emptyLayout: GroupSortRuntimeLayout = {
  width: 1,
  height: 1,
  stations: [],
  cards: [],
  conveyor: null,
  mascot: null,
}

const noInteraction: GroupSortRuntimeInteraction = {
  itemId: null,
  origin: null,
  point: null,
  visualCenter: null,
  activeGroupId: null,
  dragging: false,
}

export function GroupSortGame({
  level,
  placements,
  result,
  running,
  onPlace,
  onReject,
}: GroupSortGameProps) {
  const lifecycleBridge = useGameRuntimeBridge()
  const [visualBridge] = useState(
    () => new GroupSortVisualBridge(),
  )
  const createRuntime = useMemo(
    () => createGroupSortRuntime(visualBridge),
    [visualBridge],
  )
  const reducedMotion = Boolean(useReducedMotion())
  const themeId = getVisualThemeId(level)
  const worldRef = useRef<HTMLDivElement>(null)
  const stationScrollerRef = useRef<HTMLDivElement>(null)
  const cardScrollerRef = useRef<HTMLDivElement>(null)
  const conveyorRef = useRef<HTMLDivElement>(null)
  const coachRef = useRef<HTMLElement>(null)
  const stationRefs = useRef(new Map<string, HTMLElement>())
  const cardRefs = useRef(new Map<string, HTMLElement>())
  const feedbackTimerRef = useRef<number | null>(null)
  const feedbackSequenceRef = useRef(0)
  const [layout, setLayout] = useState<GroupSortRuntimeLayout>(emptyLayout)
  const [runtimeRevision, setRuntimeRevision] = useState(0)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [announcement, setAnnouncement] = useState('Select a card and a suitable collection.')

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
  const selectedItem = level.items.find((item) => item.id === selectedItemId) ?? null
  const progress = result.total === 0 ? 100 : (result.correct / result.total) * 100

  useEffect(() => {
    const unsubscribe = lifecycleBridge.subscribeEvents((event) => {
      if (event.type === 'runtime/ready') setRuntimeRevision((value) => value + 1)
    })
    return () => {
      unsubscribe()
    }
  }, [lifecycleBridge])

  useEffect(() => {
    return () => {
      visualBridge.clear()
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
    }
  }, [visualBridge])

  useEffect(() => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = null
    const frame = window.requestAnimationFrame(() => {
      setDraggedItemId(null)
      setSelectedItemId(null)
      setActiveGroupId(null)
      setFeedback(null)
      setAnnouncement('Select a card and a suitable collection.')
      visualBridge.sendCommand({ type: 'group/reset' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [levelRevisionKey, visualBridge])

  useEffect(() => {
    const world = worldRef.current
    if (!world) return

    const updateLayout = () => {
      const worldRect = world.getBoundingClientRect()
      if (!worldRect.width || !worldRect.height) return

      const relativeRect = (element: HTMLElement | null) => {
        if (!element) return null
        const rect = element.getBoundingClientRect()
        return {
          x: rect.left - worldRect.left,
          y: rect.top - worldRect.top,
          width: rect.width,
          height: rect.height,
        }
      }

      const nextLayout: GroupSortRuntimeLayout = {
        width: worldRect.width,
        height: worldRect.height,
        stations: level.groups.flatMap((group, index) => {
          const bounds = relativeRect(stationRefs.current.get(group.id) ?? null)
          if (!bounds) return []
          return [{
            id: group.id,
            index,
            bounds,
            placedCount: placements.filter((placement) => placement.groupId === group.id).length,
          }]
        }),
        cards: level.items.flatMap((item) => {
          const bounds = relativeRect(cardRefs.current.get(item.id) ?? null)
          if (!bounds) return []
          return [{
            id: item.id,
            bounds,
            placed: placedIds.has(item.id),
          }]
        }),
        conveyor: relativeRect(conveyorRef.current),
        mascot: relativeRect(coachRef.current),
      }
      setLayout(nextLayout)
    }

    const frame = window.requestAnimationFrame(updateLayout)
    const observer = new ResizeObserver(updateLayout)
    observer.observe(world)
    if (conveyorRef.current) observer.observe(conveyorRef.current)
    if (coachRef.current) observer.observe(coachRef.current)
    for (const station of stationRefs.current.values()) observer.observe(station)
    for (const card of cardRefs.current.values()) observer.observe(card)
    const stationScroller = stationScrollerRef.current
    const cardScroller = cardScrollerRef.current
    stationScroller?.addEventListener('scroll', updateLayout, { passive: true })
    cardScroller?.addEventListener('scroll', updateLayout, { passive: true })
    void document.fonts?.ready.then(updateLayout)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      stationScroller?.removeEventListener('scroll', updateLayout)
      cardScroller?.removeEventListener('scroll', updateLayout)
    }
  }, [level.groups, level.items, placements, placedIds, levelRevisionKey])

  useEffect(() => {
    visualBridge.sendCommand({ type: 'group/theme', themeId })
    visualBridge.sendCommand({ type: 'group/layout', layout })
  }, [layout, runtimeRevision, themeId, visualBridge])

  useEffect(() => {
    if (result.complete) visualBridge.sendCommand({ type: 'group/complete' })
  }, [result.complete, runtimeRevision, visualBridge])

  useEffect(() => {
    if (running) return
    const frame = window.requestAnimationFrame(() => {
      setDraggedItemId(null)
      setSelectedItemId(null)
      setActiveGroupId(null)
      visualBridge.sendCommand({ type: 'group/interaction', interaction: noInteraction })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [running, visualBridge])

  useEffect(() => {
    if (!selectedItemId || !placedIds.has(selectedItemId)) return
    const frame = window.requestAnimationFrame(() => setSelectedItemId(null))
    return () => window.cancelAnimationFrame(frame)
  }, [placedIds, selectedItemId])

  const pointInWorld = (point: RuntimePoint): RuntimePoint => {
    const rect = worldRef.current?.getBoundingClientRect()
    return rect
      ? { x: point.x - rect.left, y: point.y - rect.top }
      : { x: point.x, y: point.y }
  }

  const cardCenter = (itemId: string): RuntimePoint => {
    const worldRect = worldRef.current?.getBoundingClientRect()
    const cardRect = cardRefs.current.get(itemId)?.getBoundingClientRect()
    if (!worldRect || !cardRect) return { x: layout.width * 0.5, y: layout.height * 0.85 }
    return {
      x: cardRect.left - worldRect.left + cardRect.width * 0.5,
      y: cardRect.top - worldRect.top + cardRect.height * 0.5,
    }
  }

  const findGroupAtPoint = (point: RuntimePoint) => {
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
      ) return group.id
    }
    return null
  }

  const setTarget = (groupId: string | null, item = selectedItem) => {
    setActiveGroupId(groupId)
    visualBridge.sendCommand({
      type: 'group/interaction',
      interaction: {
        itemId: item?.id ?? null,
        origin: item ? cardCenter(item.id) : null,
        point: null,
        visualCenter: item ? cardCenter(item.id) : null,
        activeGroupId: groupId,
        dragging: false,
      },
    })
  }

  const showFeedback = (
    item: GroupSortItem,
    groupId: string,
    from: RuntimePoint,
    origin: RuntimePoint,
  ) => {
    const kind = item.groupId === groupId ? 'correct' : 'wrong'
    feedbackSequenceRef.current += 1
    setFeedback({
      itemId: item.id,
      groupId,
      kind,
      sequence: feedbackSequenceRef.current,
    })
    setSelectedItemId(null)
    setActiveGroupId(null)
    setAnnouncement(
      kind === 'correct'
        ? `True: "${item.label}» added to the collection «${groupTitle(level.groups, groupId)}».`
        : `Not suitable yet: "${item.label}" does not belong to the collection "${groupTitle(level.groups, groupId)}».`,
    )
    visualBridge.sendCommand({
      type: 'group/feedback',
      kind,
      groupId,
      from,
      origin,
    })
    visualBridge.sendCommand({ type: 'group/interaction', interaction: noInteraction })

    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null)
      feedbackTimerRef.current = null
    }, kind === 'correct' ? 900 : 720)

    if (kind === 'correct') onPlace(item.id, groupId)
    else onReject?.(item.id, groupId)
    return kind === 'correct'
  }

  const startDrag = (item: GroupSortItem, point: RuntimePoint) => {
    if (!running) return
    const origin = cardCenter(item.id)
    const localPoint = pointInWorld(point)
    setDraggedItemId(item.id)
    setSelectedItemId(item.id)
    setActiveGroupId(null)
    visualBridge.sendCommand({
      type: 'group/interaction',
      interaction: {
        itemId: item.id,
        origin,
        point: localPoint,
        visualCenter: origin,
        activeGroupId: null,
        dragging: true,
      },
    })
  }

  const moveDrag = (item: GroupSortItem, point: RuntimePoint) => {
    const groupId = findGroupAtPoint(point)
    const origin = cardCenter(item.id)
    if (groupId !== activeGroupId) setActiveGroupId(groupId)
    visualBridge.sendCommand({
      type: 'group/interaction',
      interaction: {
        itemId: item.id,
        origin,
        point: pointInWorld(point),
        visualCenter: cardCenter(item.id),
        activeGroupId: groupId,
        dragging: true,
      },
    })
  }

  const finishDrag = (item: GroupSortItem, info: CardDragInfo) => {
    const groupId = findGroupAtPoint(info.point)
    const origin = cardCenter(item.id)
    const from = pointInWorld(info.point)
    setDraggedItemId(null)
    setActiveGroupId(null)
    visualBridge.sendCommand({ type: 'group/interaction', interaction: noInteraction })
    if (!groupId) {
      setAnnouncement(`Card "${item.label}"returned to the conveyor belt.`)
      return false
    }
    return showFeedback(item, groupId, from, origin)
  }

  const chooseCard = (item: GroupSortItem, keyboard: boolean) => {
    if (!running) return
    if (selectedItemId === item.id && keyboard) {
      setSelectedItemId(null)
      setTarget(null, null)
      setAnnouncement('The selection has been cancelled.')
      return
    }
    setSelectedItemId(item.id)
    setAnnouncement(`Selected: "${item.label}" Now select a collection.`)
    visualBridge.sendCommand({
      type: 'group/interaction',
      interaction: {
        itemId: item.id,
        origin: cardCenter(item.id),
        point: null,
        visualCenter: cardCenter(item.id),
        activeGroupId: null,
        dragging: false,
      },
    })
    if (keyboard) {
      window.requestAnimationFrame(() => {
        const firstGroup = level.groups[0]
        if (firstGroup) stationRefs.current.get(firstGroup.id)?.querySelector<HTMLButtonElement>('button')?.focus()
      })
    }
  }

  const chooseGroup = (groupId: string) => {
    if (!running || !selectedItem) return
    const origin = cardCenter(selectedItem.id)
    showFeedback(selectedItem, groupId, origin, origin)
  }

  const coachMessage = feedback?.kind === 'correct'
    ? 'Exactly! Card in your collection.'
    : feedback?.kind === 'wrong'
      ? 'Almost. Try a nearby station.'
      : result.complete
        ? 'Done - all collections are collected.'
        : selectedItem
          ? 'Now select the appropriate station.'
          : running
            ? 'Drag the card or select it with the Enter key.'
            : 'The game is paused. Progress saved.'

  return (
    <LayoutGroup id={`group-sort-${level.id}`}>
      <section
        className={styles.scene}
        data-game-shell="group-sort"
        data-theme={themeId}
        data-dragging={Boolean(draggedItemId)}
        data-complete={result.complete}
        style={{
          '--gs-progress': `${progress}%`,
          '--gs-station-count': Math.max(1, level.groups.length),
        } as CSSProperties}
        aria-label="Game: arrange the cards into groups"
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return
          setSelectedItemId(null)
          setActiveGroupId(null)
          visualBridge.sendCommand({ type: 'group/interaction', interaction: noInteraction })
          setAnnouncement('The selection has been cancelled.')
        }}
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.mark} aria-hidden="true"><Target size={27} strokeWidth={2.3} /></span>
            <div className={styles.titleBlock}>
              <h2>Sort into groups</h2>
              <p>{level.prompt || 'Drag the card to the appropriate collection'}</p>
            </div>
          </div>
          <div className={styles.progress} aria-label={`${result.correct} from ${result.total} cards posted`}>
            <strong>{result.correct} from {result.total}</strong>
            <span aria-hidden="true"><i /></span>
          </div>
        </header>

        <div ref={worldRef} className={styles.world}>
          <div className={styles.roomGlow} aria-hidden="true" />
          <PhaserHost
            bridge={lifecycleBridge}
            createGame={createRuntime}
            paused={!running}
            reducedMotion={reducedMotion}
            interactive={false}
            className={styles.runtime}
            fallback={<span>Effects are temporarily unavailable - sorting remains operational.</span>}
          />

          <div ref={stationScrollerRef} className={styles.stationScroller}>
            <div className={styles.stationRail}>
              {level.groups.map((group, index) => {
                const groupPlacements = placements.filter((placement) => placement.groupId === group.id)
                const groupFeedback = feedback?.groupId === group.id ? feedback.kind : null
                const isActive = activeGroupId === group.id
                return (
                  <section
                    ref={(node) => {
                      if (node) stationRefs.current.set(group.id, node)
                      else stationRefs.current.delete(group.id)
                    }}
                    className={styles.station}
                    data-tone={index % 5}
                    data-active={isActive}
                    data-feedback={groupFeedback ?? undefined}
                    key={group.id}
                    aria-label={`Collection "${group.title}»`}
                  >
                    <button
                      type="button"
                      className={styles.stationTarget}
                      disabled={!running || !selectedItem}
                      aria-label={selectedItem
                        ? `Place "${selectedItem.label}» to collection «${group.title}»`
                        : `Collection "${group.title}»`}
                      onFocus={() => selectedItem && setTarget(group.id)}
                      onBlur={() => activeGroupId === group.id && setTarget(null)}
                      onPointerEnter={() => selectedItem && !draggedItemId && setTarget(group.id)}
                      onPointerLeave={() => selectedItem && !draggedItemId && setTarget(null)}
                      onClick={() => chooseGroup(group.id)}
                    />
                    <div className={styles.stationContent} aria-hidden="true">
                      <span className={styles.stationBadge}>{groupMark(group, index)}</span>
                      <h3>{group.title}</h3>
                      <span className={styles.stationStatus}>
                        {isActive
                          ? 'Let go here'
                          : groupFeedback === 'correct'
                            ? 'Card accepted'
                            : groupFeedback === 'wrong'
                              ? 'Other collection'
                              : `In the collection: ${groupPlacements.length}`}
                      </span>
                      <span className={styles.placedCards}>
                        {groupPlacements.map((placement) => {
                          const item = level.items.find((candidate) => candidate.id === placement.itemId)
                          if (!item) return null
                          return (
                            <GroupCard
                              item={item}
                              layoutKey={`${level.id}:${item.id}`}
                              key={item.id}
                              placed
                              correct={item.groupId === group.id}
                              registerNode={(node) => {
                                if (node) cardRefs.current.set(item.id, node)
                                else cardRefs.current.delete(item.id)
                              }}
                            />
                          )
                        })}
                      </span>
                    </div>
                  </section>
                )
              })}
            </div>
          </div>

          <aside ref={coachRef} className={styles.coach} data-state={feedback?.kind ?? (result.complete ? 'complete' : 'idle')} aria-label={`Corgi Helper: ${coachMessage}`}>
            <span className={styles.coachAura} aria-hidden="true" />
            <Image
              key={`${feedback?.kind ?? 'idle'}:${feedback?.sequence ?? 0}`}
              src="/game-assets/common/mascot/corgi-coach.png"
              alt=""
              width={1254}
              height={1254}
              priority
            />
            {feedback || result.complete || selectedItem ? <p>{coachMessage}</p> : null}
          </aside>

          <div ref={conveyorRef} className={styles.conveyor} aria-label="Cards for sorting">
            <div ref={cardScrollerRef} className={styles.cardScroller}>
              <div className={styles.cardRail}>
                {unplacedItems.map((item, index) => (
                  <GroupCard
                    registerNode={(node) => {
                      if (node) cardRefs.current.set(item.id, node)
                      else cardRefs.current.delete(item.id)
                    }}
                    item={item}
                    layoutKey={`${level.id}:${item.id}`}
                    key={item.id}
                    draggable={running}
                    selected={selectedItemId === item.id}
                    muted={Boolean(draggedItemId && draggedItemId !== item.id)}
                    delay={index * 0.048}
                    feedback={feedback?.itemId === item.id ? feedback.kind : null}
                    onChoose={(keyboard) => chooseCard(item, keyboard)}
                    onDragStart={(info) => startDrag(item, info.point)}
                    onDrag={(info) => moveDrag(item, info.point)}
                    onDragEnd={(info) => finishDrag(item, info)}
                  />
                ))}
                {unplacedItems.length === 0 ? (
                  <div className={styles.bankComplete}><Check size={20} /> All cards are distributed</div>
                ) : null}
              </div>
            </div>
          </div>

          <p className={styles.liveRegion} role="status" aria-live="polite">{announcement}</p>

          {!running && !result.complete ? (
            <div className={styles.paused} role="status">
              <strong>Pause</strong>
              <span>Progress saved</span>
            </div>
          ) : null}

          {result.complete ? (
            <motion.div
              className={styles.complete}
              role="status"
              tabIndex={-1}
              initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 330, damping: 27 }}
            >
              <span aria-hidden="true"><Check size={26} strokeWidth={2.7} /></span>
              <div>
                <strong>All collections are collected</strong>
                <small>{result.total} cards · accuracy {result.accuracy}%</small>
              </div>
            </motion.div>
          ) : null}
        </div>
      </section>
    </LayoutGroup>
  )
}

function GroupCard({
  item,
  layoutKey,
  draggable = false,
  placed = false,
  correct = true,
  selected = false,
  muted = false,
  feedback,
  delay = 0,
  onChoose,
  onDragStart,
  onDrag,
  onDragEnd,
  registerNode,
}: {
  item: GroupSortItem
  layoutKey: string
  draggable?: boolean
  placed?: boolean
  correct?: boolean
  selected?: boolean
  muted?: boolean
  feedback?: FeedbackState['kind'] | null
  delay?: number
  onChoose?: (keyboard: boolean) => void
  onDragStart?: (info: CardDragInfo) => void
  onDrag?: (info: CardDragInfo) => void
  onDragEnd?: (info: CardDragInfo) => boolean
  registerNode?: (node: HTMLElement | null) => void
}) {
    const reducedMotion = Boolean(useReducedMotion())
    const dragX = useMotionValue(0)
    const dragY = useMotionValue(0)
    const returnXRef = useRef<{ stop: () => void } | null>(null)
    const returnYRef = useRef<{ stop: () => void } | null>(null)
    const suppressClickRef = useRef(false)
    const pointerSessionRef = useRef<{
      pointerId: number
      startX: number
      startY: number
      lastX: number
      lastY: number
      lastTime: number
      velocityX: number
      velocityY: number
      moved: boolean
    } | null>(null)
    const [pointerDragging, setPointerDragging] = useState(false)

    useEffect(() => () => {
      returnXRef.current?.stop()
      returnYRef.current?.stop()
    }, [])

    const content = (
      <>
        {item.media ? <LearningImageView image={item.media} className={styles.cardMedia} /> : null}
        <span className={styles.cardLabel}>{item.label}</span>
        {!placed ? <GripVertical className={styles.cardHandle} size={18} aria-hidden="true" /> : null}
        {placed ? (
          <span className={correct ? styles.placedCheck : styles.placedWrong} aria-hidden="true">
            {correct ? <Check size={14} /> : <X size={14} />}
          </span>
        ) : null}
      </>
    )

    if (placed) {
      return (
        <motion.span
          ref={registerNode}
          layoutId={`group-card:${layoutKey}`}
          className={`${styles.card} ${styles.placedCard}`}
          transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32, mass: 0.72 }}
        >
          {content}
        </motion.span>
      )
    }

    const finishPointer = (event: ReactPointerEvent<HTMLButtonElement>, cancelled = false) => {
      const session = pointerSessionRef.current
      if (!session || session.pointerId !== event.pointerId) return
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      pointerSessionRef.current = null
      setPointerDragging(false)
      const info: CardDragInfo = {
        point: cancelled ? { x: -10000, y: -10000 } : { x: event.clientX, y: event.clientY },
        velocity: cancelled ? { x: 0, y: 0 } : { x: session.velocityX, y: session.velocityY },
      }
      const accepted = onDragEnd?.(info) ?? false
      suppressClickRef.current = session.moved || accepted
      if (accepted) return

      if (reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

    return (
      <motion.button
        ref={registerNode}
        layout
        layoutId={`group-card:${layoutKey}`}
        type="button"
        className={styles.card}
        data-selected={selected}
        data-muted={muted}
        data-feedback={feedback ?? undefined}
        disabled={!draggable}
        aria-pressed={selected}
        aria-label={`Drag the card "${item.label}»`}
        initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
        animate={pointerDragging && !reducedMotion
          ? { opacity: 1, scale: 1.045, rotate: Math.max(-1.8, Math.min(1.8, dragX.get() * 0.012)) }
          : { opacity: 1, scale: 1, rotate: 0 }}
        transition={{
          default: { type: 'spring', stiffness: 460, damping: 31 },
          opacity: { duration: 0.22, delay },
          layout: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 33 },
        }}
        style={{ x: dragX, y: dragY, zIndex: pointerDragging ? 20 : undefined }}
        whileHover={draggable && !reducedMotion ? { y: -3, scale: 1.018 } : undefined}
        whileTap={draggable && !reducedMotion ? { scale: 0.985 } : undefined}
        onClick={(event) => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false
            return
          }
          onChoose?.(event.detail === 0)
        }}
        onPointerDown={(event) => {
          if (!draggable || event.button !== 0) return
          event.preventDefault()
          returnXRef.current?.stop()
          returnYRef.current?.stop()
          const now = performance.now()
          pointerSessionRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            lastX: event.clientX,
            lastY: event.clientY,
            lastTime: now,
            velocityX: 0,
            velocityY: 0,
            moved: false,
          }
          event.currentTarget.setPointerCapture(event.pointerId)
          setPointerDragging(true)
          onDragStart?.({ point: { x: event.clientX, y: event.clientY }, velocity: { x: 0, y: 0 } })
        }}
        onPointerMove={(event) => {
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
          const offsetX = event.clientX - session.startX
          const offsetY = event.clientY - session.startY
          if (Math.hypot(offsetX, offsetY) > 6) session.moved = true
          dragX.set(offsetX)
          dragY.set(offsetY)
          onDrag?.({
            point: { x: event.clientX, y: event.clientY },
            velocity: { x: session.velocityX, y: session.velocityY },
          })
        }}
        onPointerUp={(event) => finishPointer(event)}
        onPointerCancel={(event) => finishPointer(event, true)}
      >
        {content}
      </motion.button>
    )
}

function groupTitle(groups: GroupSortGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId)?.title ?? groupId
}

function groupMark(group: GroupSortGroup, index: number) {
  const normalized = group.title.toLowerCase()
  if (normalized.includes('alg') || normalized.includes('checkmate') || normalized.includes('eq')) return 'x²'
  if (normalized.includes('physical') || normalized.includes('strength') || normalized.includes('soon')) return 'F'
  if (normalized.includes('rus') || normalized.includes('language') || normalized.includes('words')) return 'Aya'
  return String(index + 1)
}
