'use client'

import Image from 'next/image'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Check, LayoutGrid, RotateCw, Sparkles, Target, X } from 'lucide-react'
import { GameOptionWheel } from '@/components/game-option-wheel'
import { LearningImageView } from '@/components/learning-image'
import { getQuizRushResult, type QuizRushLevel } from '@/lib/quiz-rush'

type QuizRushStageProps = {
  level: QuizRushLevel
  answers: Array<number | null>
  questionIndex: number
  running: boolean
  onSelect: (optionIndex: number) => void
  onAdvance: () => void
}

export function QuizRushStage({
  level,
  answers,
  questionIndex,
  running,
  onSelect,
  onAdvance,
}: QuizRushStageProps) {
  const [answerMode, setAnswerMode] = useState<'cards' | 'wheel'>('cards')
  const [wheelState, setWheelState] = useState({ questionId: '', selectedIndex: 0 })
  const prefersReducedMotion = useReducedMotion()
  const result = getQuizRushResult(level, answers)
  const safeIndex = Math.min(Math.max(questionIndex, 0), Math.max(0, level.questions.length - 1))
  const question = level.questions[safeIndex]

  if (!question) {
    return <div className="quiz-rush-stage quiz-sprint-v2 quiz-rush-empty">There are no questions in this set yet.</div>
  }

  const questionKey = `${level.id}:${question.id}`
  const wheelSelection = wheelState.questionId === questionKey ? wheelState.selectedIndex : 0
  const selectedIndex = answers[safeIndex]
  const answered = selectedIndex !== null && selectedIndex !== undefined
  const selectedCorrect = selectedIndex === question.correctIndex
  const isLast = safeIndex === level.questions.length - 1
  const coachMessage = answered
    ? selectedCorrect
      ? 'Exactly. We take the point and move on.'
      : 'Compare the answer with the explanation - there is a key to the next one.'
    : 'Choose the platform that sounds most accurate.'

  return (
    <section
      className={`quiz-rush-stage quiz-sprint-v2${answered ? ' is-answered' : ''}${selectedCorrect ? ' is-correct' : ''}${answered && !selectedCorrect ? ' is-wrong' : ''}`}
      aria-label="Quiz-sprint game"
    >
      <header className="quiz-v2-header">
        <div className="quiz-v2-heading">
          <span className="quiz-v2-mark" aria-hidden="true"><Target size={24} /></span>
          <div><h2>Quiz Rush</h2><p>{level.subject}</p></div>
        </div>
        <div className="quiz-v2-route" aria-label={`Question ${safeIndex + 1} from ${level.questions.length}`}>
          {level.questions.map((item, index) => {
            const answer = answers[index]
            const state = answer === null || answer === undefined
              ? index === safeIndex ? 'is-current' : ''
              : answer === item.correctIndex ? 'is-correct' : 'is-wrong'
            return (
              <span className={state} key={item.id}>
                {answer !== null && answer !== undefined ? (answer === item.correctIndex ? <Check size={12} /> : <X size={12} />) : index + 1}
              </span>
            )
          })}
        </div>
        <div className="quiz-v2-progress">
          <strong>{safeIndex + 1} <small>from</small> {level.questions.length}</strong>
          <i aria-hidden="true"><b style={{ width: `${((safeIndex + 1) / level.questions.length) * 100}%` }} /></i>
        </div>
      </header>

      <div className="quiz-v2-scene">
        <div className="quiz-v2-ambient ambient-one" aria-hidden="true" />
        <div className="quiz-v2-ambient ambient-two" aria-hidden="true" />

        <aside className={`quiz-v2-coach${answered ? selectedCorrect ? ' is-correct' : ' is-wrong' : ''}`} aria-label={`Corgi host: ${coachMessage}`}>
          <motion.div
            animate={prefersReducedMotion ? undefined : answered
              ? selectedCorrect
                ? { y: [0, -10, 0], rotate: [0, -2, 2, 0] }
                : { rotate: [0, -3, 3, 0] }
              : { y: [0, -2, 0] }}
            transition={answered
              ? { duration: 0.62 }
              : { duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            <Image src="/corgi-coach-full-v3.png" alt="Corgi Lead" width={1254} height={1254} priority />
          </motion.div>
          <p>{coachMessage}</p>
        </aside>

        <AnimatePresence mode="wait">
          <motion.div
            className="quiz-v2-round"
            key={questionKey}
            initial={prefersReducedMotion ? false : { opacity: 0, x: 28, scale: 0.985 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -30, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
          >
            <article className={question.media ? 'quiz-v2-question has-media' : 'quiz-v2-question'}>
              <div>
                <span>Question {safeIndex + 1}</span>
                <h3>{question.prompt}</h3>
              </div>
              {question.media ? (
                <div className="quiz-v2-question-media"><LearningImageView image={question.media} /></div>
              ) : null}
            </article>

            <div className="quiz-v2-mode">
              <span>Answer method</span>
              <div role="group" aria-label="Answer method">
                <button
                  type="button"
                  className={answerMode === 'cards' ? 'is-active' : ''}
                  disabled={!running || answered}
                  aria-pressed={answerMode === 'cards'}
                  onClick={() => setAnswerMode('cards')}
                ><LayoutGrid size={15} /> Cards</button>
                <button
                  type="button"
                  className={answerMode === 'wheel' ? 'is-active' : ''}
                  disabled={!running || answered}
                  aria-pressed={answerMode === 'wheel'}
                  onClick={() => setAnswerMode('wheel')}
                ><RotateCw size={15} /> Wheel</button>
              </div>
            </div>

            {answerMode === 'wheel' && !answered ? (
              <div className="quiz-v2-wheel-layout">
                <div className="quiz-v2-wheel-surface">
                  <GameOptionWheel
                    key={questionKey}
                    items={question.options}
                    defaultSelected={0}
                    disabled={!running}
                    onChange={(selectedOption) => setWheelState({ questionId: questionKey, selectedIndex: selectedOption })}
                  />
                </div>
                <div className="quiz-v2-wheel-choice" aria-live="polite">
                  <span className="quiz-v2-key">{String.fromCharCode(65 + wheelSelection)}</span>
                  <div>
                    <small>Option selected</small>
                    {question.optionMedia?.[wheelSelection] ? <LearningImageView image={question.optionMedia[wheelSelection]} /> : null}
                    <strong>{question.options[wheelSelection]}</strong>
                  </div>
                  <button type="button" disabled={!running} onClick={() => onSelect(wheelSelection)}>
                    Check <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="quiz-v2-options" data-option-count={question.options.length}>
                {question.options.map((option, index) => {
                  const isCorrect = index === question.correctIndex
                  const isSelected = selectedIndex === index
                  const state = answered && isCorrect ? 'is-correct' : answered && isSelected ? 'is-wrong' : ''
                  const optionMedia = question.optionMedia?.[index]

                  return (
                    <motion.button
                      type="button"
                      className={`${state}${optionMedia ? ' has-media' : ''}`.trim()}
                      disabled={!running || answered}
                      onClick={() => onSelect(index)}
                      key={`${question.id}-${index}`}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                      animate={state === 'is-wrong' && !prefersReducedMotion
                        ? { opacity: 1, y: 0, x: [0, -7, 6, -3, 0] }
                        : state === 'is-correct' && !prefersReducedMotion
                          ? { opacity: 1, y: [0, -7, 0], x: 0, scale: [1, 1.025, 1] }
                          : { opacity: 1, y: 0, x: 0, scale: 1 }}
                      transition={{
                        opacity: { duration: 0.2, delay: Math.min(index * 0.055, 0.2) },
                        y: { duration: 0.42, ease: 'easeOut' },
                        x: { duration: 0.4 },
                        scale: { duration: 0.42 },
                      }}
                      whileHover={!answered && running && !prefersReducedMotion ? { y: -5, scale: 1.012 } : undefined}
                      whileTap={!answered && running && !prefersReducedMotion ? { scale: 0.975 } : undefined}
                    >
                      <span className="quiz-v2-key">{String.fromCharCode(65 + index)}</span>
                      <span className="quiz-v2-option-content">
                        {optionMedia ? <LearningImageView image={optionMedia} /> : null}
                        <strong>{option}</strong>
                      </span>
                      {state === 'is-correct' ? <Check size={19} /> : state === 'is-wrong' ? <X size={19} /> : null}
                    </motion.button>
                  )
                })}
              </div>
            )}

            <AnimatePresence>
              {answered ? (
                <motion.aside
                  className={`quiz-v2-explanation ${selectedCorrect ? 'is-correct' : 'is-wrong'}`}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  role="status"
                >
                  <span>{selectedCorrect ? <Sparkles size={18} /> : <X size={18} />}</span>
                  <div><strong>{selectedCorrect ? 'Correct' : 'Let\'s look at the solution'}</strong><p>{question.explanation}</p></div>
                  {!isLast ? (
                    <button type="button" disabled={!running} onClick={onAdvance}>Next <ArrowRight size={16} /></button>
                  ) : result.complete ? (
                    <strong className="quiz-v2-final">Result: {result.correct}/{result.total} · {result.accuracy}%</strong>
                  ) : null}
                </motion.aside>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {answered && selectedCorrect && !prefersReducedMotion ? (
          <motion.span
            className="quiz-v2-energy"
            initial={{ left: '48%', top: '72%', opacity: 0, scale: 0.4 }}
            animate={{ left: '62%', top: '-7%', opacity: [0, 1, 1, 0], scale: [0.4, 1.2, 0.75] }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
            aria-hidden="true"
          />
        ) : null}
      </div>

      {!running && !result.complete ? (
        <div className="quiz-v2-paused" role="status"><strong>Pause</strong><span>Round saved</span></div>
      ) : null}
    </section>
  )
}
