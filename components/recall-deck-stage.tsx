'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Check, Eye, RotateCcw, Sparkles } from 'lucide-react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'motion/react'
import { LearningImageView } from '@/components/learning-image'
import { getRecallDeckResult, type RecallDeckLevel, type RecallRating } from '@/lib/recall-deck'

type RecallDeckStageProps = {
  level: RecallDeckLevel
  ratings: Array<RecallRating | null>
  cardIndex: number
  revealed: boolean
  running: boolean
  onReveal: () => void
  onRate: (rating: RecallRating) => void
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
  const [exitState, setExitState] = useState<{
    cardKey: string
    rating: RecallRating
    ratingsSnapshot: Array<RecallRating | null>
  } | null>(null)
  const dragAnimation = useRef<{ stop: () => void } | null>(null)
  const cardFrameRef = useRef<HTMLDivElement>(null)
  const activeExitRef = useRef<{ cardKey: string; ratingsSnapshot: Array<RecallRating | null> } | null>(null)
  const suppressClickRef = useRef(false)
  const prefersReducedMotion = useReducedMotion()
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
  const exitRating = exitState?.cardKey === cardKey && exitState.ratingsSnapshot === ratings
    ? exitState.rating
    : null

  useEffect(() => {
    return () => {
      dragAnimation.current?.stop()
    }
  }, [])

  useEffect(() => {
    activeExitRef.current = null
    dragAnimation.current?.stop()
    dragAnimation.current = null
    dragX.set(0)
    suppressClickRef.current = false
  }, [cardKey, dragX])

  if (!card) {
    return <div className="recall-deck-stage memory-station-v2 recall-deck-empty">There are no cards in this deck yet.</div>
  }

  const rateCard = (rating: RecallRating) => {
    const activeExit = activeExitRef.current
    if (!running || (activeExit?.cardKey === cardKey && activeExit.ratingsSnapshot === ratings) || exitRating || !revealed) return

    if (prefersReducedMotion) {
      onRate(rating)
      return
    }

    activeExitRef.current = { cardKey, ratingsSnapshot: ratings }
    setExitState({ cardKey, rating, ratingsSnapshot: ratings })
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

    dragAnimation.current?.stop()
    dragAnimation.current = animate(dragX, 0, {
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
      : 'First formulate the answer, then turn the card over.'

  return (
    <section className={`recall-deck-stage memory-station-v2${revealed ? ' is-revealed' : ''}${result.complete ? ' is-complete' : ''}`} aria-label="Game &quot;Memory Station&quot;">
      <header className="memory-v2-header">
        <div className="memory-v2-heading">
          <span className="memory-v2-mark" aria-hidden="true"><Sparkles size={23} /></span>
          <div><h2>Recall Station</h2><p>{level.subject}</p></div>
        </div>
        <div className="memory-v2-route" aria-label={`Card ${safeIndex + 1} from ${level.cards.length}`}>
          {level.cards.map((item, index) => (
            <span className={index === safeIndex ? `is-current ${ratings[index] ?? ''}` : ratings[index] ?? ''} key={item.id}>
              {ratings[index] === 'remembered' ? <Check size={12} /> : ratings[index] === 'review' ? <RotateCcw size={11} /> : index + 1}
            </span>
          ))}
        </div>
        <div className="memory-v2-progress">
          <strong>{safeIndex + 1} <small>from</small> {level.cards.length}</strong>
          <i aria-hidden="true"><b style={{ width: `${(result.rated / Math.max(1, result.total)) * 100}%` }} /></i>
        </div>
      </header>

      <div className="memory-v2-scene">
        <div className="memory-v2-ambient ambient-one" aria-hidden="true" />
        <div className="memory-v2-ambient ambient-two" aria-hidden="true" />

        <aside className="memory-v2-coach" aria-label={`Corgi Helper: ${coachMessage}`}>
          <motion.div
            animate={prefersReducedMotion ? undefined : result.complete
              ? { y: [0, -9, 0], rotate: [0, -2, 2, 0] }
              : { y: [0, -2, 0] }}
            transition={result.complete
              ? { duration: 0.64 }
              : { duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            <Image src="/corgi-coach-full-v3.png" alt="Corgi librarian" width={1254} height={1254} priority />
          </motion.div>
          <p>{coachMessage}</p>
        </aside>

        {!result.complete ? (
          <>
            <motion.button
              type="button"
              className="memory-v2-tray is-review"
              style={{ scale: reviewScale }}
              disabled={!running || !revealed || Boolean(exitRating)}
              onClick={() => rateCard('review')}
              aria-label="Send card to tray &quot;Repeat&quot;"
            >
              <motion.span style={{ opacity: reviewOpacity }} aria-hidden="true" />
              <i><RotateCcw size={20} /></i>
              <strong>Repeat</strong>
              <small>{result.review}</small>
            </motion.button>

            <div className="memory-v2-deck" aria-hidden="true">
              <span /><span /><span />
            </div>

            <div className="memory-v2-card-frame" key={cardKey} ref={cardFrameRef}>
              <div
                className={`memory-v2-exit-motion${exitRating ? ` is-exiting-${exitRating}` : ''}`}
                onAnimationEnd={(event) => {
                  if (!event.animationName.startsWith('memory-v2-card-exit')) return
                  const activeExit = activeExitRef.current
                  if (!exitRating || activeExit?.cardKey !== cardKey || activeExit.ratingsSnapshot !== ratings) return
                  activeExitRef.current = null
                  setExitState(null)
                  onRate(exitRating)
                }}
              >
                <motion.div
                  className={`memory-v2-card-motion${revealed ? ' is-swipe-ready' : ''}${exitRating ? ` sorting-${exitRating}` : ''}`}
                  style={{ x: dragX, y: dragY, rotateZ: dragRotation }}
                  drag={revealed && running && !exitRating && !prefersReducedMotion ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragDirectionLock
                  dragElastic={0.55}
                  dragMomentum={false}
                  whileDrag={{ cursor: 'grabbing', scale: 1.025 }}
                  onDragEnd={finishSwipe}
                >
                  <motion.span className="memory-v2-swipe-badge is-review" style={{ opacity: reviewOpacity }} aria-hidden="true">Repeat</motion.span>
                  <motion.span className="memory-v2-swipe-badge is-remembered" style={{ opacity: rememberedOpacity }} aria-hidden="true">I know</motion.span>
                  <button
                    type="button"
                    className={revealed ? 'memory-v2-card is-revealed' : 'memory-v2-card'}
                    disabled={!running || Boolean(exitRating)}
                    aria-label={revealed ? `Answer: ${card.back}. ${card.note}` : `Card: ${card.front}. Show answer`}
                    aria-pressed={revealed}
                    onClick={() => {
                      if (!revealed && !suppressClickRef.current) onReveal()
                    }}
                  >
                    <span className="memory-v2-card-inner">
                      <span className={`memory-v2-card-face memory-v2-card-front${card.frontMedia ? ' has-media' : ''}`} aria-hidden={revealed}>
                        <span>Try to remember</span>
                        {card.frontMedia ? <LearningImageView image={card.frontMedia} /> : null}
                        <strong>{card.front}</strong>
                        <small><Eye size={16} /> Show answer</small>
                      </span>
                      <span className={`memory-v2-card-face memory-v2-card-back${card.backMedia ? ' has-media' : ''}`} aria-hidden={!revealed}>
                        <span>Test yourself</span>
                        {card.backMedia ? <LearningImageView image={card.backMedia} /> : null}
                        <strong>{card.back}</strong>
                        <small>{card.note}</small>
                      </span>
                    </span>
                  </button>
                </motion.div>
              </div>
            </div>

            <motion.button
              type="button"
              className="memory-v2-tray is-remembered"
              style={{ scale: rememberedScale }}
              disabled={!running || !revealed || Boolean(exitRating)}
              onClick={() => rateCard('remembered')}
              aria-label="Send the card to the “I Know” tray"
            >
              <motion.span style={{ opacity: rememberedOpacity }} aria-hidden="true" />
              <i><Check size={20} /></i>
              <strong>I know</strong>
              <small>{result.remembered}</small>
            </motion.button>

            <p className="memory-v2-hint">
              {revealed ? 'Pull left or right - or click on the desired tray.' : 'Formulate the answer out loud or silently, then open the card.'}
            </p>
          </>
        ) : (
          <motion.div
            className="memory-v2-final"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            role="status"
          >
            <span><Check size={24} /></span>
            <div><strong>Deck complete</strong><p>{result.remembered} I know · {result.review} repeat</p></div>
            <i><b>{result.accuracy}%</b><small>self-esteem</small></i>
          </motion.div>
        )}
      </div>

      {!running && !result.complete ? (
        <div className="memory-v2-paused" role="status"><strong>Pause</strong><span>Card saved</span></div>
      ) : null}
    </section>
  )
}
