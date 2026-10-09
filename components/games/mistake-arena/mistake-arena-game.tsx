'use client'

import Image from 'next/image'
import { Check, Lightbulb, ScanSearch, Target, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PhaserHost } from '@/components/game-runtime/phaser-host'
import { useGameRuntimeBridge } from '@/components/game-runtime/use-game-runtime-bridge'
import { RuntimeBridge } from '@/lib/game-runtime/bridge'
import type { MistakeArenaLevel, MistakeArenaResult } from '@/lib/mistake-arena'
import { getVisualThemeId } from '@/lib/visual-themes'
import {
  createMistakeArenaRuntime,
  type MistakeArenaRuntimeLayout,
  type MistakeArenaVisualCommand,
} from './mistake-arena-runtime'
import styles from './mistake-arena.module.css'

export type MistakeArenaGameProps = {
  level: MistakeArenaLevel
  result: MistakeArenaResult
  selectedIndex: number | null
  running: boolean
  onSelect: (index: number) => void
}

const emptyLayout: MistakeArenaRuntimeLayout = {
  width: 1,
  height: 1,
  board: null,
  tokens: [],
}

export function MistakeArenaGame({
  level,
  result,
  selectedIndex,
  running,
  onSelect,
}: MistakeArenaGameProps) {
  const lifecycleBridge = useGameRuntimeBridge()
  const [visualBridge] = useState(
    () => new RuntimeBridge<MistakeArenaVisualCommand, never>(),
  )
  const createRuntime = useMemo(
    () => createMistakeArenaRuntime(visualBridge),
    [visualBridge],
  )
  const sceneRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLElement>(null)
  const tokenRefs = useRef(new Map<number, HTMLButtonElement>())
  const previousFeedbackRef = useRef('')
  const [layout, setLayout] = useState(emptyLayout)
  const [runtimeRevision, setRuntimeRevision] = useState(0)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const reducedMotion = useReducedMotionPreference()
  const themeId = getVisualThemeId(level)
  const correct = result.correct
  const hasWrongSelection = result.hasSelection && !correct

  useEffect(() => {
    const unsubscribe = lifecycleBridge.subscribeEvents((event) => {
      if (event.type === 'runtime/ready') setRuntimeRevision((value) => value + 1)
    })
    return () => {
      unsubscribe()
    }
  }, [lifecycleBridge])

  useEffect(() => {
    return () => visualBridge.clear()
  }, [visualBridge])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const updateLayout = () => {
      const sceneRect = scene.getBoundingClientRect()
      if (!sceneRect.width || !sceneRect.height) return
      const toRelativeRect = (element: HTMLElement | null) => {
        if (!element) return null
        const rect = element.getBoundingClientRect()
        return {
          x: rect.left - sceneRect.left,
          y: rect.top - sceneRect.top,
          width: rect.width,
          height: rect.height,
        }
      }
      setLayout({
        width: sceneRect.width,
        height: sceneRect.height,
        board: toRelativeRect(boardRef.current),
        tokens: level.tokens.map((_, index) => toRelativeRect(tokenRefs.current.get(index) ?? null)),
      })
    }

    const observer = new ResizeObserver(updateLayout)
    observer.observe(scene)
    if (boardRef.current) observer.observe(boardRef.current)
    for (const token of tokenRefs.current.values()) observer.observe(token)
    const frame = window.requestAnimationFrame(updateLayout)
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [level.id, level.tokens])

  useEffect(() => {
    visualBridge.sendCommand({ type: 'mistake/theme', themeId })
    visualBridge.sendCommand({ type: 'mistake/layout', layout })
    visualBridge.sendCommand({ type: 'mistake/focus', index: focusedIndex })
  }, [focusedIndex, layout, runtimeRevision, themeId, visualBridge])

  useEffect(() => {
    if (selectedIndex === null || !result.hasSelection) {
      previousFeedbackRef.current = ''
      visualBridge.sendCommand({ type: 'mistake/reset' })
      return
    }
    const signature = `${level.id}:${selectedIndex}:${result.correct}`
    if (previousFeedbackRef.current === signature) return
    previousFeedbackRef.current = signature
    visualBridge.sendCommand({
      type: 'mistake/feedback',
      index: selectedIndex,
      correct: result.correct,
    })
  }, [level.id, result.correct, result.hasSelection, selectedIndex, visualBridge])

  const selectToken = (index: number) => {
    if (!running || correct) return
    setFocusedIndex(index)
    onSelect(index)
  }

  const coachMessage = correct
    ? 'Exactly. Now the rule works again.'
    : hasWrongSelection
      ? 'Not here. Check connections with neighboring fragments.'
      : 'Scan the record and find the place where the rule broke.'

  return (
    <section
      className={`${styles.scene}${correct ? ` ${styles.complete}` : ''}${hasWrongSelection ? ` ${styles.wrong}` : ''}`}
      data-game-shell="mistake-arena"
      data-theme={themeId}
      aria-label="Game &quot;Find the mistake&quot;"
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.mark} aria-hidden="true"><Target size={25} /></span>
          <div>
            <h2>Find the Mistake</h2>
            <p>Click on the wrong fragment</p>
          </div>
        </div>
        <div className={`${styles.status}${correct ? ` ${styles.success}` : ''}${hasWrongSelection ? ` ${styles.error}` : ''}`} aria-live="polite">
          {correct ? <Check size={18} /> : hasWrongSelection ? <X size={18} /> : <ScanSearch size={18} />}
          <strong>{correct ? 'Error found' : hasWrongSelection ? 'Check again' : 'Scan'}</strong>
        </div>
      </header>

      <div className={styles.world} ref={sceneRef}>
        <PhaserHost
          bridge={lifecycleBridge}
          createGame={createRuntime}
          paused={!running}
          reducedMotion={reducedMotion}
          interactive={false}
          className={styles.runtime}
        />

        <div className={styles.lens} aria-hidden="true">
          <span><ScanSearch size={35} /></span>
        </div>

        <article className={styles.board} ref={boardRef}>
          <div className={styles.boardMeta}>
            <span>{level.subject}</span>
            <strong>{level.title}</strong>
          </div>
          <p className={styles.prompt}>{level.prompt}</p>
          <div className={styles.expression} role="group" aria-label="Recording fragments">
            {level.tokens.map((token, index) => {
              const selected = selectedIndex === index
              const tokenCorrect = correct && index === level.correctIndex
              const tokenWrong = hasWrongSelection && selected
              const visibleToken = tokenCorrect ? level.correctToken : token
              return (
                <button
                  type="button"
                  className={`${styles.token}${tokenCorrect ? ` ${styles.tokenCorrect}` : ''}${tokenWrong ? ` ${styles.tokenWrong}` : ''}`}
                  key={`${level.id}-${index}`}
                  ref={(node) => {
                    if (node) tokenRefs.current.set(index, node)
                    else tokenRefs.current.delete(index)
                  }}
                  disabled={!running || correct}
                  aria-label={`Fragment ${index + 1}: ${visibleToken}${tokenCorrect ? '. Bug fixed' : ''}`}
                  aria-pressed={selected}
                  onClick={() => selectToken(index)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  onPointerEnter={() => setFocusedIndex(index)}
                  onPointerLeave={() => setFocusedIndex(null)}
                >
                  <span>{visibleToken}</span>
                  {tokenCorrect ? <Check size={17} aria-hidden="true" /> : null}
                </button>
              )
            })}
          </div>
        </article>

        <aside className={`${styles.ruleCard}${correct ? ` ${styles.ruleCorrect}` : ''}${hasWrongSelection ? ` ${styles.ruleWrong}` : ''}`} role="status">
          <span>{correct ? <Check size={20} /> : hasWrongSelection ? <X size={20} /> : <Lightbulb size={20} />}</span>
          <div>
            <strong>{correct ? 'Explanation' : hasWrongSelection ? 'Not here yet' : 'Rule'}</strong>
            <p>{correct ? level.explanation : hasWrongSelection ? 'Match the rule with each sign and word in turn.' : level.rule}</p>
          </div>
        </aside>

        <aside className={`${styles.coach}${correct ? ` ${styles.coachSuccess}` : ''}`} aria-label={`Corgi Helper: ${coachMessage}`}>
          <Image src="/corgi-coach-full-v3.png" alt="Corgi helper" width={1254} height={1254} priority />
          {(result.hasSelection || correct) ? <p>{coachMessage}</p> : null}
        </aside>

        {!running && !correct ? (
          <div className={styles.paused} role="status">
            <strong>Pause</strong>
            <span>The recording will remain in place</span>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function useReducedMotionPreference() {
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
