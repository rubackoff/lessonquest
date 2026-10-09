'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Brain,
  Boxes,
  Check,
  CircleAlert,
  FlaskConical,
  Gauge,
  HelpCircle,
  Link2,
  RotateCcw,
  Target,
  Timer,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { ForceLabCanvas } from '@/components/games/force-lab'
import { ClickSparkLayer, SpotlightAside } from '@/components/game-effects'
import gamePlayerLayoutStyles from '@/components/game-runtime/game-player-layout.module.css'
import { GroupSortCanvas } from '@/components/games/group-sort'
import { MatchPairsCanvas } from '@/components/match-pairs-canvas'
import { MistakeArenaCanvas } from '@/components/games/mistake-arena'
import { QuizRushStage } from '@/components/games/quiz-rush'
import { RecallDeckStage } from '@/components/games/recall-deck'
import { getActivityDefinition } from '@/lib/activity-runtime'
import type { SavedEditorActivity } from '@/lib/editor-runtime'
import { formatGap, getBalanceResult, type ForceLabLevel } from '@/lib/force-lab'
import { transitionMatchPairsAttempt } from '@/lib/game-session/match-pairs-session'
import { getGroupSortResult, type GroupPlacement, type GroupSortLevel } from '@/lib/group-sort'
import { getMatchPairsResult, type MatchConnection, type MatchPairsLevel } from '@/lib/match-pairs'
import { getMistakeArenaResult, type MistakeArenaLevel } from '@/lib/mistake-arena'
import { createEmptyQuizAnswers, getQuizRushResult, type QuizRushLevel } from '@/lib/quiz-rush'
import {
  createEmptyRecallRatings,
  getRecallDeckResult,
  type RecallDeckLevel,
  type RecallRating,
} from '@/lib/recall-deck'
import { getVisualThemeId } from '@/lib/visual-themes'

type StudentPlayScreenProps = {
  activity: SavedEditorActivity | null
}

export function StudentPlayScreen({ activity }: StudentPlayScreenProps) {
  if (!activity) {
    return (
      <main className="student-shell student-empty">
        <span className="brand-mark">N</span>
        <h1>Job not found</h1>
        <p>Check the link address or ask your tutor to republish the exercise.</p>
        <Link className="primary-button" href="/studio">
          <ArrowLeft size={17} />
          Return to the studio
        </Link>
      </main>
    )
  }

  return <StudentRunner activity={activity} />
}

function StudentRunner({ activity }: { activity: SavedEditorActivity }) {
  const [sessionKey, setSessionKey] = useState(0)

  return (
    <StudentActivitySession
      key={sessionKey}
      activity={activity}
      onReset={() => setSessionKey((value) => value + 1)}
    />
  )
}

