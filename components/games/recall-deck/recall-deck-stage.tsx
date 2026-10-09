'use client'

import Image from 'next/image'
import { Check, Eye, RotateCcw, Sparkles } from 'lucide-react'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'motion/react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { PhaserHost } from '@/components/game-runtime/phaser-host'
import { useGameRuntimeBridge } from '@/components/game-runtime/use-game-runtime-bridge'
import { LearningImageView } from '@/components/learning-image'
import { RuntimeBridge } from '@/lib/game-runtime/bridge'
import {
  getRecallDeckResult,
  type RecallDeckLevel,
  type RecallRating,
} from '@/lib/recall-deck'
import { getVisualThemeId } from '@/lib/visual-themes'
import {
  createRecallDeckRuntime,
  type RecallRuntimeLayout,
  type RecallVisualCommand,
} from './recall-deck-runtime'
import styles from './recall-deck.module.css'

export type RecallDeckStageProps = {
  level: RecallDeckLevel
  ratings: Array<RecallRating | null>
  cardIndex: number
  revealed: boolean
  running: boolean
  onReveal: () => void
  onRate: (rating: RecallRating) => void
}

type ExitState = {
  cardKey: string
  rating: RecallRating
  ratingsSnapshot: Array<RecallRating | null>
}

const emptyLayout: RecallRuntimeLayout = {
  width: 1,
  height: 1,
  card: null,
  deck: null,
  reviewTray: null,
  rememberedTray: null,
}

