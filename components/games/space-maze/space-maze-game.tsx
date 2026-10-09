'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronRight, Heart, Leaf, Pause, Play, RotateCcw, Shield, ShieldAlert, Star, Trophy, UserRound } from 'lucide-react'
import { mazeQuestion, type MazeLesson } from '@/lib/space-maze/content'
import { learningGameQuestions, validateLearningGameQuestions } from '@/lib/learning-game-content'
import { MazeSession, defaultMazeSettings, type MazeSettings, type MazeSnapshot } from '@/lib/space-maze/session'
import type { Direction } from '@/lib/space-maze/maze'
import { type AvatarProfile } from '@/lib/avatar/profile'
import { useLocalAvatar } from '@/lib/avatar/use-local-avatar'
import { AvatarWardrobe } from './avatar-wardrobe'
import { HomeworkResult } from '../homework-result'
import styles from './space-maze.module.css'
import { useGraphicsQuality } from '../graphics-toggle'

const letters = ['A', 'B', 'C']
const keyDirections: Record<string, Direction> = {
  ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left',
  KeyW: 'up', KeyD: 'right', KeyS: 'down', KeyA: 'left',
}
const touchButtons = [
  { direction: 'up' as const, label: 'Go up', Icon: ArrowUp },
  { direction: 'left' as const, label: 'Go left', Icon: ArrowLeft },
  { direction: 'down' as const, label: 'Go down', Icon: ArrowDown },
  { direction: 'right' as const, label: 'Go right', Icon: ArrowRight },
]
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

function MazeCanvas({ session, lowQuality, onTick, avatar, onLoading }: {
  session: MazeSession; lowQuality: boolean; onTick: () => void; avatar: AvatarProfile; onLoading: (loading: boolean) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const joystick = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLSpanElement>(null)
  const drag = useRef<{ id: number; x: number; y: number; direction: Direction | null } | null>(null)
  useEffect(() => {
    if (!host.current) return
    const element = host.current
    let cancelled = false
    let view: { dispose: () => void } | undefined
    import('./maze-view').then(({ createMazeView }) => {
      if (cancelled) return
      view = createMazeView(element, session, {
        lowQuality, labelClass: styles.beaconLabel, onTick, avatar,
        onReady: () => { if (!cancelled) { setLoading(false); onLoading(false) } },
        onError: (message) => { if (!cancelled) { setError(message); onLoading(true); session.pause(); onTick() } },
      })
    }).catch(() => {
      if (!cancelled) setError('Failed to start 3D. You need a browser with WebGL2. Try updating your browser or enabling lighter graphics.')
    })
    return () => { cancelled = true; view?.dispose() }
  }, [session, lowQuality, onTick, retry, avatar, onLoading])

  const releaseDrag = () => {
    if (drag.current?.direction) session.release(drag.current.direction)
    drag.current = null
    if (joystick.current) joystick.current.hidden = true
  }
  return <>
    <div className={styles.canvas} ref={host}
      onPointerDown={(event) => {
        if (loading || error || drag.current || event.button !== 0 || session.status !== 'playing') return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        const bounds = event.currentTarget.getBoundingClientRect()
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, direction: null }
        if (joystick.current && thumb.current) {
          joystick.current.hidden = false
          joystick.current.style.left = `${event.clientX - bounds.left}px`
          joystick.current.style.top = `${event.clientY - bounds.top}px`
          thumb.current.style.transform = 'translate(0, 0)'
        }
      }}
      onPointerMove={(event) => {
        const origin = drag.current
        if (!origin || origin.id !== event.pointerId) return
        const x = event.clientX - origin.x, y = event.clientY - origin.y
        const distance = Math.hypot(x, y)
        const scale = Math.min(1, 29 / Math.max(1, distance))
        if (thumb.current) thumb.current.style.transform = `translate(${x * scale}px, ${y * scale}px)`
        const direction: Direction | null = distance < 16 ? null : Math.abs(x) > Math.abs(y) ? x > 0 ? 'right' : 'left' : y > 0 ? 'down' : 'up'
        if (origin.direction === direction) return
        if (origin.direction) session.release(origin.direction)
        origin.direction = direction
        if (direction) { session.press(direction); onTick() }
      }}
      onPointerUp={releaseDrag} onPointerCancel={releaseDrag} onLostPointerCapture={releaseDrag}
    ><div ref={joystick} className={styles.joystick} hidden aria-hidden="true"><span ref={thumb} /></div></div>
    {loading && !error && <div className={styles.loading} role="status"><span className={styles.spinner} />We are preparing the station...</div>}
    {error && <div className={styles.loadError} role="alert">
      <ShieldAlert size={30} /><p>{error}</p>
      <button className={styles.primary} onClick={() => { setError(''); setLoading(true); onLoading(true); setRetry((value) => value + 1) }}>Retry download</button>
    </div>}
  </>
}