function StudentActivitySession({
  activity,
  onReset,
}: {
  activity: SavedEditorActivity
  onReset: () => void
}) {
  const definition = getActivityDefinition(activity.gameId)
  const forceLevel = activity.gameId === 'force-lab' ? (activity.level as ForceLabLevel) : null
  const mistakeLevel = activity.gameId === 'mistake-arena' ? (activity.level as MistakeArenaLevel) : null
  const matchLevel = activity.gameId === 'match-pairs' ? (activity.level as MatchPairsLevel) : null
  const groupLevel = activity.gameId === 'group-sort' ? (activity.level as GroupSortLevel) : null
  const quizLevel = activity.gameId === 'quiz-rush' ? (activity.level as QuizRushLevel) : null
  const recallLevel = activity.gameId === 'recall-deck' ? (activity.level as RecallDeckLevel) : null
  const immersiveGame = Boolean(
    forceLevel || mistakeLevel || matchLevel || groupLevel || quizLevel || recallLevel,
  )

  const [seconds, setSeconds] = useState(90)
  const [running, setRunning] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [feedback, setFeedback] = useState(definition.activeFeedback)
  const [force, setForce] = useState(() => (forceLevel ? Math.max(1, forceLevel.targetForce - 3) : 5))
  const [angle, setAngle] = useState(() => (forceLevel ? Math.max(0, forceLevel.targetAngle - 8) : 18))
  const [answer, setAnswer] = useState('')
  const [mistakeSelection, setMistakeSelection] = useState<number | null>(null)
  const [matchConnections, setMatchConnections] = useState<MatchConnection[]>([])
  const [matchAttempts, setMatchAttempts] = useState(0)
  const [groupPlacements, setGroupPlacements] = useState<GroupPlacement[]>([])
  const [quizAnswers, setQuizAnswers] = useState<Array<number | null>>(() => (
    quizLevel ? createEmptyQuizAnswers(quizLevel) : []
  ))
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0)
  const [recallRatings, setRecallRatings] = useState<Array<RecallRating | null>>(() => (
    recallLevel ? createEmptyRecallRatings(recallLevel) : []
  ))
  const [recallCardIndex, setRecallCardIndex] = useState(0)
  const [recallRevealed, setRecallRevealed] = useState(false)
  const [studentName, setStudentName] = useState('Student')
  const [attemptStatus, setAttemptStatus] = useState('Once completed, the result will be sent to the tutor.')
  const attemptSent = useRef(false)
  const attemptInFlight = useRef(false)
  const [attemptFailed, setAttemptFailed] = useState(false)
  const [attemptRetryKey, setAttemptRetryKey] = useState(0)

  const forceResult = useMemo(
    () => (forceLevel ? getBalanceResult(forceLevel, { force, angle }, answer) : null),
    [answer, angle, force, forceLevel],
  )
  const mistakeResult = useMemo(
    () => (mistakeLevel ? getMistakeArenaResult(mistakeLevel, mistakeSelection) : null),
    [mistakeLevel, mistakeSelection],
  )
  const matchResult = useMemo(
    () => (matchLevel ? getMatchPairsResult(matchLevel, matchConnections, matchAttempts) : null),
    [matchAttempts, matchConnections, matchLevel],
  )
  const groupResult = useMemo(
    () => (groupLevel ? getGroupSortResult(groupLevel, groupPlacements) : null),
    [groupLevel, groupPlacements],
  )
  const quizResult = useMemo(
    () => (quizLevel ? getQuizRushResult(quizLevel, quizAnswers) : null),
    [quizAnswers, quizLevel],
  )
  const recallResult = useMemo(
    () => (recallLevel ? getRecallDeckResult(recallLevel, recallRatings) : null),
    [recallLevel, recallRatings],
  )
  const solved = Boolean(
    forceResult?.gateOpen || mistakeResult?.correct || matchResult?.complete || groupResult?.complete || quizResult?.complete || recallResult?.complete,
  )
  const accuracy = Math.round(
    forceResult?.efficiency ?? mistakeResult?.accuracy ?? matchResult?.accuracy ?? groupResult?.accuracy ?? quizResult?.accuracy ?? recallResult?.accuracy ?? 0,
  )

  useEffect(() => {
    if (!running || solved) return

    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [running, solved])

  useEffect(() => {
    if (!solved || attemptSent.current || attemptInFlight.current) return

    attemptInFlight.current = true

    async function submitAttempt() {
      setAttemptStatus('We save the result...')
      setAttemptFailed(false)

      try {
        const response = await fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activityId: activity.id,
            studentName: studentName.trim() || 'Student',
            durationSeconds: 90 - seconds,
            accuracy,
          }),
        })

        if (!response.ok) throw new Error('The result has not yet been saved.')
        attemptSent.current = true
        setAttemptStatus('The result has been sent to the tutor.')
      } catch {
        setAttemptFailed(true)
        setAttemptStatus('The result has not been sent. Check the Internet and click “Resend”.')
      } finally {
        attemptInFlight.current = false
      }
    }

    void submitAttempt()
  }, [accuracy, activity.id, attemptRetryKey, seconds, solved, studentName])

  useEffect(() => {
    if (!solved || attemptSent.current) return
    const retryWhenOnline = () => {
      if (!attemptSent.current && !attemptInFlight.current) {
        setAttemptRetryKey((value) => value + 1)
      }
    }
    window.addEventListener('online', retryWhenOnline)
    return () => window.removeEventListener('online', retryWhenOnline)
  }, [solved])

  const verifyForce = () => {
    if (!forceLevel || !forceResult) return

    if (!answer.trim()) {
      setFeedback('Enter the answer to the equation. A vector without a solution is not counted.')
      return
    }

    if (forceResult.gateOpen) {
      setFeedback('Pass. The answer was correct, the vector was within tolerance, the experiment was completed.')
      return
    }

    if (!forceResult.answerCorrect) {
      setFeedback('The answer was not the same. Check the calculation of the unknown.')
      return
    }

    setFeedback(
      `The answer is correct, but the vector is out of tolerance: force on ${formatGap(forceResult.forceGap)} N, angle at ${formatGap(
        forceResult.angleGap,
      )}°.`,
    )
  }

  const snapToTarget = () => {
    if (!forceLevel) return
    setForce(forceLevel.targetForce)
    setAngle(forceLevel.targetAngle)
    setFeedback('The vector is on target. Now check the answer.')
  }

  const selectMistakeToken = (index: number) => {
    if (!mistakeLevel) return

    const nextResult = getMistakeArenaResult(mistakeLevel, index)
    setMistakeSelection(index)
    setFeedback(nextResult.correct ? mistakeLevel.explanation : `Fragment selected "${nextResult.selectedToken}". Search more precisely.`)
  }

  const connectMatchPair = (leftIndex: number, rightIndex: number) => {
    if (!matchLevel) return

    const left = matchLevel.pairs[leftIndex]
    const right = matchLevel.pairs[rightIndex]
    if (!left || !right) return

    const transition = transitionMatchPairsAttempt(
      matchLevel,
      { connections: matchConnections, attempts: matchAttempts },
      leftIndex,
      rightIndex,
    )

    if (transition.correct) setMatchConnections(transition.state.connections)
    setMatchAttempts(transition.state.attempts)

    setFeedback(
      transition.result.complete
        ? 'All pairs have been collected. The set is complete.'
        : transition.correct
          ? `Communication"${left.left}" → "${right.right}" faithful.`
          : `Communication"${left.left}" → "${right.right}"unfaithful.`,
    )
  }

  const placeGroupItem = (itemId: string, groupId: string) => {
    if (!groupLevel) return

    const nextPlacements = [
      ...groupPlacements.filter((placement) => placement.itemId !== itemId),
      { itemId, groupId },
    ].sort((first, second) => {
      return (
        groupLevel.items.findIndex((item) => item.id === first.itemId) -
        groupLevel.items.findIndex((item) => item.id === second.itemId)
      )
    })
    const nextResult = getGroupSortResult(groupLevel, nextPlacements)
    const item = groupLevel.items.find((candidate) => candidate.id === itemId)
    const group = groupLevel.groups.find((candidate) => candidate.id === groupId)

    setGroupPlacements(nextPlacements)

    setFeedback(
      nextResult.complete
        ? 'All cards are in the correct groups. The task is completed.'
        : item?.groupId === groupId
          ? `"${item?.label}"added to collection"${group?.title}".`
          : `"${item?.label}"not part of the collection"${group?.title}".`,
    )
  }

  const rejectGroupItem = (itemId: string, groupId: string) => {
    if (!groupLevel) return
    const item = groupLevel.items.find((candidate) => candidate.id === itemId)
    const group = groupLevel.groups.find((candidate) => candidate.id === groupId)
    setFeedback(
      `"${item?.label}"not part of the collection"${group?.title}". The card returned to the conveyor.`,
    )
  }

  const selectQuizAnswer = (optionIndex: number) => {
    if (!quizLevel) return

    const question = quizLevel.questions[quizQuestionIndex]
    if (!question || quizAnswers[quizQuestionIndex] !== null) return

    setQuizAnswers((value) => {
      const next = [...value]
      next[quizQuestionIndex] = optionIndex
      return next
    })
    setFeedback(
      optionIndex === question.correctIndex
        ? `Correct. ${question.explanation}`
        : `The answer didn't work. ${question.explanation}`,
    )
  }

  const advanceQuiz = () => {
    if (!quizLevel) return
    setQuizQuestionIndex((value) => Math.min(value + 1, quizLevel.questions.length - 1))
    setFeedback('The next question is open.')
  }

  const revealRecallCard = () => {
    if (!recallLevel || recallResult?.complete) return
    setRecallRevealed(true)
    setFeedback('The answer is open. Compare it with yours and choose self-esteem.')
  }

  const rateRecallCard = (rating: RecallRating) => {
    if (!recallLevel || !recallRevealed || recallRatings[recallCardIndex] !== null) return

    const nextRatings = [...recallRatings]
    nextRatings[recallCardIndex] = rating
    const nextResult = getRecallDeckResult(recallLevel, nextRatings)
    setRecallRatings(nextRatings)

    if (recallCardIndex < recallLevel.cards.length - 1) {
      setRecallCardIndex((value) => value + 1)
      setRecallRevealed(false)
      setFeedback(rating === 'remembered' ? 'Passed. The next card is revealed.' : 'The card is marked for repetition.')
      return
    }

    setFeedback(`Deck completed: ${nextResult.remembered} remembered ${nextResult.review} needs to be repeated.`)
  }

  return (
    <main className="student-shell" data-game-theme={getVisualThemeId(activity.level)}>
      <header className="student-top">
        <Link className="student-back" href="/studio">
          <ArrowLeft size={17} />
          Studio
        </Link>
        <div className="student-title">
          <span>{definition.renderer}</span>
          <h1>{activity.title}</h1>
          <small>
            {activity.level.subject} · {activity.level.grade}
          </small>
        </div>
        {matchLevel ? (
          <label className={gamePlayerLayoutStyles.studentName}>
            <span>Name</span>
            <input
              value={studentName}
              maxLength={80}
              disabled={solved}
              onChange={(event) => setStudentName(event.target.value)}
            />
          </label>
        ) : null}
        <div className="student-top-actions">
          <button type="button" className="ghost-button" onClick={() => setRunning((value) => !value)}>
            <Timer size={17} />
            {running ? 'Pause' : 'Start'}
          </button>
          {matchLevel ? (
            <button
              type="button"
              className="ghost-button"
              aria-pressed={!soundEnabled}
              aria-label={soundEnabled ? 'Mute' : 'Unmute'}
              onClick={() => setSoundEnabled((value) => !value)}
            >
              {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
              {soundEnabled ? 'Sound' : 'No sound'}
            </button>
          ) : null}
          {solved && attemptFailed ? (
            <button
              type="button"
              className="ghost-button"
              onClick={() => setAttemptRetryKey((value) => value + 1)}
            >
              <RotateCcw size={17} />
              Resend
            </button>
          ) : null}
          <button type="button" className="ghost-button" onClick={onReset}>
            <RotateCcw size={17} />
            Reset
          </button>
        </div>
      </header>

      <section className={immersiveGame
        ? `student-stage ${gamePlayerLayoutStyles.fullGame}`
        : 'student-stage'}>
        {!immersiveGame ? <SpotlightAside className="mission-panel student-mission" aria-label="Quest">
          <div className={`panel-heading ${activity.gameId === 'mistake-arena' ? 'danger' : ''}`}>
            {activity.gameId === 'force-lab' && <FlaskConical size={20} />}
            {activity.gameId === 'mistake-arena' && <CircleAlert size={20} />}
            {activity.gameId === 'match-pairs' && <Link2 size={20} />}
            {activity.gameId === 'group-sort' && <Boxes size={20} />}
            {activity.gameId === 'quiz-rush' && <HelpCircle size={20} />}
            {activity.gameId === 'recall-deck' && <Brain size={20} />}
            <div>
              <span>{definition.label}</span>
              <h2>{activity.level.title}</h2>
            </div>
          </div>

          <div className="mission-copy">
            <span>instructions</span>
            <p>{getPrompt(activity)}</p>
          </div>

          <label className="student-name-field">
            <span>Report name</span>
            <input
              value={studentName}
              maxLength={80}
              disabled={solved}
              onChange={(event) => setStudentName(event.target.value)}
            />
          </label>

          <p className={solved ? 'attempt-status success' : 'attempt-status'} role="status">
            {attemptStatus}
          </p>

          <div className="teacher-note">
            <strong>Methodology</strong>
            <p>{activity.level.teacherNote}</p>
          </div>
        </SpotlightAside> : null}

        <section className="playfield student-playfield" aria-label="Student game window">
          {!immersiveGame ? <ClickSparkLayer /> : null}
          {!immersiveGame ? <div className="hud">
            <div className={solved ? 'hud-item success' : 'hud-item'}>
              <Check size={16} />
              <span>{solved ? 'ready' : definition.description}</span>
            </div>
            <div className="hud-item">
              <Timer size={16} />
              <span>{seconds} sec</span>
            </div>
          </div> : null}

          {forceLevel && forceResult && (
            <ForceLabCanvas
              level={forceLevel}
              force={force}
              angle={angle}
              result={forceResult}
              running={running && !solved}
              answer={answer}
              onAnswerChange={setAnswer}
              onSnap={snapToTarget}
              onVerify={verifyForce}
              onVectorChange={(nextForce, nextAngle) => {
                setForce(nextForce)
                setAngle(nextAngle)
              }}
            />
          )}
          {mistakeLevel && mistakeResult && (
            <MistakeArenaCanvas
              level={mistakeLevel}
              result={mistakeResult}
              selectedIndex={mistakeSelection}
              running={running && !solved}
              onSelect={selectMistakeToken}
            />
          )}
          {matchLevel && matchResult && (
            <MatchPairsCanvas
              level={matchLevel}
              connections={matchConnections}
              result={matchResult}
              running={running && !solved}
              muted={!soundEnabled}
              resultStatus={attemptStatus}
              onConnect={connectMatchPair}
            />
          )}
          {groupLevel && groupResult && (
            <GroupSortCanvas
              level={groupLevel}
              placements={groupPlacements}
              result={groupResult}
              running={running && !solved}
              onPlace={placeGroupItem}
              onReject={rejectGroupItem}
            />
          )}
          {quizLevel && quizResult && (
            <QuizRushStage
              level={quizLevel}
              answers={quizAnswers}
              questionIndex={quizQuestionIndex}
              running={running && !solved}
              onSelect={selectQuizAnswer}
              onAdvance={advanceQuiz}
            />
          )}
          {recallLevel && recallResult && (
            <RecallDeckStage
              level={recallLevel}
              ratings={recallRatings}
              cardIndex={recallCardIndex}
              revealed={recallRevealed}
              running={running && !solved}
              onReveal={revealRecallCard}
              onRate={rateRecallCard}
            />
          )}

          {!immersiveGame ? <div className={solved ? 'feedback-bar success' : 'feedback-bar'}>
            <span>{feedback}</span>
          </div> : null}
        </section>

        {!immersiveGame ? <SpotlightAside className="control-panel student-panel" aria-label="Action bar">
          <StudentControls
            angle={angle}
            answer={answer}
            force={force}
            forceLevel={forceLevel}
            forceResult={forceResult}
            groupLevel={groupLevel}
            groupPlacements={groupPlacements}
            groupResult={groupResult}
            quizAnswers={quizAnswers}
            quizLevel={quizLevel}
            quizResult={quizResult}
            quizQuestionIndex={quizQuestionIndex}
            recallLevel={recallLevel}
            recallResult={recallResult}
            recallRatings={recallRatings}
            recallCardIndex={recallCardIndex}
            recallRevealed={recallRevealed}
            matchConnections={matchConnections}
            matchLevel={matchLevel}
            matchResult={matchResult}
            mistakeLevel={mistakeLevel}
            mistakeResult={mistakeResult}
            mistakeSelection={mistakeSelection}
            onAnswerChange={setAnswer}
            onAngleChange={setAngle}
            onForceChange={setForce}
            onSnap={snapToTarget}
            onVerifyForce={verifyForce}
          />
        </SpotlightAside> : null}
      </section>
    </main>
  )
}

