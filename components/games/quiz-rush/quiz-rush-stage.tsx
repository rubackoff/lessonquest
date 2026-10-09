'use client'

import Image from 'next/image'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { useReducedMotion } from 'motion/react'
import { ArrowRight, Check, Grid2X2, RotateCw, Sparkles, Target, X } from 'lucide-react'
import { GameOptionWheel } from '@/components/game-option-wheel'
import { PhaserHost } from '@/components/game-runtime/phaser-host'
import { useGameRuntimeBridge } from '@/components/game-runtime/use-game-runtime-bridge'
import { LearningImageView } from '@/components/learning-image'
import { RuntimeBridge } from '@/lib/game-runtime/bridge'
import type { RuntimePoint } from '@/lib/game-runtime/contracts'
import {
  getQuizRushResult,
  type QuizQuestion,
  type QuizRushLevel,
  type QuizRushResult,
} from '@/lib/quiz-rush'
import {
  createQuizRushRuntime,
  type QuizRushRuntimeLayout,
  type QuizRushVisualCommand,
} from './quiz-rush-runtime'
import styles from './quiz-rush.module.css'

export type QuizRushStageProps = {
  level: QuizRushLevel
  answers: Array<number | null>
  questionIndex: number
  running: boolean
  onSelect: (optionIndex: number) => void
  onAdvance: () => void
}

const emptyLayout: QuizRushRuntimeLayout = {
  width: 1,
  height: 1,
  answerBounds: [],
  progressTarget: null,
}

export function QuizRushStage({
  level,
  answers,
  questionIndex,
  running,
  onSelect,
  onAdvance,
}: QuizRushStageProps) {
  const result = getQuizRushResult(level, answers)
  const safeIndex = Math.min(Math.max(questionIndex, 0), Math.max(0, level.questions.length - 1))
  const question = level.questions[safeIndex]

  if (!question) {
    return <div className={styles.empty}>There are no questions in this set yet.</div>
  }

  return (
    <QuizRushExperience
      level={level}
      answers={answers}
      question={question}
      safeIndex={safeIndex}
      result={result}
      running={running}
      onSelect={onSelect}
      onAdvance={onAdvance}
    />
  )
}