export function RecallDeckStage({
  level,
  ratings,
  cardIndex,
  revealed,
  running,
  onReveal,
  onRate,
}: RecallDeckStageProps) {
  const lifecycleBridge = useGameRuntimeBridge()
  const [visualBridge] = useState(
    () => new RuntimeBridge<RecallVisualCommand, never>(),
  )
  const createRuntime = useMemo(
    () => createRecallDeckRuntime(visualBridge),
    [visualBridge],
  )
  const worldRef = useRef<HTMLDivElement>(null)
  const deckRef = useRef<HTMLDivElement>(null)
  const cardFrameRef = useRef<HTMLDivElement>(null)
  const reviewTrayRef = useRef<HTMLButtonElement>(null)
  const rememberedTrayRef = useRef<HTMLButtonElement>(null)
  const activeExitRef = useRef<ExitState | null>(null)
  const exitTimerRef = useRef<number | null>(null)
  const dragAnimationRef = useRef<{ stop: () => void } | null>(null)
  const revealSignalRef = useRef<string | null>(null)
  const completeSignalRef = useRef<string | null>(null)
  const suppressClickRef = useRef(false)
  const [layout, setLayout] = useState<RecallRuntimeLayout>(emptyLayout)
  const [runtimeRevision, setRuntimeRevision] = useState(0)
  const [exitState, setExitState] = useState<ExitState | null>(null)
  const [announcement, setAnnouncement] = useState('First remember the answer, then open the card.')
  const reducedMotion = Boolean(useReducedMotion())
  const dragX = useMotionValue(0)
  const dragY = useTransform(dragX, [-560, 0, 560], [-18, 0, -22])
  const dragRotation = useTransform(dragX, [-180, 0, 180], [-9, 0, 9])
  const reviewOpacity = useTransform(dragX, [-130, -25, 0], [1, 0.15, 0])
  const rememberedOpacity = useTransform(dragX, [0, 25, 130], [0, 0.15, 1])
  const reviewScale = useTransform(dragX, [-160, -40, 0], [1.055, 1.01, 1])
  const rememberedScale = useTransform(dragX, [0, 40, 160], [1, 1.01, 1.055])
  const result = getRecallDeckResult(level, ratings)
  const safeIndex = Math.min(Math.max(cardIndex, 0), Math.max(0, level.cards.length - 1))
  const card = level.cards[safeIndex]
  const cardKey = `${level.id}:${card?.id ?? 'empty'}`
  const themeId = getVisualThemeId(level)
  const exitRating = exitState?.cardKey === cardKey && exitState.ratingsSnapshot === ratings
    ? exitState.rating
    : null

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
      dragAnimationRef.current?.stop()
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current)
    }
  }, [visualBridge])

  useEffect(() => {
    activeExitRef.current = null
    dragAnimationRef.current?.stop()
    dragAnimationRef.current = null
    if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current)
    exitTimerRef.current = null
    dragX.set(0)
    suppressClickRef.current = false
    revealSignalRef.current = null
    visualBridge.sendCommand({ type: 'recall/reset' })
  }, [cardKey, dragX, visualBridge])

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
      setLayout({
        width: worldRect.width,
        height: worldRect.height,
        card: relativeRect(cardFrameRef.current),
        deck: relativeRect(deckRef.current),
        reviewTray: relativeRect(reviewTrayRef.current),
        rememberedTray: relativeRect(rememberedTrayRef.current),
      })
    }

    const frame = window.requestAnimationFrame(updateLayout)
    const observer = new ResizeObserver(updateLayout)
    observer.observe(world)
    for (const element of [
      deckRef.current,
      cardFrameRef.current,
      reviewTrayRef.current,
      rememberedTrayRef.current,
    ]) {
      if (element) observer.observe(element)
    }
    void document.fonts?.ready.then(updateLayout)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [cardKey, result.complete])

  useEffect(() => {
    visualBridge.sendCommand({ type: 'recall/theme', themeId })
    visualBridge.sendCommand({ type: 'recall/layout', layout })
    visualBridge.sendCommand({
      type: 'recall/state',
      cardKey,
      revealed,
      remaining: Math.max(0, result.total - result.rated),
    })
  }, [cardKey, layout, result.rated, result.total, revealed, runtimeRevision, themeId, visualBridge])

  useEffect(() => {
    if (!revealed) {
      revealSignalRef.current = null
      return
    }
    if (revealSignalRef.current === cardKey) return
    revealSignalRef.current = cardKey
    visualBridge.sendCommand({ type: 'recall/reveal' })
  }, [cardKey, revealed, visualBridge])

  useEffect(() => {
    if (!result.complete) {
      completeSignalRef.current = null
      return
    }
    const completionKey = `${level.id}:${runtimeRevision}`
    if (completeSignalRef.current === completionKey) return
    completeSignalRef.current = completionKey
    visualBridge.sendCommand({ type: 'recall/complete' })
  }, [level.id, result.complete, runtimeRevision, visualBridge])

  if (!card) {
    return (
      <div className={`${styles.scene} ${styles.empty}`} role="status">
        There are no cards in this deck yet.
      </div>
    )
  }

  const finishExit = (state: ExitState) => {
    const active = activeExitRef.current
    if (
      !active
      || active.cardKey !== state.cardKey
      || active.rating !== state.rating
      || active.ratingsSnapshot !== state.ratingsSnapshot
    ) return

    activeExitRef.current = null
    if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current)
    exitTimerRef.current = null
    setExitState(null)
    onRate(state.rating)
  }

  const revealCard = () => {
    if (!running || revealed || exitRating) return
    revealSignalRef.current = cardKey
    visualBridge.sendCommand({ type: 'recall/reveal' })
    setAnnouncement(`The answer is open: ${card.back}. Now evaluate whether you managed to remember.`)
    onReveal()
  }

  const rateCard = (rating: RecallRating) => {
    const active = activeExitRef.current
    if (
      !running
      || !revealed
      || exitRating
      || (active?.cardKey === cardKey && active.ratingsSnapshot === ratings)
    ) return

    visualBridge.sendCommand({ type: 'recall/rate', rating })
    setAnnouncement(
      rating === 'remembered'
        ? `Card "${card.front}» marked as friend.`
        : `Card "${card.front}"added for repeat.`,
    )

    if (reducedMotion) {
      onRate(rating)
      return
    }

    const nextExit = { cardKey, rating, ratingsSnapshot: ratings }
    activeExitRef.current = nextExit
    setExitState(nextExit)
    if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current)
    exitTimerRef.current = window.setTimeout(() => finishExit(nextExit), 560)
  }

  const finishSwipe = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    suppressClickRef.current = true
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 0)

    const threshold = Math.max(56, Math.min(108, (cardFrameRef.current?.clientWidth ?? 400) * 0.18))
    if (Math.abs(info.offset.x) >= threshold) {
      rateCard(info.offset.x > 0 ? 'remembered' : 'review')
      return
    }

    visualBridge.sendCommand({
      type: 'recall/drag',
      offsetX: null,
      velocityX: info.velocity.x,
    })
    dragAnimationRef.current?.stop()
    dragAnimationRef.current = animate(dragX, 0, {
      type: 'spring',
      stiffness: 420,
      damping: 30,
      velocity: info.velocity.x,
    })
  }

  const coachMessage = result.complete
    ? 'Ready. Revision cards are marked.'
    : revealed
      ? 'Swipe the card into the appropriate tray.'
      : 'First formulate your answer, then open the card.'

  return (
    <section
      className={styles.scene}
      data-game-shell="recall-deck"
      data-theme={themeId}
      data-revealed={revealed}
      data-complete={result.complete}
      aria-label="Game &quot;Memory Station&quot;"
      onKeyDown={(event) => {
        if (!revealed || !running || exitRating) return
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          rateCard('review')
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          rateCard('remembered')
        }
      }}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.mark} aria-hidden="true"><Sparkles size={24} /></span>
          <div>
            <h2>Recall Station</h2>
            <p>{level.subject}</p>
          </div>
        </div>
        <div className={styles.route} aria-label={`Card ${safeIndex + 1} from ${level.cards.length}`}>
          {level.cards.map((item, index) => (
            <span
              data-current={index === safeIndex}
              data-rating={ratings[index] ?? undefined}
              key={item.id}
            >
              {ratings[index] === 'remembered'
                ? <Check size={12} />
                : ratings[index] === 'review'
                  ? <RotateCcw size={11} />
                  : <i aria-hidden="true" />}
            </span>
          ))}
        </div>
        <div
          className={styles.progress}
          style={{ '--recall-progress': `${(result.rated / Math.max(1, result.total)) * 100}%` } as CSSProperties}
          aria-label={`${result.rated} from ${result.total} cards rated`}
        >
          <strong>{safeIndex + 1} <small>from</small> {level.cards.length}</strong>
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
          fallback={<span>Effects are temporarily unavailable. The cards remain working.</span>}
        />

        <aside className={styles.coach} data-state={result.complete ? 'complete' : revealed ? 'ready' : 'idle'} aria-label={`Corgi Helper: ${coachMessage}`}>
          <span className={styles.coachAura} aria-hidden="true" />
          <Image src="/corgi-coach-full-v3.png" alt="" width={1254} height={1254} priority />
          <p>{coachMessage}</p>
        </aside>

        {!result.complete ? (
          <>
            <motion.button
              ref={reviewTrayRef}
              type="button"
              className={`${styles.tray} ${styles.reviewTray}`}
              style={{ scale: reviewScale }}
              disabled={!running || !revealed || Boolean(exitRating)}
              onClick={() => rateCard('review')}
              aria-label="Send card to tray &quot;Repeat&quot;"
            >
              <motion.span className={styles.traySignal} style={{ opacity: reviewOpacity }} aria-hidden="true" />
              <i aria-hidden="true"><RotateCcw size={20} /></i>
              <strong>Repeat</strong>
              <small>{result.review}</small>
            </motion.button>

            <div ref={deckRef} className={styles.deckAnchor} aria-hidden="true" />

            <div ref={cardFrameRef} className={styles.cardFrame} key={cardKey}>
              <div
                className={styles.exitMotion}
                data-exit={exitRating ?? undefined}
                onAnimationEnd={(event) => {
                  if (event.currentTarget !== event.target) return
                  const active = activeExitRef.current
                  if (active) finishExit(active)
                }}
              >
                <motion.div
                  className={styles.cardMotion}
                  data-swipe-ready={revealed && running && !exitRating}
                  style={{ x: dragX, y: dragY, rotateZ: dragRotation }}
                  drag={revealed && running && !exitRating && !reducedMotion ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragDirectionLock
                  dragElastic={0.55}
                  dragMomentum={false}
                  whileDrag={{ cursor: 'grabbing', scale: 1.025 }}
                  onDragStart={() => {
                    visualBridge.sendCommand({ type: 'recall/drag', offsetX: 0, velocityX: 0 })
                  }}
                  onDrag={(_event, info) => {
                    visualBridge.sendCommand({
                      type: 'recall/drag',
                      offsetX: info.offset.x,
                      velocityX: info.velocity.x,
                    })
                  }}
                  onDragEnd={finishSwipe}
                >
                  <motion.span className={`${styles.swipeBadge} ${styles.reviewBadge}`} style={{ opacity: reviewOpacity }} aria-hidden="true">Repeat</motion.span>
                  <motion.span className={`${styles.swipeBadge} ${styles.rememberedBadge}`} style={{ opacity: rememberedOpacity }} aria-hidden="true">I know</motion.span>
                  <button
                    type="button"
                    className={styles.card}
                    data-revealed={revealed}
                    disabled={!running || Boolean(exitRating)}
                    aria-label={revealed
                      ? `Answer: ${card.back}. ${card.note}`
                      : `Card: ${card.front}. Show answer`}
                    aria-pressed={revealed}
                    onClick={() => {
                      if (!revealed && !suppressClickRef.current) revealCard()
                    }}
                  >
                    <span className={styles.cardInner}>
                      <span className={`${styles.cardFace} ${styles.cardFront}`} aria-hidden={revealed}>
                        <span>Try to remember</span>
                        {card.frontMedia ? <LearningImageView image={card.frontMedia} className={styles.cardMedia} /> : null}
                        <strong>{card.front}</strong>
                        <small><Eye size={16} /> Show answer</small>
                      </span>
                      <span className={`${styles.cardFace} ${styles.cardBack}`} aria-hidden={!revealed}>
                        <span>Test yourself</span>
                        {card.backMedia ? <LearningImageView image={card.backMedia} className={styles.cardMedia} /> : null}
                        <strong>{card.back}</strong>
                        {card.note ? <small>{card.note}</small> : null}
                      </span>
                    </span>
                  </button>
                </motion.div>
              </div>
            </div>

            <motion.button
              ref={rememberedTrayRef}
              type="button"
              className={`${styles.tray} ${styles.rememberedTray}`}
              style={{ scale: rememberedScale }}
              disabled={!running || !revealed || Boolean(exitRating)}
              onClick={() => rateCard('remembered')}
              aria-label="Send the card to the “I Know” tray"
            >
              <motion.span className={styles.traySignal} style={{ opacity: rememberedOpacity }} aria-hidden="true" />
              <i aria-hidden="true"><Check size={20} /></i>
              <strong>I know</strong>
              <small>{result.remembered}</small>
            </motion.button>

            <p className={styles.hint}>
              {revealed
                ? 'Pull left or right, or press the desired tray.'
                : 'Formulate your answer out loud or silently, then open the card.'}
            </p>
          </>
        ) : (
          <motion.div
            className={styles.final}
            initial={reducedMotion ? false : { opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 270, damping: 25 }}
            role="status"
          >
            <span aria-hidden="true"><Check size={25} /></span>
            <div>
              <strong>Deck complete</strong>
              <p>{result.remembered} I know · {result.review} repeat</p>
            </div>
            <i><b>{result.accuracy}%</b><small>self-esteem</small></i>
          </motion.div>
        )}

        <p className={styles.liveRegion} role="status" aria-live="polite">{announcement}</p>
      </div>

      {!running && !result.complete ? (
        <div className={styles.paused} role="status">
          <strong>Pause</strong>
          <span>Card saved</span>
        </div>
      ) : null}
    </section>
  )
}
