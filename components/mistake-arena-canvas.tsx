'use client'

import Image from 'next/image'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Lightbulb, ScanSearch, Target, X } from 'lucide-react'
import type { MistakeArenaLevel, MistakeArenaResult } from '@/lib/mistake-arena'

type MistakeArenaCanvasProps = {
  level: MistakeArenaLevel
  result: MistakeArenaResult
  selectedIndex: number | null
  running: boolean
  onSelect: (index: number) => void
}

export function MistakeArenaCanvas({
  level,
  result,
  selectedIndex,
  running,
  onSelect,
}: MistakeArenaCanvasProps) {
  const prefersReducedMotion = useReducedMotion()
  const [attempt, setAttempt] = useState(0)
  const correct = result.correct
  const hasWrongSelection = result.hasSelection && !correct

  const selectToken = (index: number) => {
    if (!running || correct) return
    setAttempt((value) => value + 1)
    onSelect(index)
  }

  const coachMessage = correct
    ? 'Exactly. Now you can see how the recording should work.'
    : hasWrongSelection
      ? 'This snippet looks plausible. Check nearby connections.'
      : 'Look for a place where the rule is no longer fulfilled.'

  return (
    <section
      className={`game-canvas mistake-canvas mistake-stage-v2${correct ? ' is-complete' : ''}${hasWrongSelection ? ' has-error' : ''}`}
      aria-label="Game &quot;Find the mistake&quot;"
    >
      <header className="mistake-v2-header">
        <div className="mistake-v2-heading">
          <span className="mistake-v2-mark" aria-hidden="true"><Target size={24} /></span>
          <div>
            <h2>Find the Mistake</h2>
            <p>Click on the wrong fragment</p>
          </div>
        </div>
        <div className={`mistake-v2-status${correct ? ' is-correct' : hasWrongSelection ? ' is-wrong' : ''}`} aria-live="polite">
          {correct ? <Check size={18} /> : hasWrongSelection ? <X size={18} /> : <ScanSearch size={18} />}
          <strong>{correct ? 'Found' : hasWrongSelection ? 'Try again' : 'Search in progress'}</strong>
        </div>
      </header>

      <div className="mistake-v2-scene">
        <div className="mistake-v2-ambient ambient-one" aria-hidden="true" />
        <div className="mistake-v2-ambient ambient-two" aria-hidden="true" />
        <motion.div
          className="mistake-v2-lens"
          aria-hidden="true"
          animate={prefersReducedMotion ? undefined : { rotate: [0, 4, -2, 0], y: [0, -3, 0] }}
          transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        >
          <ScanSearch size={34} />
        </motion.div>

        <motion.article
          className="mistake-v2-board"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24 }}
        >
          <div className="mistake-v2-board-topline">
            <span>{level.subject}</span>
            <strong>{level.title}</strong>
          </div>
          <p className="mistake-v2-prompt">{level.prompt}</p>

          <div className="mistake-v2-expression" role="group" aria-label="Recording fragments">
            {level.tokens.map((token, index) => {
              const selected = selectedIndex === index
              const tokenCorrect = correct && index === level.correctIndex
              const tokenWrong = hasWrongSelection && selected
              const visibleToken = tokenCorrect ? level.correctToken : token

              return (
                <motion.button
                  type="button"
                  className={`${tokenCorrect ? 'is-correct' : ''}${tokenWrong ? ' is-wrong' : ''}`.trim()}
                  key={`${level.id}-${index}-${selected ? attempt : 0}`}
                  disabled={!running || correct}
                  aria-label={`Fragment ${index + 1}: ${visibleToken}${tokenCorrect ? '. Bug fixed' : ''}`}
                  aria-pressed={selected}
                  onClick={() => selectToken(index)}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={tokenWrong && !prefersReducedMotion
                    ? { opacity: 1, y: 0, x: [0, -7, 6, -4, 2, 0], scale: [1, 1.05, 0.985, 1] }
                    : tokenCorrect && !prefersReducedMotion
                      ? { opacity: 1, y: [0, -12, 0], x: 0, scale: [1, 1.1, 1.04] }
                      : { opacity: 1, y: 0, x: 0, scale: 1 }}
                  transition={{
                    opacity: { duration: 0.2, delay: Math.min(index * 0.035, 0.28) },
                    y: { duration: 0.42, ease: 'easeOut' },
                    x: { duration: 0.42 },
                    scale: { duration: 0.42 },
                  }}
                  whileHover={running && !correct && !prefersReducedMotion ? { y: -4, scale: 1.025 } : undefined}
                  whileTap={running && !correct && !prefersReducedMotion ? { scale: 0.96 } : undefined}
                >
                  <span>{visibleToken}</span>
                  {tokenCorrect ? <Check size={17} aria-hidden="true" /> : null}
                </motion.button>
              )
            })}
          </div>

          <div className="mistake-v2-scanline" aria-hidden="true" />
        </motion.article>

        <AnimatePresence mode="wait">
          {correct ? (
            <motion.aside
              className="mistake-v2-explanation is-correct"
              key="correct"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 280, damping: 25 }}
              role="status"
            >
              <span><Check size={19} /></span>
              <div>
                <strong>Explanation</strong>
                <p>{level.explanation}</p>
              </div>
            </motion.aside>
          ) : (
            <motion.aside
              className={`mistake-v2-explanation${hasWrongSelection ? ' is-wrong' : ''}`}
              key={hasWrongSelection ? `wrong-${attempt}` : 'rule'}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <span>{hasWrongSelection ? <X size={19} /> : <Lightbulb size={19} />}</span>
              <div>
                <strong>{hasWrongSelection ? 'Not here yet' : 'Rule'}</strong>
                <p>{hasWrongSelection ? 'Go back to the recording and check which fragment the rule applies to.' : level.rule}</p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <aside className={`mistake-v2-coach${correct ? ' is-correct' : hasWrongSelection ? ' is-wrong' : ''}`} aria-label={`Corgi Helper: ${coachMessage}`}>
          <motion.div
            animate={prefersReducedMotion ? undefined : correct
              ? { y: [0, -10, 0], rotate: [0, -2, 2, 0] }
              : hasWrongSelection
                ? { rotate: [0, -3, 3, 0] }
                : { y: [0, -2, 0] }}
            transition={correct || hasWrongSelection
              ? { duration: 0.62 }
              : { duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            <Image src="/corgi-coach-full-v3.png" alt="Corgi helper" width={1254} height={1254} priority />
          </motion.div>
          {(result.hasSelection || correct) ? <p>{coachMessage}</p> : null}
        </aside>
      </div>

      {!running && !correct ? (
        <div className="mistake-v2-paused" role="status">
          <strong>Pause</strong>
          <span>The recording will remain in place</span>
        </div>
      ) : null}
    </section>
  )
}