function QuizRushExperience({
  level,
  answers,
  question,
  safeIndex,
  result,
  running,
  onSelect,
  onAdvance,
}: {
  level: QuizRushLevel
  answers: Array<number | null>
  question: QuizQuestion
  safeIndex: number
  result: QuizRushResult
  running: boolean
  onSelect: (optionIndex: number) => void
  onAdvance: () => void
}) {
  const lifecycleBridge = useGameRuntimeBridge()
  const [visualBridge] = useState(() => new RuntimeBridge<QuizRushVisualCommand, never>())
  const createRuntime = useMemo(() => createQuizRushRuntime(visualBridge), [visualBridge])
  const reducedMotion = Boolean(useReducedMotion())
  const [answerMode, setAnswerMode] = useState<'cards' | 'wheel'>('cards')
  const [wheelState, setWheelState] = useState({ questionId: '', selectedIndex: 0 })
  const [layout, setLayout] = useState<QuizRushRuntimeLayout>(emptyLayout)
  const [runtimeRevision, setRuntimeRevision] = useState(0)
  const sceneRef = useRef<HTMLElement>(null)
  const optionRefs = useRef(new Map<number, HTMLButtonElement>())
  const routeRefs = useRef(new Map<number, HTMLSpanElement>())
  const wheelCheckRef = useRef<HTMLButtonElement>(null)
  const pendingOriginRef = useRef<RuntimePoint | null>(null)
  const lastFeedbackKeyRef = useRef('')
  const feedbackSequenceRef = useRef(0)
  const questionKey = `${level.id}:${question.id}`
  const wheelSelection = wheelState.questionId === questionKey ? wheelState.selectedIndex : 0
  const selectedIndex = answers[safeIndex]
  const answered = selectedIndex !== null && selectedIndex !== undefined
  const selectedCorrect = selectedIndex === question.correctIndex
  const isLast = safeIndex === level.questions.length - 1
  const streak = currentCorrectStreak(level, answers, safeIndex)
  const coachMessage = answered
    ? selectedCorrect
      ? streak > 1
        ? `Series ${streak}. The pace is great.`
        : 'Exactly. The energy of the route is collected.'
      : 'Check the selection against the explanation and continue.'
    : 'Choose the platform with the most accurate answer.'

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
    lastFeedbackKeyRef.current = ''
    pendingOriginRef.current = null
    visualBridge.sendCommand({ type: 'quiz/reset' })
  }, [questionKey, visualBridge])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const updateLayout = () => {
      const sceneRect = scene.getBoundingClientRect()
      if (!sceneRect.width || !sceneRect.height) return

      const relativeBounds = (element: HTMLElement | null) => {
        if (!element) return null
        const rect = element.getBoundingClientRect()
        return {
          x: rect.left - sceneRect.left,
          y: rect.top - sceneRect.top,
          width: rect.width,
          height: rect.height,
        }
      }

      const progressBounds = relativeBounds(routeRefs.current.get(safeIndex) ?? null)
      setLayout({
        width: sceneRect.width,
        height: sceneRect.height,
        answerBounds: question.options.map((_, index) => relativeBounds(optionRefs.current.get(index) ?? null)),
        progressTarget: progressBounds
          ? {
              x: progressBounds.x + progressBounds.width * 0.5,
              y: progressBounds.y + progressBounds.height * 0.5,
            }
          : null,
      })
    }

    const frame = window.requestAnimationFrame(updateLayout)
    const observer = new ResizeObserver(updateLayout)
    observer.observe(scene)
    for (const option of optionRefs.current.values()) observer.observe(option)
    for (const route of routeRefs.current.values()) observer.observe(route)
    void document.fonts?.ready.then(updateLayout)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [answerMode, answered, question.options, questionKey, safeIndex])

  useEffect(() => {
    visualBridge.sendCommand({ type: 'quiz/layout', layout })
  }, [layout, runtimeRevision, visualBridge])

  useEffect(() => {
    if (runtimeRevision > 0) lastFeedbackKeyRef.current = ''
  }, [runtimeRevision])

  useEffect(() => {
    if (!answered || selectedIndex === null || selectedIndex === undefined) return
    const feedbackKey = `${questionKey}:${selectedIndex}`
    if (lastFeedbackKeyRef.current === feedbackKey) return
    lastFeedbackKeyRef.current = feedbackKey

    const frame = window.requestAnimationFrame(() => {
      const sceneRect = sceneRef.current?.getBoundingClientRect()
      const optionRect = optionRefs.current.get(selectedIndex)?.getBoundingClientRect()
      const origin = pendingOriginRef.current ?? (sceneRect && optionRect
        ? {
            x: optionRect.left - sceneRect.left + optionRect.width * 0.5,
            y: optionRect.top - sceneRect.top + optionRect.height * 0.5,
          }
        : { x: layout.width * 0.5, y: layout.height * 0.72 })
      const target = layout.progressTarget ?? { x: layout.width * 0.58, y: 58 }
      feedbackSequenceRef.current += 1
      visualBridge.sendCommand({
        type: 'quiz/feedback',
        correct: selectedCorrect,
        optionIndex: selectedIndex,
        origin,
        target,
        streak,
        sequence: feedbackSequenceRef.current,
      })
      pendingOriginRef.current = null
    })

    return () => window.cancelAnimationFrame(frame)
  }, [answered, layout, questionKey, runtimeRevision, selectedCorrect, selectedIndex, streak, visualBridge])

  const rememberOrigin = (element: HTMLElement | null) => {
    const sceneRect = sceneRef.current?.getBoundingClientRect()
    const sourceRect = element?.getBoundingClientRect()
    if (!sceneRect || !sourceRect) return
    pendingOriginRef.current = {
      x: sourceRect.left - sceneRect.left + sourceRect.width * 0.5,
      y: sourceRect.top - sceneRect.top + sourceRect.height * 0.5,
    }
  }

  const selectOption = (optionIndex: number, source: HTMLElement | null) => {
    if (!running || answered) return
    rememberOrigin(source)
    onSelect(optionIndex)
  }

  const setHover = (optionIndex: number | null) => {
    if (answered || !running) return
    visualBridge.sendCommand({ type: 'quiz/hover', optionIndex })
  }

  return (
    <section
      ref={sceneRef}
      className={styles.scene}
      data-game-shell="quiz-rush"
      data-state={answered ? selectedCorrect ? 'correct' : 'wrong' : 'question'}
      style={{ '--quiz-progress': `${((safeIndex + 1) / level.questions.length) * 100}%` } as CSSProperties}
      aria-label="Quiz-sprint game"
    >
      <PhaserHost
        bridge={lifecycleBridge}
        createGame={createRuntime}
        paused={!running}
        reducedMotion={reducedMotion}
        interactive={false}
        className={styles.runtime}
        fallback={<span>Effects are temporarily unavailable - the quiz remains operational.</span>}
      />

      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.mark} aria-hidden="true"><Target size={27} strokeWidth={2.35} /></span>
          <div className={styles.titleBlock}>
            <h2>Quiz Rush</h2>
            <p>{level.subject}</p>
          </div>
        </div>

        <div className={styles.route} aria-label={`Question ${safeIndex + 1} from ${level.questions.length}`}>
          {level.questions.map((item, index) => {
            const answer = answers[index]
            const state = answer === null || answer === undefined
              ? index === safeIndex ? 'current' : 'pending'
              : answer === item.correctIndex ? 'correct' : 'wrong'
            return (
              <span
                ref={(node) => {
                  if (node) routeRefs.current.set(index, node)
                  else routeRefs.current.delete(index)
                }}
                className={styles.routeNode}
                data-state={state}
                key={item.id}
                aria-label={`Question ${index + 1}: ${routeStateLabel(state)}`}
              >
                {state === 'correct' ? <Check size={13} /> : state === 'wrong' ? <X size={13} /> : index + 1}
              </span>
            )
          })}
        </div>

        <div className={styles.progress} aria-label={`${safeIndex + 1} from ${level.questions.length}`}>
          <strong>{safeIndex + 1} <small>from</small> {level.questions.length}</strong>
          <span className={styles.progressBar} aria-hidden="true"><i /></span>
        </div>
      </header>

      <div className={styles.world}>
        <aside className={styles.coach} data-state={answered ? selectedCorrect ? 'correct' : 'wrong' : 'idle'} aria-label={`Corgi host: ${coachMessage}`}>
          <span className={styles.coachImage}>
            <Image src="/corgi-coach-full-v3.png" alt="" width={1254} height={1254} priority />
          </span>
          <p className={styles.coachBubble}>{coachMessage}</p>
        </aside>

        <main className={styles.round} key={questionKey}>
          <article className={styles.question} data-has-media={Boolean(question.media)}>
            <div className={styles.questionCopy}>
              <span className={styles.eyebrow}>Question {safeIndex + 1}</span>
              <h3>{question.prompt}</h3>
            </div>
            {question.media ? (
              <div className={styles.questionMedia}><LearningImageView image={question.media} /></div>
            ) : null}
          </article>

          <div className={styles.mode}>
            <span>Answer method</span>
            <div className={styles.modeButtons} role="group" aria-label="Answer method">
              <button
                type="button"
                className={answerMode === 'cards' ? styles.activeMode : undefined}
                disabled={!running || answered}
                aria-pressed={answerMode === 'cards'}
                onClick={() => setAnswerMode('cards')}
              ><Grid2X2 size={15} /> Cards</button>
              <button
                type="button"
                className={answerMode === 'wheel' ? styles.activeMode : undefined}
                disabled={!running || answered}
                aria-pressed={answerMode === 'wheel'}
                onClick={() => setAnswerMode('wheel')}
              ><RotateCw size={15} /> Wheel</button>
            </div>
          </div>

          {answerMode === 'wheel' && !answered ? (
            <div className={styles.wheelLayout}>
              <div className={styles.wheelSurface}>
                <GameOptionWheel
                  key={questionKey}
                  items={question.options}
                  defaultSelected={0}
                  disabled={!running}
                  onChange={(selectedOption) => setWheelState({ questionId: questionKey, selectedIndex: selectedOption })}
                />
              </div>
              <div className={styles.wheelChoice} aria-live="polite">
                <span className={styles.optionKey}>{String.fromCharCode(65 + wheelSelection)}</span>
                <div>
                  <small>Option selected</small>
                  {question.optionMedia?.[wheelSelection] ? <LearningImageView image={question.optionMedia[wheelSelection]} /> : null}
                  <strong>{question.options[wheelSelection]}</strong>
                </div>
                <button
                  ref={wheelCheckRef}
                  type="button"
                  disabled={!running}
                  onClick={(event) => selectOption(wheelSelection, event.currentTarget)}
                >Check <ArrowRight size={16} /></button>
              </div>
            </div>
          ) : (
            <div className={styles.options} data-option-count={question.options.length}>
              {question.options.map((option, index) => {
                const isCorrect = index === question.correctIndex
                const isSelected = selectedIndex === index
                const stateClass = answered && isCorrect
                  ? styles.correctOption
                  : answered && isSelected
                    ? styles.wrongOption
                    : undefined
                const optionMedia = question.optionMedia?.[index]

                return (
                  <button
                    ref={(node) => {
                      if (node) optionRefs.current.set(index, node)
                      else optionRefs.current.delete(index)
                    }}
                    type="button"
                    className={[styles.option, stateClass].filter(Boolean).join(' ')}
                    disabled={!running || answered}
                    onClick={(event) => selectOption(index, event.currentTarget)}
                    onPointerEnter={() => setHover(index)}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(index)}
                    onBlur={() => setHover(null)}
                    key={`${question.id}-${index}`}
                  >
                    <span className={styles.optionKey}>{String.fromCharCode(65 + index)}</span>
                    <span className={styles.optionContent}>
                      {optionMedia ? <LearningImageView image={optionMedia} /> : null}
                      <strong>{option}</strong>
                    </span>
                    {answered && isCorrect ? <Check size={20} /> : answered && isSelected ? <X size={20} /> : null}
                  </button>
                )
              })}
            </div>
          )}

          {answered ? (
            <aside
              className={[
                styles.explanation,
                selectedCorrect ? styles.correctExplanation : styles.wrongExplanation,
              ].join(' ')}
              role="status"
            >
              <span className={styles.explanationIcon} aria-hidden="true">
                {selectedCorrect ? <Sparkles size={18} /> : <X size={18} />}
              </span>
              <div>
                <strong>{selectedCorrect ? 'Correct' : 'Let\'s look at the solution'}</strong>
                <p>{question.explanation}</p>
              </div>
              {!isLast ? (
                <button className={styles.advance} type="button" disabled={!running} onClick={onAdvance}>
                  Next <ArrowRight size={16} />
                </button>
              ) : result.complete ? (
                <strong className={styles.final}>Result: {result.correct}/{result.total} · {result.accuracy}%</strong>
              ) : null}
            </aside>
          ) : null}
        </main>
      </div>

      <p className={styles.liveRegion} aria-live="polite">
        {answered ? `${selectedCorrect ? 'Correct.' : 'The answer is incorrect.'} ${question.explanation}` : ''}
      </p>

      {!running && !result.complete ? (
        <div className={styles.paused} role="status"><strong>Pause</strong><span>Round saved</span></div>
      ) : null}
    </section>
  )
}

function currentCorrectStreak(level: QuizRushLevel, answers: Array<number | null>, throughIndex: number) {
  let streak = 0
  for (let index = throughIndex; index >= 0; index -= 1) {
    if (answers[index] !== level.questions[index]?.correctIndex) break
    streak += 1
  }
  return streak
}

function routeStateLabel(state: 'current' | 'pending' | 'correct' | 'wrong') {
  if (state === 'current') return 'current'
  if (state === 'correct') return 'right'
  if (state === 'wrong') return 'error'
  return 'not passed yet'
}
