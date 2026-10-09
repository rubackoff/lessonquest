'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Brain,
  Boxes,
  Check,
  CircleAlert,
  ClipboardCheck,
  Crosshair,
  FlaskConical,
  Gamepad2,
  Gauge,
  HelpCircle,
  Pause,
  PencilLine,
  Play,
  RotateCcw,
  Target,
  Timer,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { ActivityEditor } from '@/components/activity-editor'
import { ForceLabCanvas } from '@/components/games/force-lab'
import gamePlayerLayoutStyles from '@/components/game-runtime/game-player-layout.module.css'
import { GroupSortCanvas } from '@/components/games/group-sort'
import { MatchPairsCanvas } from '@/components/match-pairs-canvas'
import { MistakeArenaCanvas } from '@/components/games/mistake-arena'
import { QuizRushStage } from '@/components/games/quiz-rush'
import { RecallDeckStage } from '@/components/games/recall-deck'
import {
  activities,
  awardScore,
  completeOnce,
  createEmptyCompletionState,
  getActivityDefinition,
  hasCompleted,
  type GameId,
} from '@/lib/activity-runtime'
import { type EditableLevel } from '@/lib/editor-runtime'
import { forceLabLevels, formatGap, getBalanceResult, type ForceLabLevel } from '@/lib/force-lab'
import { transitionMatchPairsAttempt } from '@/lib/game-session/match-pairs-session'
import {
  getGroupSortResult,
  groupSortLevels,
  type GroupPlacement,
  type GroupSortLevel,
} from '@/lib/group-sort'
import {
  getMatchPairsResult,
  matchPairsLevels,
  type MatchConnection,
  type MatchPairsLevel,
} from '@/lib/match-pairs'
import {
  getMistakeArenaResult,
  mistakeArenaLevels,
  type MistakeArenaLevel,
} from '@/lib/mistake-arena'
import {
  createEmptyQuizAnswers,
  getQuizRushResult,
  quizRushLevels,
  type QuizRushLevel,
} from '@/lib/quiz-rush'
import {
  createEmptyRecallRatings,
  getRecallDeckResult,
  recallDeckLevels,
  type RecallDeckLevel,
  type RecallRating,
} from '@/lib/recall-deck'
import { getVisualThemeId } from '@/lib/visual-themes'

type PlayableLevelOverrides = Partial<{
  'force-lab': ForceLabLevel
  'mistake-arena': MistakeArenaLevel
  'match-pairs': MatchPairsLevel
  'group-sort': GroupSortLevel
  'quiz-rush': QuizRushLevel
  'recall-deck': RecallDeckLevel
}>