function StudentControls({
  answer,
  force,
  angle,
  forceLevel,
  forceResult,
  mistakeLevel,
  mistakeResult,
  mistakeSelection,
  matchLevel,
  matchResult,
  matchConnections,
  groupLevel,
  groupResult,
  groupPlacements,
  quizLevel,
  quizResult,
  quizAnswers,
  quizQuestionIndex,
  recallLevel,
  recallResult,
  recallRatings,
  recallCardIndex,
  recallRevealed,
  onAnswerChange,
  onForceChange,
  onAngleChange,
  onSnap,
  onVerifyForce,
}: {
  answer: string
  force: number
  angle: number
  forceLevel: ForceLabLevel | null
  forceResult: ReturnType<typeof getBalanceResult> | null
  mistakeLevel: MistakeArenaLevel | null
  mistakeResult: ReturnType<typeof getMistakeArenaResult> | null
  mistakeSelection: number | null
  matchLevel: MatchPairsLevel | null
  matchResult: ReturnType<typeof getMatchPairsResult> | null
  matchConnections: MatchConnection[]
  groupLevel: GroupSortLevel | null
  groupResult: ReturnType<typeof getGroupSortResult> | null
  groupPlacements: GroupPlacement[]
  quizLevel: QuizRushLevel | null
  quizResult: ReturnType<typeof getQuizRushResult> | null
  quizAnswers: Array<number | null>
  quizQuestionIndex: number
  recallLevel: RecallDeckLevel | null
  recallResult: ReturnType<typeof getRecallDeckResult> | null
  recallRatings: Array<RecallRating | null>
  recallCardIndex: number
  recallRevealed: boolean
  onAnswerChange: (answer: string) => void
  onForceChange: (force: number) => void
  onAngleChange: (angle: number) => void
  onSnap: () => void
  onVerifyForce: () => void
}) {
  if (forceLevel && forceResult) {
    return (
      <>
        <div className="panel-heading compact">
          <Gauge size={20} />
          <div>
            <span>management</span>
            <h2>Vector F2</h2>
          </div>
        </div>

        <div className="equation-card student-equation">
          <span>equation</span>
          <strong>{forceLevel.equation}</strong>
          <label>
            {forceLevel.unknown} =
            <input
              aria-label="Answer"
              placeholder="answer"
              value={answer}
              onChange={(event) => onAnswerChange(event.target.value)}
            />
          </label>
        </div>

        <label className="range-row">
          <span>Strength: {force} N</span>
          <input type="range" min="1" max="18" value={force} onChange={(event) => onForceChange(Number(event.target.value))} />
        </label>
        <label className="range-row">
          <span>Angle: {angle}°</span>
          <input type="range" min="0" max="55" value={angle} onChange={(event) => onAngleChange(Number(event.target.value))} />
        </label>

        <button type="button" className="snap-button" onClick={onSnap}>
          <Target size={17} />
          Set a goal
        </button>
        <button type="button" className="primary-button" onClick={onVerifyForce}>
          <Check size={17} />
          Check
        </button>

        <div className="readout-grid">
          <div>
            <span>goal</span>
            <strong>{forceLevel.targetForce} N/ {forceLevel.targetAngle}°</strong>
          </div>
          <div>
            <span>accuracy</span>
            <strong>{forceResult.efficiency}%</strong>
          </div>
        </div>
      </>
    )
  }

  if (mistakeLevel && mistakeResult) {
    return (
      <>
        <div className="panel-heading compact danger">
          <CircleAlert size={20} />
          <div>
            <span>management</span>
            <h2>Error Scanner</h2>
          </div>
        </div>

        <div className="readout-grid">
          <div>
            <span>accuracy</span>
            <strong>{mistakeResult.accuracy}%</strong>
          </div>
          <div>
            <span>selected</span>
            <strong>{mistakeResult.hasSelection ? mistakeResult.selectedToken : '-'}</strong>
          </div>
        </div>

        <div className="mistake-box">
          <span>rule</span>
          <p>{mistakeLevel.rule}</p>
          {mistakeSelection !== null && <strong>{mistakeLevel.explanation}</strong>}
        </div>
      </>
    )
  }

  if (matchLevel && matchResult) {
    return (
      <>
        <div className="panel-heading compact match">
          <Link2 size={20} />
          <div>
            <span>management</span>
            <h2>Connections</h2>
          </div>
        </div>

        <div className="readout-grid">
          <div>
            <span>collected</span>
            <strong>{matchResult.connected}/{matchResult.total}</strong>
          </div>
          <div>
            <span>right</span>
            <strong>{matchResult.correct}/{matchResult.total}</strong>
          </div>
        </div>

        <div className="match-list">
          <span>current connections</span>
          {matchConnections.length === 0 ? (
            <p>Draw a line from the left card to the right.</p>
          ) : (
            matchConnections.map((connection) => {
              const left = matchLevel.pairs[connection.leftIndex]
              const right = matchLevel.pairs[connection.rightIndex]
              if (!left || !right) return null

              return (
                <div className={left.id === right.id ? 'match-row correct' : 'match-row wrong'} key={left.id}>
                  <strong>{left.left}</strong>
                  <small>{right.right}</small>
                </div>
              )
            })
          )}
        </div>
      </>
    )
  }

  if (groupLevel && groupResult) {
    return (
      <>
        <div className="panel-heading compact group">
          <Boxes size={20} />
          <div>
            <span>management</span>
            <h2>Groups</h2>
          </div>
        </div>

        <div className="readout-grid">
          <div>
            <span>posted</span>
            <strong>{groupResult.placed}/{groupResult.total}</strong>
          </div>
          <div>
            <span>right</span>
            <strong>{groupResult.correct}/{groupResult.total}</strong>
          </div>
        </div>

        <div className="group-list">
          <span>placement</span>
          {groupPlacements.length === 0 ? (
            <p>Drag the card from the conveyor to one of the stations.</p>
          ) : (
            groupPlacements.map((placement) => {
              const item = groupLevel.items.find((candidate) => candidate.id === placement.itemId)
              const group = groupLevel.groups.find((candidate) => candidate.id === placement.groupId)
              if (!item || !group) return null

              return (
                <div className={item.groupId === group.id ? 'group-row correct' : 'group-row wrong'} key={item.id}>
                  <strong>{item.label}</strong>
                  <small>{group.title}</small>
                </div>
              )
            })
          )}
        </div>
      </>
    )
  }

  if (quizLevel && quizResult) {
    const currentAnswer = quizAnswers[quizQuestionIndex]
    const currentQuestion = quizLevel.questions[quizQuestionIndex]

    return (
      <>
        <div className="panel-heading compact quiz">
          <HelpCircle size={20} />
          <div>
            <span>management</span>
            <h2>Blitz quiz</h2>
          </div>
        </div>

        <div className="readout-grid">
          <div>
            <span>answered</span>
            <strong>{quizResult.answered}/{quizResult.total}</strong>
          </div>
          <div>
            <span>right</span>
            <strong>{quizResult.correct}/{quizResult.total}</strong>
          </div>
          <div>
            <span>accuracy</span>
            <strong>{quizResult.accuracy}%</strong>
          </div>
          <div>
            <span>question</span>
            <strong>{quizQuestionIndex + 1}/{quizResult.total}</strong>
          </div>
        </div>

        <div className="mistake-box quiz-summary">
          <span>current answer</span>
          <p>
            {currentAnswer === null || currentAnswer === undefined
              ? 'Select an option in the game scene.'
              : currentQuestion?.options[currentAnswer]}
          </p>
          {currentAnswer !== null && currentAnswer !== undefined && currentQuestion && (
            <strong>{currentQuestion.explanation}</strong>
          )}
        </div>
      </>
    )
  }

  if (recallLevel && recallResult) {
    const currentCard = recallLevel.cards[recallCardIndex]
    const currentRating = recallRatings[recallCardIndex]

    return (
      <>
        <div className="panel-heading compact recall">
          <Brain size={20} />
          <div>
            <span>management</span>
            <h2>Memory deck</h2>
          </div>
        </div>

        <div className="readout-grid">
          <div>
            <span>appreciated</span>
            <strong>{recallResult.rated}/{recallResult.total}</strong>
          </div>
          <div>
            <span>remembered</span>
            <strong>{recallResult.remembered}/{recallResult.total}</strong>
          </div>
          <div>
            <span>repeat</span>
            <strong>{recallResult.review}</strong>
          </div>
          <div>
            <span>card</span>
            <strong>{recallCardIndex + 1}/{recallResult.total}</strong>
          </div>
        </div>

        <div className="mistake-box recall-summary">
          <span>current card</span>
          <p>{currentCard?.front}</p>
          {recallRevealed && currentCard && <strong>{currentCard.back}</strong>}
          {currentRating && <strong>{currentRating === 'remembered' ? 'Remembered' : 'Need to repeat'}</strong>}
        </div>
      </>
    )
  }

  return null
}

function getPrompt(activity: SavedEditorActivity) {
  if (activity.gameId === 'force-lab') return (activity.level as ForceLabLevel).lesson
  if (activity.gameId === 'mistake-arena') return (activity.level as MistakeArenaLevel).prompt
  if (activity.gameId === 'match-pairs') return (activity.level as MatchPairsLevel).prompt
  if (activity.gameId === 'group-sort') return (activity.level as GroupSortLevel).prompt
  if (activity.gameId === 'quiz-rush') return (activity.level as QuizRushLevel).prompt
  return (activity.level as RecallDeckLevel).prompt
}