export function SpaceMazeGame({ lessons, settings = defaultMazeSettings, homework = false }: { lessons: readonly MazeLesson[]; settings?: MazeSettings; homework?: boolean }) {
  const lessonForRun = (packet: MazeLesson) => ({ ...packet, questions: learningGameQuestions(packet, homework) })
  const [lesson, setLesson] = useState(() => { const initial = lessonForRun(lessons[0]); validateLearningGameQuestions(initial.questions); return initial })
  const [session, setSession] = useState(() => new MazeSession(1, mazeQuestion(lesson, 1), settings))
  const [snapshot, setSnapshot] = useState<MazeSnapshot>(() => session.snapshot())
  const [sceneLoading, setSceneLoading] = useState(true)
  const { lowQuality, setLowQuality } = useGraphicsQuality()
  const [completed, setCompleted] = useState<Array<MazeSnapshot & { level: number }>>([])
  const [finished, setFinished] = useState(false)
  const [activeTouch, setActiveTouch] = useState<Direction | null>(null)
  const { profile: avatar, save: changeAvatar, saved: avatarSaved, ready: avatarReady } = useLocalAvatar()
  const [wardrobe, setWardrobe] = useState(false)
  const [roundId, setRoundId] = useState(0)
  const wasPlaying = useRef(false)
  const dialogButton = useRef<HTMLButtonElement>(null)
  const level = session.level
  const questionCount = lesson.questions.length
  const question = session.question
  const updateHud = useCallback(() => {
    const next = session.snapshot()
    setSnapshot((previous) => Object.keys(next).every((key) =>
      previous[key as keyof MazeSnapshot] === next[key as keyof MazeSnapshot]) ? previous : next)
  }, [session])

  const newLevel = (nextLevel: number, nextLesson = lesson, nextSettings = session.settings) => {
    const next = new MazeSession(nextLevel, mazeQuestion(nextLesson, nextLevel), nextSettings)
    setSession(next)
    setSceneLoading(true)
    setRoundId((value) => value + 1)
    setSnapshot(next.snapshot())
    setActiveTouch(null)
  }
  const resetLesson = (nextLesson = lessonForRun(lessons.find(item => item.id === lesson.id)!), nextSettings = session.settings) => {
    validateLearningGameQuestions(nextLesson.questions)
    setLesson(nextLesson); setCompleted([]); setFinished(false); newLevel(1, nextLesson, nextSettings)
  }
  const restart = () => { newLevel(level); setFinished(false) }
  const togglePause = useCallback(() => {
    if (session.status === 'playing') session.pause()
    else if (session.status === 'paused') session.resume()
    else if (session.status === 'ready') session.start()
    updateHud()
  }, [session, updateHud])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (sceneLoading || target.closest('select, input, textarea, button, a, [role="dialog"]')) return
      if (keyDirections[event.code]) {
        event.preventDefault()
        session.press(keyDirections[event.code])
      } else if ((event.code === 'Space' || event.code === 'Escape') && !event.repeat) {
        event.preventDefault()
        togglePause()
      }
    }
    const keyup = (event: KeyboardEvent) => { if (keyDirections[event.code]) session.release(keyDirections[event.code]) }
    const blur = () => { session.pause(); session.clearInput(); setActiveTouch(null); updateHud() }
    const visibility = () => { if (document.hidden) blur() }
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', blur)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', blur)
      document.removeEventListener('visibilitychange', visibility)
      session.clearInput()
    }
  }, [session, togglePause, updateHud, sceneLoading])

  const hasDialog = !wardrobe && (finished || ['paused', 'wrong', 'won', 'lost'].includes(snapshot.status))
  useEffect(() => { if (hasDialog) dialogButton.current?.focus() }, [hasDialog, snapshot.status, finished])
  const blurButton = () => { if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur() }
  const totalSeconds = completed.reduce((sum, result) => sum + result.seconds, 0)
  const totalMistakes = completed.reduce((sum, result) => sum + result.mistakes, 0)
  const totalCollisions = completed.reduce((sum, result) => sum + result.collisions, 0)

  return <main className={styles.game}>
    <header className={styles.header}>
      <Link href="/profile" className={styles.iconButton} aria-label="Personal account"><ArrowLeft size={22} /></Link>
      <h1>Space Maze</h1>
      <label className={styles.levelSelect}>
        <span>Level</span>
        <select aria-label="Maze level" value={level} disabled={sceneLoading || snapshot.status !== 'ready'} onChange={(event) => {
          setFinished(false); newLevel(Number(event.target.value)); event.target.blur()
        }}>
          {lesson.questions.map((item, index) => <option key={item.id} value={index + 1}>{index + 1} from {questionCount}</option>)}
        </select>
        <progress className={styles.progress} value={completed.length} max={questionCount} aria-label={`Levels completed: ${completed.length} from ${questionCount}`} />
      </label>
      <div className={styles.hearts} aria-label={`Lives left: ${snapshot.lives}`}>
        {[1, 2, 3].map((life) => <Heart key={life} size={22} fill={life <= snapshot.lives ? 'currentColor' : 'none'} className={life <= snapshot.lives ? styles.heart : styles.emptyHeart} />)}
      </div>
      <button className={`${styles.iconButton} ${styles.wardrobeButton}`} aria-label="Character and skins" title="Character and skins" disabled={!avatarReady} onClick={() => {
        wasPlaying.current = session.status === 'playing'; session.pause(); updateHud(); setWardrobe(true)
      }}><UserRound size={20} /><span>Character</span></button>
      <button className={styles.iconButton} aria-label="Lightweight graphics" aria-pressed={lowQuality} title="Lightweight graphics for weak devices" onClick={() => {
        session.pause(); updateHud(); setSceneLoading(true); setLowQuality(!lowQuality); blurButton()
      }}><Leaf size={20} /></button>
      <button className={styles.iconButton} aria-label="Start the level again" title="Start the level again" onClick={() => { restart(); blurButton() }}><RotateCcw size={19} /></button>
      <button className={styles.pauseButton} disabled={sceneLoading || !['ready', 'playing', 'paused'].includes(snapshot.status)} aria-label={snapshot.status === 'playing' ? 'Pause' : 'Continue game'} onClick={() => { togglePause(); blurButton() }}>
        {snapshot.status === 'playing' ? <Pause size={21} /> : <Play size={21} />}
      </button>
    </header>

    <section className={styles.playArea} aria-label="space station">
      <div className={styles.question}>
        <select aria-label="Item" value={lesson.id} disabled={!finished && (sceneLoading || snapshot.status !== 'ready' || completed.length > 0)} onChange={(event) => {
          resetLesson(lessonForRun(lessons.find((item) => item.id === event.target.value)!)); event.target.blur()
        }}>{lessons.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        <h2>{question.prompt}</h2>
      </div>
      {avatarReady ? <MazeCanvas key={`${roundId}-${lowQuality}-${avatar.skinId}`} session={session} lowQuality={lowQuality} onTick={updateHud} avatar={avatar} onLoading={setSceneLoading} /> : <div className={styles.loading} role="status">We are preparing the station...</div>}
      <div className={styles.sceneNote}>
        <span className={styles.liveDot} />
        {!session.settings.enemies ? 'Training route without aliens' : level < 3 ? 'Scout patrols the station' : level < 7 ? 'The hunter notices you close' : 'The interceptor is trying to take a shortcut'}
      </div>
      <div className={styles.timer} aria-label="Time on level">{timeLabel(snapshot.seconds)}</div>
      {snapshot.status === 'playing' && snapshot.immunity > 0 && <div className={styles.shieldNote} role="status" key={snapshot.collisions}>
        <Shield size={16} /><span>{snapshot.collisions ? 'We return to the start. ' : ''}Protection {snapshot.immunity} s</span>
      </div>}

      {wardrobe && <AvatarWardrobe profile={avatar} saved={avatarSaved} onChange={next => { setSceneLoading(true); changeAvatar(next) }} onClose={() => {
        setWardrobe(false); if (wasPlaying.current) session.resume(); updateHud(); blurButton()
      }} />}
      {hasDialog && <div className={styles.scrim}>
        <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="maze-dialog-title" onKeyDown={(event) => {
          if (event.key === 'Tab') {
            const buttons = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')]
            const index = buttons.indexOf(document.activeElement as HTMLElement)
            event.preventDefault(); buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
          }
          if (event.key === 'Escape' && snapshot.status === 'paused' && !sceneLoading) { session.resume(); updateHud(); blurButton() }
        }}>
          <div className={`${styles.dialogIcon} ${snapshot.status === 'wrong' || snapshot.status === 'lost' ? styles.warning : ''}`}>
            {finished ? <Trophy size={30} /> : snapshot.status === 'won' ? <Check size={32} /> : snapshot.status === 'paused' ? <Pause size={27} /> : <ShieldAlert size={30} />}
          </div>
          <h2 id="maze-dialog-title">{finished ? 'The expedition is completed!' : snapshot.status === 'won' ? 'The right route!' : snapshot.status === 'wrong' ? 'This is a different answer' : snapshot.status === 'lost' ? 'Shall we try again?' : 'You can take a break'}</h2>
          {snapshot.status === 'won' && !finished && <div className={styles.levelResult}>
            <Star size={19} fill={snapshot.mistakes === 0 ? 'currentColor' : 'none'} />
            <span>{snapshot.mistakes === 0 ? 'Answer on the first try' : 'Answer found'} · {timeLabel(snapshot.seconds)}</span>
          </div>}
          <p>{finished ? `Levels completed: ${completed.length}. Time: ${timeLabel(totalSeconds)}.` : snapshot.status === 'paused' ? 'The station will wait. The hero and the aliens remain in place.' : snapshot.status === 'lost' ? 'Lives are over. Start this level again - now you know the map.' : question.explanation}</p>
          {finished && <div className={styles.results}><span>Answers on the first try <b>{completed.filter((result) => result.mistakes === 0).length} / {completed.length}</b></span><span>Errors in answers <b>{totalMistakes}</b></span><span>Encounters with aliens <b>{totalCollisions}</b></span></div>}
          {snapshot.status === 'wrong' && <p className={styles.small}>Correct answer: {question.options[question.correctIndex]}.</p>}
          <button ref={dialogButton} className={styles.primary} disabled={sceneLoading} onClick={() => {
            if (finished) resetLesson()
            else if (snapshot.status === 'won') {
              const results = [...completed.filter((result) => result.level !== level), { ...snapshot, level }]
              setCompleted(results)
              if (results.length === questionCount) setFinished(true)
              else newLevel(Array.from({ length: questionCount }, (_, index) => (level + index) % questionCount + 1)
                .find(next => !results.some(result => result.level === next))!)
            } else if (snapshot.status === 'wrong') { session.retryAnswer(); updateHud() }
            else if (snapshot.status === 'lost') restart()
            else { session.resume(); updateHud() }
            blurButton()
          }}>{finished ? 'New expedition' : snapshot.status === 'won' ? completed.filter(result => result.level !== level).length === questionCount - 1 ? 'Results of the expedition' : 'Next level' : snapshot.status === 'lost' ? 'Start the level again' : snapshot.status === 'wrong' ? 'Try again' : 'Continue'}<ChevronRight size={19} /></button>
          {finished && completed.some(result => result.mistakes > 0) && <button className={styles.secondary} onClick={() => resetLesson({ ...lesson,
            questions: lesson.questions.filter((_, index) => completed.some(result => result.level === index + 1 && result.mistakes > 0)),
          })}>Repeat mistakes</button>}
          {finished && <HomeworkResult templateId="space-maze" lesson={lessons.find(item => item.id === lesson.id)!} homework={homework} results={completed.map(result => ({ questionId: lesson.questions[result.level - 1].id, mastered: true, firstTry: result.mistakes === 0 }))} />}
        </section>
      </div>}
    </section>

    <footer className={styles.footer}>
      <div className={styles.answerArea}>
        <ol className={styles.answers} aria-label="Answers in beacons">
          {question.options.map((option, index) => <li key={`${question.id}-${index}`} className={['wrong', 'won'].includes(snapshot.status) ? index === question.correctIndex ? styles.correctAnswer : index === snapshot.answer ? styles.wrongAnswer : '' : ''}>
            <span className={styles.answerLetter}>{letters[index]}</span><span>{option}</span>
          </li>)}
        </ol>
        <div className={styles.instructions}>
          <p>{snapshot.status === 'ready' ? 'Read the question and find the required beacon.' : session.settings.enemies ? 'Get to the correct answer. Avoid aliens.' : 'Reach the lighthouse with the correct answer.'}<span className={styles.touchHint}>To move, drag your finger across the playing field.</span></p>
          {snapshot.status === 'ready' && <div className={styles.startControls}>
            <label className={styles.enemyOption}><input type="checkbox" checked={session.settings.enemies} disabled={completed.length > 0 || snapshot.mistakes > 0 || snapshot.collisions > 0} onChange={event => newLevel(level, lesson, { enemies: event.target.checked })} />Aliens</label>
            <button className={styles.primary} disabled={sceneLoading} onClick={() => { session.start(); updateHud(); blurButton() }}><Play size={16} fill="currentColor" />On the road</button>
          </div>}
        </div>
      </div>
      <div className={styles.controlArea}>
        <div className={styles.dpad} aria-label="Character Control">
          {touchButtons.map(({ direction, label, Icon }) => <button key={direction}
            className={`${styles.direction} ${styles[direction]} ${activeTouch === direction ? styles.pressed : ''}`}
            aria-label={label} disabled={hasDialog || wardrobe || sceneLoading || snapshot.status !== 'playing'}
            onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setActiveTouch(direction); session.press(direction); updateHud() }}
            onPointerUp={(event) => { session.release(direction); setActiveTouch(null); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }}
            onPointerCancel={() => { session.clearInput(); setActiveTouch(null) }}
            onLostPointerCapture={() => { session.release(direction); setActiveTouch(null) }}
            onClick={(event) => { if (event.detail === 0) { session.press(direction); session.release(direction); updateHud() } }}
          ><Icon size={21} /></button>)}
        </div>
        <span className={styles.keyboardHint}>Arrows/WASD</span>
      </div>
    </footer>
    <output className={styles.srOnly} aria-label="Character position">Row {snapshot.row}, column {snapshot.column}</output>
    <div className={styles.srOnly} aria-live="polite">{snapshot.status === 'won' ? 'The answer is correct' : snapshot.status === 'wrong' ? 'Wrong answer' : snapshot.collisions > 0 ? `Collisions: ${snapshot.collisions}. Lives left: ${snapshot.lives}` : ''}</div>
  </main>
}