export function LearningStudio() {
  const [workspaceMode, setWorkspaceMode] = useState<'play' | 'create'>('play')
  const [activeGame, setActiveGame] = useState<GameId>('force-lab')
  const [playableOverrides, setPlayableOverrides] = useState<PlayableLevelOverrides>({})
  const [forceLevelIndex, setForceLevelIndex] = useState(0)
  const [force, setForce] = useState(5)
  const [angle, setAngle] = useState(18)
  const [answer, setAnswer] = useState('')
  const [mistakeLevelIndex, setMistakeLevelIndex] = useState(0)
  const [mistakeSelection, setMistakeSelection] = useState<number | null>(null)
  const [matchLevelIndex, setMatchLevelIndex] = useState(0)
  const [matchConnections, setMatchConnections] = useState<MatchConnection[]>([])
  const [matchAttempts, setMatchAttempts] = useState(0)
  const [matchSessionRevision, setMatchSessionRevision] = useState(0)
  const [groupLevelIndex, setGroupLevelIndex] = useState(0)
  const [groupPlacements, setGroupPlacements] = useState<GroupPlacement[]>([])
  const [quizLevelIndex, setQuizLevelIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Array<number | null>>(() => createEmptyQuizAnswers(quizRushLevels[0]))
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0)
  const [recallLevelIndex, setRecallLevelIndex] = useState(0)
  const [recallRatings, setRecallRatings] = useState<Array<RecallRating | null>>(() => createEmptyRecallRatings(recallDeckLevels[0]))
  const [recallCardIndex, setRecallCardIndex] = useState(0)
  const [recallRevealed, setRecallRevealed] = useState(false)
  const [completedLevels, setCompletedLevels] = useState(createEmptyCompletionState)
  const awardedLevelsRef = useRef(new Set<string>())
  const [score, setScore] = useState(0)
  const [seconds, setSeconds] = useState(90)
  const [running, setRunning] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const sessionActive = running && seconds > 0
  const [feedback, setFeedback] = useState('Drag the blue vector directly into the scene, then solve the equation.')

  const activeActivity = getActivityDefinition(activeGame)
  const forceLevels = useMemo(
    () => (playableOverrides['force-lab'] ? [playableOverrides['force-lab'], ...forceLabLevels] : forceLabLevels),
    [playableOverrides],
  )
  const mistakeLevels = useMemo(
    () =>
      playableOverrides['mistake-arena']
        ? [playableOverrides['mistake-arena'], ...mistakeArenaLevels]
        : mistakeArenaLevels,
    [playableOverrides],
  )
  const matchLevels = useMemo(
    () =>
      playableOverrides['match-pairs']
        ? [playableOverrides['match-pairs'], ...matchPairsLevels]
        : matchPairsLevels,
    [playableOverrides],
  )
  const groupLevels = useMemo(
    () =>
      playableOverrides['group-sort']
        ? [playableOverrides['group-sort'], ...groupSortLevels]
        : groupSortLevels,
    [playableOverrides],
  )
  const quizLevels = useMemo(
    () =>
      playableOverrides['quiz-rush']
        ? [playableOverrides['quiz-rush'], ...quizRushLevels]
        : quizRushLevels,
    [playableOverrides],
  )
  const recallLevels = useMemo(
    () =>
      playableOverrides['recall-deck']
        ? [playableOverrides['recall-deck'], ...recallDeckLevels]
        : recallDeckLevels,
    [playableOverrides],
  )
  const forceLevel = forceLevels[forceLevelIndex] ?? forceLevels[0]
  const forceResult = useMemo(
    () => getBalanceResult(forceLevel, { force, angle }, answer),
    [forceLevel, force, angle, answer],
  )
  const mistakeLevel = mistakeLevels[mistakeLevelIndex] ?? mistakeLevels[0]
  const mistakeResult = useMemo(
    () => getMistakeArenaResult(mistakeLevel, mistakeSelection),
    [mistakeLevel, mistakeSelection],
  )
  const matchLevel = matchLevels[matchLevelIndex] ?? matchLevels[0]
  const matchResult = useMemo(
    () => getMatchPairsResult(matchLevel, matchConnections, matchAttempts),
    [matchAttempts, matchLevel, matchConnections],
  )
  const groupLevel = groupLevels[groupLevelIndex] ?? groupLevels[0]
  const groupResult = useMemo(
    () => getGroupSortResult(groupLevel, groupPlacements),
    [groupLevel, groupPlacements],
  )
  const quizLevel = quizLevels[quizLevelIndex] ?? quizLevels[0]
  const quizResult = useMemo(
    () => getQuizRushResult(quizLevel, quizAnswers),
    [quizAnswers, quizLevel],
  )
  const recallLevel = recallLevels[recallLevelIndex] ?? recallLevels[0]
  const activeVisualTheme = getVisualThemeId(
    activeGame === 'force-lab'
      ? forceLevel
      : activeGame === 'mistake-arena'
        ? mistakeLevel
        : activeGame === 'match-pairs'
          ? matchLevel
          : activeGame === 'group-sort'
            ? groupLevel
            : activeGame === 'quiz-rush'
              ? quizLevel
              : recallLevel,
  )
  const recallResult = useMemo(
    () => getRecallDeckResult(recallLevel, recallRatings),
    [recallLevel, recallRatings],
  )
  const activeSolved =
    activeGame === 'force-lab'
      ? forceResult.gateOpen
      : activeGame === 'mistake-arena'
        ? mistakeResult.correct
        : activeGame === 'match-pairs'
          ? matchResult.complete
          : activeGame === 'group-sort'
            ? groupResult.complete
            : activeGame === 'quiz-rush'
              ? quizResult.complete
              : recallResult.complete
  const forceAlreadyCompleted = hasCompleted(completedLevels, 'force-lab', forceLevel.id)
  const mistakeAlreadyCompleted = hasCompleted(completedLevels, 'mistake-arena', mistakeLevel.id)
  const matchAlreadyCompleted = hasCompleted(completedLevels, 'match-pairs', matchLevel.id)
  const groupAlreadyCompleted = hasCompleted(completedLevels, 'group-sort', groupLevel.id)
  const quizAlreadyCompleted = hasCompleted(completedLevels, 'quiz-rush', quizLevel.id)
  const recallAlreadyCompleted = hasCompleted(completedLevels, 'recall-deck', recallLevel.id)

  useEffect(() => {
    if (!sessionActive || activeSolved || workspaceMode !== 'play') return

    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [sessionActive, activeSolved, workspaceMode])

  useEffect(() => {
    if (!running || seconds > 0) return
    const timer = window.setTimeout(() => {
      setRunning(false)
      setFeedback('The session time has expired. Start a new session to continue.')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [running, seconds])

  const selectGame = (id: GameId) => {
    setActiveGame(id)
    setFeedback(getActivityDefinition(id).activeFeedback)
  }

  const testEditableLevel = (gameId: GameId, level: EditableLevel) => {
    setPlayableOverrides((value) => ({ ...value, [gameId]: level }))
    setActiveGame(gameId)
    setWorkspaceMode('play')
    setSeconds(90)
    setRunning(true)
    setCompletedLevels(createEmptyCompletionState())
    awardedLevelsRef.current.clear()

    if (gameId === 'force-lab') {
      const nextLevel = level as ForceLabLevel
      setForceLevelIndex(0)
      setForce(Math.max(1, nextLevel.targetForce - 3))
      setAngle(Math.max(0, nextLevel.targetAngle - 8))
      setAnswer('')
    }

    if (gameId === 'mistake-arena') {
      setMistakeLevelIndex(0)
      setMistakeSelection(null)
    }

    if (gameId === 'match-pairs') {
      setMatchLevelIndex(0)
      setMatchConnections([])
      setMatchAttempts(0)
      setMatchSessionRevision((value) => value + 1)
    }

    if (gameId === 'group-sort') {
      setGroupLevelIndex(0)
      setGroupPlacements([])
    }

    if (gameId === 'quiz-rush') {
      const nextLevel = level as QuizRushLevel
      setQuizLevelIndex(0)
      setQuizAnswers(createEmptyQuizAnswers(nextLevel))
      setQuizQuestionIndex(0)
    }

    if (gameId === 'recall-deck') {
      const nextLevel = level as RecallDeckLevel
      setRecallLevelIndex(0)
      setRecallRatings(createEmptyRecallRatings(nextLevel))
      setRecallCardIndex(0)
      setRecallRevealed(false)
    }

    setFeedback(`Draft test started: ${level.title}`)
  }

  const awardActivityScore = (activityId: GameId, levelId: number) => {
    const key = `${activityId}:${levelId}`
    if (awardedLevelsRef.current.has(key)) return
    awardedLevelsRef.current.add(key)
    const activity = getActivityDefinition(activityId)

    setScore((value) => value + awardScore(activity.baseScore, seconds))
  }

  const chooseForceLevel = (index: number) => {
    const nextLevel = forceLevels[index]
    if (!nextLevel) return

    setForceLevelIndex(index)
    setForce(Math.max(1, nextLevel.targetForce - 3))
    setAngle(Math.max(0, nextLevel.targetAngle - 8))
    setAnswer('')
    setFeedback('New level has been loaded. First find a solution, then calibrate the vector.')
  }

  const chooseMistakeLevel = (index: number) => {
    if (!mistakeLevels[index]) return

    setMistakeLevelIndex(index)
    setMistakeSelection(null)
    setFeedback('A new error has been uploaded. Select the problematic fragment directly from the recording.')
  }

  const chooseMatchLevel = (index: number) => {
    if (!matchLevels[index]) return

    setMatchLevelIndex(index)
    setMatchConnections([])
    setMatchAttempts(0)
    setMatchSessionRevision((value) => value + 1)
    setFeedback('A new set of pairs has been uploaded. Connect the cards with lines right on the stage.')
  }

  const chooseGroupLevel = (index: number) => {
    if (!groupLevels[index]) return

    setGroupLevelIndex(index)
    setGroupPlacements([])
    setFeedback('A new set of groups has been uploaded. Drag the cards to the appropriate stations.')
  }

  const chooseQuizLevel = (index: number) => {
    const nextLevel = quizLevels[index]
    if (!nextLevel) return

    setQuizLevelIndex(index)
    setQuizAnswers(createEmptyQuizAnswers(nextLevel))
    setQuizQuestionIndex(0)
    setFeedback('A new quiz has been uploaded. Choose an answer and understand the explanation.')
  }

  const chooseRecallLevel = (index: number) => {
    const nextLevel = recallLevels[index]
    if (!nextLevel) return

    setRecallLevelIndex(index)
    setRecallRatings(createEmptyRecallRatings(nextLevel))
    setRecallCardIndex(0)
    setRecallRevealed(false)
    setFeedback('New deck loaded. First remember the answer, then open the card.')
  }

  const verifyForce = () => {
    if (!running || seconds === 0) return
    if (!answer.trim()) {
      setFeedback('We need the answer in the equation field. A vector without a solution is not counted.')
      return
    }

    if (forceResult.gateOpen) {
      if (!forceAlreadyCompleted) {
        setCompletedLevels((value) => completeOnce(value, 'force-lab', forceLevel.id))
        awardActivityScore('force-lab', forceLevel.id)
      }
      setFeedback(
        forceAlreadyCompleted
          ? 'This level has already been completed. Proceed further, the account will not be credited again.'
          : 'Pass. The answer is correct, the vector coincided with the goal, the gate opened.',
      )
      return
    }

    if (!forceResult.answerCorrect) {
      setFeedback('The answer was not the same. Check the transfer of terms and the calculation of the unknown.')
      return
    }

    setFeedback(
      `The answer is correct, but the vector is not within the tolerance: the force differs by ${formatGap(
        forceResult.forceGap,
      )} N, angle at ${formatGap(forceResult.angleGap)}°.`,
    )
  }

  const selectMistakeToken = (index: number) => {
    if (!running || seconds === 0) return
    const nextResult = getMistakeArenaResult(mistakeLevel, index)
    setMistakeSelection(index)

    if (nextResult.correct) {
      if (!mistakeAlreadyCompleted) {
        setCompletedLevels((value) => completeOnce(value, 'mistake-arena', mistakeLevel.id))
        awardActivityScore('mistake-arena', mistakeLevel.id)
      }
      setFeedback(
        mistakeAlreadyCompleted
          ? 'This error has already been corrected. Clicking again does not increase the score.'
          : 'An error was found: the wrong record fragment was selected.',
      )
      return
    }

    setFeedback(`Token selected "${nextResult.selectedToken}". This is not the main place of error.`)
  }

  const connectMatchPair = (leftIndex: number, rightIndex: number) => {
    if (!running || seconds === 0) return
    const left = matchLevel.pairs[leftIndex]
    const right = matchLevel.pairs[rightIndex]
    const transition = transitionMatchPairsAttempt(
      matchLevel,
      { connections: matchConnections, attempts: matchAttempts },
      leftIndex,
      rightIndex,
    )

    if (transition.correct) setMatchConnections(transition.state.connections)
    setMatchAttempts(transition.state.attempts)

    if (transition.result.complete) {
      if (!matchAlreadyCompleted) {
        setCompletedLevels((value) => completeOnce(value, 'match-pairs', matchLevel.id))
        awardActivityScore('match-pairs', matchLevel.id)
      }
      setFeedback(
        matchAlreadyCompleted
          ? 'This set has already been credited. Repeated connections do not increase your score.'
          : 'All pairs are collected: the complete set of connections is correct.',
      )
      return
    }

    setFeedback(
      transition.correct
        ? `Communication"${left?.left}" → "${right?.right}" faithful.`
        : `Communication"${left?.left}" → "${right?.right}" is incorrect, the line is highlighted in red.`,
    )
  }

  const placeGroupItem = (itemId: string, groupId: string) => {
    if (!running || seconds === 0) return
    const nextPlacements = [
      ...groupPlacements.filter((placement) => placement.itemId !== itemId),
      { itemId, groupId },
    ].sort((first, second) => {
      return (
        groupLevel.items.findIndex((item) => item.id === first.itemId) -
        groupLevel.items.findIndex((item) => item.id === second.itemId)
      )
    })
    const item = groupLevel.items.find((candidate) => candidate.id === itemId)
    const group = groupLevel.groups.find((candidate) => candidate.id === groupId)
    const correct = item?.groupId === groupId
    const nextResult = getGroupSortResult(groupLevel, nextPlacements)

    setGroupPlacements(nextPlacements)

    if (nextResult.complete) {
      if (!groupAlreadyCompleted) {
        setCompletedLevels((value) => completeOnce(value, 'group-sort', groupLevel.id))
        awardActivityScore('group-sort', groupLevel.id)
      }
      setFeedback(
        groupAlreadyCompleted
          ? 'This set of groups has already been credited. Re-posting does not increase your score.'
          : 'All groups have been collected: the classification has been completed completely.',
      )
      return
    }

    setFeedback(
      correct
        ? `"${item?.label}"added to collection"${group?.title}".`
        : `"${item?.label}"not part of the collection"${group?.title}".`,
    )
  }

  const rejectGroupItem = (itemId: string, groupId: string) => {
    const item = groupLevel.items.find((candidate) => candidate.id === itemId)
    const group = groupLevel.groups.find((candidate) => candidate.id === groupId)
    setFeedback(
      `"${item?.label}"not part of the collection"${group?.title}". The card returned to the conveyor.`,
    )
  }

  const selectQuizAnswer = (optionIndex: number) => {
    if (!running || seconds === 0) return
    const question = quizLevel.questions[quizQuestionIndex]
    if (!question || quizAnswers[quizQuestionIndex] !== null) return

    const nextAnswers = [...quizAnswers]
    nextAnswers[quizQuestionIndex] = optionIndex
    const nextResult = getQuizRushResult(quizLevel, nextAnswers)
    setQuizAnswers(nextAnswers)

    if (nextResult.complete && !quizAlreadyCompleted) {
      setCompletedLevels((value) => completeOnce(value, 'quiz-rush', quizLevel.id))
      awardActivityScore('quiz-rush', quizLevel.id)
    }

    setFeedback(
      optionIndex === question.correctIndex
        ? `Correct. ${question.explanation}`
        : `The answer didn't work. ${question.explanation}`,
    )
  }

  const advanceQuizQuestion = () => {
    if (!running || seconds === 0) return
    if (quizAnswers[quizQuestionIndex] === null) {
      setFeedback('First, select an answer to the current question.')
      return
    }

    if (quizQuestionIndex < quizLevel.questions.length - 1) {
      setQuizQuestionIndex((value) => value + 1)
      setFeedback('The next question is open.')
      return
    }

    chooseQuizLevel((quizLevelIndex + 1) % quizLevels.length)
  }

  const revealRecallCard = () => {
    if (!running || seconds === 0) return
    if (recallResult.complete) return
    setRecallRevealed(true)
    setFeedback('The answer is open. Compare it with yours and choose an honest self-assessment.')
  }

  const rateRecallCard = (rating: RecallRating) => {
    if (!running || seconds === 0) return
    if (!recallRevealed || recallRatings[recallCardIndex] !== null) return

    const nextRatings = [...recallRatings]
    nextRatings[recallCardIndex] = rating
    const nextResult = getRecallDeckResult(recallLevel, nextRatings)
    setRecallRatings(nextRatings)

    if (nextResult.complete && !recallAlreadyCompleted) {
      setCompletedLevels((value) => completeOnce(value, 'recall-deck', recallLevel.id))
      awardActivityScore('recall-deck', recallLevel.id)
    }

    if (recallCardIndex < recallLevel.cards.length - 1) {
      setRecallCardIndex((value) => value + 1)
      setRecallRevealed(false)
      setFeedback(rating === 'remembered' ? 'Passed. The next card is revealed.' : 'The card is marked for repetition.')
      return
    }

    setFeedback(`Deck completed: ${nextResult.remembered} remembered ${nextResult.review} needs to be repeated.`)
  }

  const snapToTarget = () => {
    setForce(forceLevel.targetForce)
    setAngle(forceLevel.targetAngle)
    setFeedback('The vector is on target. Now check that the solution to the equation is also correct.')
  }

  const reset = () => {
    setForce(5)
    setAngle(18)
    setAnswer('')
    setMistakeSelection(null)
    setMatchConnections([])
    setMatchAttempts(0)
    setMatchSessionRevision((value) => value + 1)
    setGroupPlacements([])
    setQuizAnswers(createEmptyQuizAnswers(quizLevel))
    setQuizQuestionIndex(0)
    setRecallRatings(createEmptyRecallRatings(recallLevel))
    setRecallCardIndex(0)
    setRecallRevealed(false)
    setCompletedLevels(createEmptyCompletionState())
    awardedLevelsRef.current.clear()
    setScore(0)
    setSeconds(90)
    setRunning(true)
    setFeedback('Reset completed. Levels have not changed, attempts and scores have been cleared.')
  }

  const nextLevel = () => {
    if (activeGame === 'force-lab') {
      chooseForceLevel((forceLevelIndex + 1) % forceLevels.length)
      return
    }

    if (activeGame === 'mistake-arena') {
      chooseMistakeLevel((mistakeLevelIndex + 1) % mistakeLevels.length)
      return
    }

    if (activeGame === 'match-pairs') {
      chooseMatchLevel((matchLevelIndex + 1) % matchLevels.length)
      return
    }

    if (activeGame === 'group-sort') {
      chooseGroupLevel((groupLevelIndex + 1) % groupLevels.length)
      return
    }

    if (activeGame === 'quiz-rush') {
      chooseQuizLevel((quizLevelIndex + 1) % quizLevels.length)
      return
    }

    chooseRecallLevel((recallLevelIndex + 1) % recallLevels.length)
  }

  const primaryAction = () => {
    if (activeGame === 'force-lab') {
      verifyForce()
      return
    }

    if (activeGame === 'quiz-rush') {
      advanceQuizQuestion()
      return
    }

    if (activeGame === 'recall-deck') {
      revealRecallCard()
      return
    }

    nextLevel()
  }

  return (
    <main className="lab-shell" data-workspace-mode={workspaceMode}>
      <header className="top-bar">
        <Link className="lab-brand" href="/" aria-label="Open light exercise equipment">
          <span className="brand-mark">N</span>
          <div>
            <strong>LessonQuest Studio</strong>
            <small>{activities.length} game modes · tutor constructor</small>
          </div>
        </Link>

        <Link className="ghost-button top-link" href="/profile">Personal account</Link>
        <div className="mode-switch" aria-label="Operating mode">
          <button
            type="button"
            className={workspaceMode === 'play' ? 'active' : ''}
            onClick={() => setWorkspaceMode('play')}
          >
            <Gamepad2 size={16} />
            Play
          </button>
          <button
            type="button"
            className={workspaceMode === 'create' ? 'active' : ''}
            onClick={() => setWorkspaceMode('create')}
          >
            <PencilLine size={16} />
            Create
          </button>
        </div>

        <nav className="game-switch" aria-label="Game selection">
          {activities.map((game) => (
            <button
              key={game.id}
              type="button"
              className={activeGame === game.id ? 'game-tab active' : 'game-tab'}
              onClick={() => selectGame(game.id)}
            >
              <strong>{game.label}</strong>
              <span>{game.description}</span>
            </button>
          ))}
        </nav>

        {workspaceMode === 'play' ? (
          <div className="top-actions">
            <span className="studio-session-metric" role="timer" aria-label="Session time" data-finished={seconds === 0}>
              <Timer size={16} />
              {seconds === 0 ? 'Time\'s up' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}
            </span>
            <output className="studio-session-metric" aria-label="Session points"><Target size={16} />{score}</output>
            <Link className="ghost-button top-link" href="/">
              Light exercise equipment
            </Link>
            <button type="button" className="ghost-button" onClick={() => seconds === 0 ? reset() : setRunning((value) => !value)}>
              {seconds === 0 ? <RotateCcw size={17} /> : running ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
              {seconds === 0 ? 'New session' : running ? 'Pause' : 'Start'}
            </button>
            {activeGame === 'match-pairs' ? (
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
            <button type="button" className="ghost-button" onClick={reset}>
              <RotateCcw size={17} />
              Reset
            </button>
            <button type="button" className="primary-button" disabled={!running || seconds === 0} onClick={primaryAction}>
              <Check size={17} />
              {activeActivity.primaryActionLabel}
            </button>
          </div>
        ) : (
          <div className="top-actions">
            <Link className="ghost-button top-link" href="/">
              Light exercise equipment
            </Link>
            <button type="button" className="primary-button" onClick={() => setWorkspaceMode('play')}>
              <Gamepad2 size={17} />
              Play
            </button>
          </div>
        )}
      </header>

      {workspaceMode === 'create' ? (
        <ActivityEditor
          activeGame={activeGame}
          onSelectGame={selectGame}
          onTestLevel={testEditableLevel}
        />
      ) : (
        <section
          className={activeGame === 'match-pairs'
            ? `game-layout ${gamePlayerLayoutStyles.fullGame}`
            : 'game-layout'}
          data-game-theme={activeVisualTheme}
        >
        {activeGame === 'match-pairs' ? null : activeGame === 'force-lab' ? (
          <ForceMissionPanel
            answer={answer}
            level={forceLevel}
            levels={forceLevels}
            levelIndex={forceLevelIndex}
            onAnswerChange={setAnswer}
            onLevelChange={chooseForceLevel}
          />
        ) : activeGame === 'mistake-arena' ? (
          <MistakeMissionPanel
            level={mistakeLevel}
            levels={mistakeLevels}
            levelIndex={mistakeLevelIndex}
            onLevelChange={chooseMistakeLevel}
          />
        ) : activeGame === 'group-sort' ? (
          <GroupMissionPanel
            level={groupLevel}
            levels={groupLevels}
            levelIndex={groupLevelIndex}
            onLevelChange={chooseGroupLevel}
          />
        ) : activeGame === 'quiz-rush' ? (
          <QuizMissionPanel
            level={quizLevel}
            levels={quizLevels}
            levelIndex={quizLevelIndex}
            onLevelChange={chooseQuizLevel}
          />
        ) : (
          <RecallMissionPanel
            level={recallLevel}
            levels={recallLevels}
            levelIndex={recallLevelIndex}
            onLevelChange={chooseRecallLevel}
          />
        )}

        <section className="playfield" aria-label="Game window">
          {activeGame !== 'match-pairs' ? <div className="hud">
            <div className="hud-item">
              <Timer size={16} />
              <span>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
            </div>
            <div className="hud-item">
              <Target size={16} />
              <span>{score}</span>
            </div>
            <div className={activeSolved ? 'hud-item success' : 'hud-item'}>
              <Crosshair size={16} />
              <span>
                {activeGame === 'force-lab'
                  ? forceResult.gateOpen
                    ? 'the gate is open'
                    : `${forceResult.efficiency}% accuracy`
                  : activeGame === 'mistake-arena'
                    ? mistakeResult.correct
                      ? 'error found'
                      : mistakeResult.status
                    : activeGame === 'group-sort'
                      ? groupResult.status
                      : activeGame === 'quiz-rush'
                        ? quizResult.status
                        : recallResult.status}
              </span>
            </div>
          </div> : null}

          {activeGame === 'force-lab' ? (
            <ForceLabCanvas
              level={forceLevel}
              force={force}
              angle={angle}
              result={forceResult}
              running={sessionActive}
              onVectorChange={(nextForce, nextAngle) => {
                setForce(nextForce)
                setAngle(nextAngle)
                setFeedback('Vector F2 has been changed. Align the pen with the magnetic target and check the answer.')
              }}
            />
          ) : activeGame === 'mistake-arena' ? (
            <MistakeArenaCanvas
              level={mistakeLevel}
              result={mistakeResult}
              selectedIndex={mistakeSelection}
              running={sessionActive}
              onSelect={selectMistakeToken}
            />
          ) : activeGame === 'match-pairs' ? (
            <MatchPairsCanvas
              level={matchLevel}
              connections={matchConnections}
              result={matchResult}
              running={sessionActive}
              muted={!soundEnabled}
              sessionRevision={matchSessionRevision}
              onConnect={connectMatchPair}
            />
          ) : activeGame === 'group-sort' ? (
            <GroupSortCanvas
              level={groupLevel}
              placements={groupPlacements}
              result={groupResult}
              running={sessionActive}
              onPlace={placeGroupItem}
              onReject={rejectGroupItem}
            />
          ) : activeGame === 'quiz-rush' ? (
            <QuizRushStage
              level={quizLevel}
              answers={quizAnswers}
              questionIndex={quizQuestionIndex}
              running={sessionActive}
              onSelect={selectQuizAnswer}
              onAdvance={advanceQuizQuestion}
            />
          ) : (
            <RecallDeckStage
              level={recallLevel}
              ratings={recallRatings}
              cardIndex={recallCardIndex}
              revealed={recallRevealed}
              running={sessionActive}
              onReveal={revealRecallCard}
              onRate={rateRecallCard}
            />
          )}

          {activeGame !== 'match-pairs' ? <div className={activeSolved ? 'feedback-bar success' : 'feedback-bar'}>
            <span>{feedback}</span>
            {(activeGame !== 'recall-deck' || recallResult.complete) && (
              <button type="button" onClick={nextLevel}>
                {activeActivity.nextLevelLabel}
                <ArrowRight size={16} />
              </button>
            )}
          </div> : null}
        </section>

        {activeGame === 'match-pairs' ? null : activeGame === 'force-lab' ? (
          <ForceControlPanel
            angle={angle}
            force={force}
            level={forceLevel}
            result={forceResult}
            onAngleChange={setAngle}
            onForceChange={setForce}
            onSnap={snapToTarget}
          />
        ) : activeGame === 'mistake-arena' ? (
          <MistakeControlPanel
            level={mistakeLevel}
            result={mistakeResult}
            selectedIndex={mistakeSelection}
            onNext={nextLevel}
          />
        ) : activeGame === 'group-sort' ? (
          <GroupControlPanel
            level={groupLevel}
            result={groupResult}
            placements={groupPlacements}
            onNext={nextLevel}
          />
        ) : activeGame === 'quiz-rush' ? (
          <QuizControlPanel
            level={quizLevel}
            result={quizResult}
            answers={quizAnswers}
            questionIndex={quizQuestionIndex}
            onNext={advanceQuizQuestion}
          />
        ) : (
          <RecallControlPanel
            level={recallLevel}
            result={recallResult}
            cardIndex={recallCardIndex}
            revealed={recallRevealed}
          />
        )}
        </section>
      )}
    </main>
  )
}

function ForceMissionPanel({
  answer,
  level,
  levels,
  levelIndex,
  onAnswerChange,
  onLevelChange,
}: {
  answer: string
  level: ForceLabLevel
  levels: ForceLabLevel[]
  levelIndex: number
  onAnswerChange: (answer: string) => void
  onLevelChange: (index: number) => void
}) {
  return (
    <aside className="mission-panel" aria-label="Level Editor">
      <div className="panel-heading">
        <FlaskConical size={20} />
        <div>
          <span>template 01</span>
          <h1>{level.title}</h1>
        </div>
      </div>

      <div className="mission-copy">
        <span>
          {level.subject} · {level.grade}
        </span>
        <p>{level.lesson}</p>
      </div>

      <div className="equation-card">
        <span>equation</span>
        <strong>{level.equation}</strong>
        <label>
          {level.unknown} =
          <input
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            placeholder="answer"
            aria-label="Answer to the equation"
          />
        </label>
      </div>

      <div className="level-stack" aria-label="Force Lab Levels">
        {levels.map((item, index) => (
          <button
            key={item.id}
            className={index === levelIndex ? 'level-chip active' : 'level-chip'}
            type="button"
            onClick={() => onLevelChange(index)}
          >
            <span>{item.id >= 9000 ? 'T' : item.id}</span>
            <strong>{item.equation}</strong>
            <small>
              {item.id >= 9000 ? 'draft · ' : ''}
              {item.targetForce} N · {item.targetAngle}°
            </small>
          </button>
        ))}
      </div>

      <div className="teacher-note">
        <strong>Methodology</strong>
        <p>{level.teacherNote}</p>
      </div>
    </aside>
  )
}

function MistakeMissionPanel({
  level,
  levels,
  levelIndex,
  onLevelChange,
}: {
  level: MistakeArenaLevel
  levels: MistakeArenaLevel[]
  levelIndex: number
  onLevelChange: (index: number) => void
}) {
  return (
    <aside className="mission-panel" aria-label="Error editor">
      <div className="panel-heading danger">
        <CircleAlert size={20} />
        <div>
          <span>template 02</span>
          <h1>{level.title}</h1>
        </div>
      </div>

      <div className="mission-copy">
        <span>
          {level.subject} · {level.grade}
        </span>
        <p>{level.prompt}</p>
      </div>

      <div className="equation-card mistake-equation">
        <span>original entry</span>
        <strong>{level.tokens.join(' ')}</strong>
      </div>

      <div className="level-stack" aria-label="Error Arena Levels">
        {levels.map((item, index) => (
          <button
            key={item.id}
            className={index === levelIndex ? 'level-chip active danger' : 'level-chip'}
            type="button"
            onClick={() => onLevelChange(index)}
          >
            <span>{item.id >= 9000 ? 'T' : item.id}</span>
            <strong>{item.subject}</strong>
            <small>{item.id >= 9000 ? `draft · ${item.title}` : item.title}</small>
          </button>
        ))}
      </div>

      <div className="teacher-note">
        <strong>Methodology</strong>
        <p>{level.teacherNote}</p>
      </div>
    </aside>
  )
}

function GroupMissionPanel({
  level,
  levels,
  levelIndex,
  onLevelChange,
}: {
  level: GroupSortLevel
  levels: GroupSortLevel[]
  levelIndex: number
  onLevelChange: (index: number) => void
}) {
  return (
    <aside className="mission-panel" aria-label="Group editor">
      <div className="panel-heading group">
        <Boxes size={20} />
        <div>
          <span>template 04</span>
          <h1>{level.title}</h1>
        </div>
      </div>

      <div className="mission-copy">
        <span>
          {level.subject} · {level.grade}
        </span>
        <p>{level.prompt}</p>
      </div>

      <div className="equation-card group-equation">
        <span>zones</span>
        <strong>{level.groups.length} groups</strong>
        <p>{level.groups.map((group) => group.title).join(' · ')}</p>
      </div>

      <div className="level-stack" aria-label="Group levels">
        {levels.map((item, index) => (
          <button
            key={item.id}
            className={index === levelIndex ? 'level-chip active group' : 'level-chip'}
            type="button"
            onClick={() => onLevelChange(index)}
          >
            <span>{item.id >= 9000 ? 'T' : item.id}</span>
            <strong>{item.subject}</strong>
            <small>{item.id >= 9000 ? `draft · ${item.title}` : item.title}</small>
          </button>
        ))}
      </div>

      <div className="teacher-note">
        <strong>Methodology</strong>
        <p>{level.teacherNote}</p>
      </div>
    </aside>
  )
}

function QuizMissionPanel({
  level,
  levels,
  levelIndex,
  onLevelChange,
}: {
  level: QuizRushLevel
  levels: QuizRushLevel[]
  levelIndex: number
  onLevelChange: (index: number) => void
}) {
  return (
    <aside className="mission-panel" aria-label="Quiz editor">
      <div className="panel-heading quiz">
        <HelpCircle size={20} />
        <div>
          <span>template 05</span>
          <h1>{level.title}</h1>
        </div>
      </div>

      <div className="mission-copy">
        <span>
          {level.subject} · {level.grade}
        </span>
        <p>{level.prompt}</p>
      </div>

      <div className="equation-card quiz-equation">
        <span>round</span>
        <strong>{level.questions.length} questions</strong>
        <p>One choice, instant verification and short explanation after answer.</p>
      </div>

      <div className="level-stack" aria-label="Quiz levels">
        {levels.map((item, index) => (
          <button
            key={item.id}
            className={index === levelIndex ? 'level-chip active quiz' : 'level-chip'}
            type="button"
            onClick={() => onLevelChange(index)}
          >
            <span>{item.id >= 9000 ? 'T' : item.id}</span>
            <strong>{item.subject}</strong>
            <small>{item.id >= 9000 ? `draft · ${item.title}` : item.title}</small>
          </button>
        ))}
      </div>

      <div className="teacher-note">
        <strong>Methodology</strong>
        <p>{level.teacherNote}</p>
      </div>
    </aside>
  )
}

function RecallMissionPanel({
  level,
  levels,
  levelIndex,
  onLevelChange,
}: {
  level: RecallDeckLevel
  levels: RecallDeckLevel[]
  levelIndex: number
  onLevelChange: (index: number) => void
}) {
  return (
    <aside className="mission-panel" aria-label="Deck editor">
      <div className="panel-heading recall">
        <Brain size={20} />
        <div>
          <span>template 06</span>
          <h1>{level.title}</h1>
        </div>
      </div>

      <div className="mission-copy">
        <span>
          {level.subject} · {level.grade}
        </span>
        <p>{level.prompt}</p>
      </div>

      <div className="equation-card recall-equation">
        <span>deck</span>
        <strong>Cards: {level.cards.length}</strong>
        <p>First active recall, then response and honest self-assessment.</p>
      </div>

      <div className="level-stack" aria-label="Memory Deck Levels">
        {levels.map((item, index) => (
          <button
            key={item.id}
            className={index === levelIndex ? 'level-chip active recall' : 'level-chip'}
            type="button"
            onClick={() => onLevelChange(index)}
          >
            <span>{item.id >= 9000 ? 'T' : item.id}</span>
            <strong>{item.subject}</strong>
            <small>{item.id >= 9000 ? `draft · ${item.title}` : item.title}</small>
          </button>
        ))}
      </div>

      <div className="teacher-note">
        <strong>Methodology</strong>
        <p>{level.teacherNote}</p>
      </div>
    </aside>
  )
}

function ForceControlPanel({
  angle,
  force,
  level,
  result,
  onAngleChange,
  onForceChange,
  onSnap,
}: {
  angle: number
  force: number
  level: (typeof forceLabLevels)[number]
  result: ReturnType<typeof getBalanceResult>
  onAngleChange: (angle: number) => void
  onForceChange: (force: number) => void
  onSnap: () => void
}) {
  return (
    <aside className="control-panel" aria-label="Simulation parameters">
      <div className="panel-heading compact">
        <Gauge size={20} />
        <div>
          <span>management</span>
          <h2>Vector F2</h2>
        </div>
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

      <div className="readout-grid">
        <div>
          <span>goal</span>
          <strong>{level.targetForce} N/ {level.targetAngle}°</strong>
        </div>
        <div>
          <span>mass</span>
          <strong>{level.mass} kg</strong>
        </div>
        <div>
          <span>friction</span>
          <strong>{level.friction} N</strong>
        </div>
        <div>
          <span>error</span>
          <strong>{formatGap(result.netForce)}</strong>
        </div>
      </div>

      <div className="engine-note">
        <strong>Template 01</strong>
        <p>The DOM/SVG scene links the equation solution, the exact vector, and the opening gate into one game loop.</p>
        <span>content: {forceLabLevels.length} level</span>
      </div>
    </aside>
  )
}

function QuizControlPanel({
  level,
  result,
  answers,
  questionIndex,
  onNext,
}: {
  level: QuizRushLevel
  result: ReturnType<typeof getQuizRushResult>
  answers: Array<number | null>
  questionIndex: number
  onNext: () => void
}) {
  const currentAnswer = answers[questionIndex]

  return (
    <aside className="control-panel" aria-label="Quiz parameters">
      <div className="panel-heading compact quiz">
        <HelpCircle size={20} />
        <div>
          <span>management</span>
          <h2>Blitz quiz</h2>
        </div>
      </div>

      <div className="readout-grid">
        <div>
          <span>subject</span>
          <strong>{level.subject}</strong>
        </div>
        <div>
          <span>answered</span>
          <strong>{result.answered}/{result.total}</strong>
        </div>
        <div>
          <span>right</span>
          <strong>{result.correct}/{result.total}</strong>
        </div>
        <div>
          <span>accuracy</span>
          <strong>{result.accuracy}%</strong>
        </div>
      </div>

      <div className="mistake-box">
        <span>current step</span>
        <p>Question {questionIndex + 1} from {level.questions.length}</p>
        {currentAnswer === null ? (
          <strong>Select one option on stage.</strong>
        ) : (
          <strong>{level.questions[questionIndex]?.explanation}</strong>
        )}
      </div>

      <button type="button" className="snap-button quiz" onClick={onNext}>
        <ArrowRight size={17} />
        {questionIndex < level.questions.length - 1 ? 'Next question' : 'Next quiz'}
      </button>

      <div className="engine-note">
        <strong>Template 05</strong>
        <p>The DOM scene retains full keyboard navigation and associates each answer with an explanation.</p>
        <span>content: {quizRushLevels.length} level</span>
      </div>
    </aside>
  )
}

function RecallControlPanel({
  level,
  result,
  cardIndex,
  revealed,
}: {
  level: RecallDeckLevel
  result: ReturnType<typeof getRecallDeckResult>
  cardIndex: number
  revealed: boolean
}) {
  const card = level.cards[cardIndex]

  return (
    <aside className="control-panel" aria-label="Deck options">
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
          <strong>{result.rated}/{result.total}</strong>
        </div>
        <div>
          <span>remembered</span>
          <strong>{result.remembered}/{result.total}</strong>
        </div>
        <div>
          <span>repeat</span>
          <strong>{result.review}</strong>
        </div>
        <div>
          <span>self-esteem</span>
          <strong>{result.accuracy}%</strong>
        </div>
      </div>

      <div className="mistake-box recall-summary">
        <span>current card</span>
        <p>{card?.front}</p>
        {revealed && card && <strong>{card.back}</strong>}
      </div>

      <div className="engine-note">
        <strong>Template 06</strong>
        <p>The DOM scene separates recall from verification and retains keyboard control at every step.</p>
        <span>content: {recallDeckLevels.length} level</span>
      </div>
    </aside>
  )
}

function GroupControlPanel({
  level,
  result,
  placements,
  onNext,
}: {
  level: (typeof groupSortLevels)[number]
  result: ReturnType<typeof getGroupSortResult>
  placements: GroupPlacement[]
  onNext: () => void
}) {
  return (
    <aside className="control-panel" aria-label="Group options">
      <div className="panel-heading compact group">
        <Boxes size={20} />
        <div>
          <span>management</span>
          <h2>Groups</h2>
        </div>
      </div>

      <div className="readout-grid">
        <div>
          <span>subject</span>
          <strong>{level.subject}</strong>
        </div>
        <div>
          <span>posted</span>
          <strong>{result.placed}/{result.total}</strong>
        </div>
        <div>
          <span>right</span>
          <strong>{result.correct}/{result.total}</strong>
        </div>
        <div>
          <span>accuracy</span>
          <strong>{result.accuracy}%</strong>
        </div>
      </div>

      <div className="group-list">
        <span>placement</span>
        {placements.length === 0 ? (
          <p>There are no placements yet. Drag the card from the conveyor to one of the stations.</p>
        ) : (
          placements.map((placement) => {
            const item = level.items.find((candidate) => candidate.id === placement.itemId)
            const group = level.groups.find((candidate) => candidate.id === placement.groupId)
            const correct = item?.groupId === group?.id

            if (!item || !group) return null

            return (
              <div className={correct ? 'group-row correct' : 'group-row wrong'} key={item.id}>
                <strong>{item.label}</strong>
                <small>{group.title}</small>
              </div>
            )
          })
        )}
      </div>

      <button type="button" className="snap-button group" onClick={onNext}>
        <ArrowRight size={17} />
        Next group
      </button>

      <div className="engine-note">
        <strong>Template 04</strong>
        <p>The DOM scene preserves crisp text and images, and Motion is responsible for the magnetic transfer and spring response of collections.</p>
        <span>content: {groupSortLevels.length} level</span>
      </div>
    </aside>
  )
}

function MistakeControlPanel({
  level,
  result,
  selectedIndex,
  onNext,
}: {
  level: (typeof mistakeArenaLevels)[number]
  result: ReturnType<typeof getMistakeArenaResult>
  selectedIndex: number | null
  onNext: () => void
}) {
  return (
    <aside className="control-panel" aria-label="Error Arena Options">
      <div className="panel-heading compact danger">
        <ClipboardCheck size={20} />
        <div>
          <span>management</span>
          <h2>Error Scanner</h2>
        </div>
      </div>

      <div className="readout-grid">
        <div>
          <span>subject</span>
          <strong>{level.subject}</strong>
        </div>
        <div>
          <span>accuracy</span>
          <strong>{result.accuracy}%</strong>
        </div>
        <div>
          <span>selected</span>
          <strong>{result.hasSelection ? result.selectedToken : '-'}</strong>
        </div>
        <div>
          <span>replacement</span>
          <strong>{result.correct ? level.correctToken : '—'}</strong>
        </div>
      </div>

      <div className="mistake-box">
        <span>rule</span>
        <p>{level.rule}</p>
        {result.correct && <strong>{level.explanation}</strong>}
      </div>

      <button type="button" className="snap-button danger" onClick={onNext}>
        <ArrowRight size={17} />
        Next error
      </button>

      <div className="engine-note">
        <strong>Template 02</strong>
        <p>Each fragment is an accessible DOM button inside a single entry; Motion shows the error, replacement and parsing of the rule.</p>
        <span>content: {mistakeArenaLevels.length} level</span>
      </div>
    </aside>
  )
}
