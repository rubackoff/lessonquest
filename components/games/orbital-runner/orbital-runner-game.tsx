'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Heart, Pause, Play, RotateCcw, UserRound } from 'lucide-react'
import { avatarSkins, type AvatarProfile } from '@/lib/avatar/profile'
import { useLocalAvatar } from '@/lib/avatar/use-local-avatar'
import { RunnerSession, defaultRunnerSettings, type RunnerLesson, type RunnerSettings, type RunnerCommand, type RunnerSnapshot } from '@/lib/orbital-runner/session'
import { AvatarWardrobe } from '../space-maze/avatar-wardrobe'
import { HomeworkResult } from '../homework-result'
import { learningGameQuestions } from '@/lib/learning-game-content'
import styles from './orbital-runner.module.css'
import { GraphicsToggle, useGraphicsQuality } from '../graphics-toggle'

const commands: Record<string, RunnerCommand> = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', ArrowDown: 'slide', KeyS: 'slide',
}
const controls = [
  { command: 'left' as const, label: 'Left', Icon: ArrowLeft },
  { command: 'right' as const, label: 'Right', Icon: ArrowRight },
  { command: 'jump' as const, label: 'Jump', Icon: ArrowUp },
  { command: 'slide' as const, label: 'Sliding', Icon: ArrowDown },
]

function RunnerCanvas({ session, avatar, onTick, onLoading }: {
  session: RunnerSession; avatar: AvatarProfile; onTick: () => void; onLoading: (loading: boolean) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null)
  useEffect(() => {
    if (!host.current) return
    const element = host.current
    let cancelled = false
    let view: { dispose: () => void } | undefined
    import('./runner-view').then(({ createRunnerView }) => {
      if (cancelled) return
      view = createRunnerView(element, session, avatar,
        () => { if (!cancelled) onLoading(false) }, onTick,
        () => { if (!cancelled) { setError(true); session.pause(); onTick() } }, styles.gateLabel)
    }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true; view?.dispose() }
  }, [session, avatar, onTick, onLoading, retry])
  return <>
    <div ref={host} className={styles.canvas} onPointerDown={event => {
      if (event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
    }} onPointerUp={event => {
      const start = gesture.current; gesture.current = null
      if (!start || start.id !== event.pointerId) return
      const x = event.clientX - start.x, y = event.clientY - start.y
      if (Math.max(Math.abs(x), Math.abs(y)) < 25) return
      session.command(Math.abs(x) > Math.abs(y) ? x > 0 ? 'right' : 'left' : y > 0 ? 'slide' : 'jump')
      onTick()
    }} onPointerCancel={() => { gesture.current = null }} onLostPointerCapture={() => { gesture.current = null }} />
    {error && <div className={styles.panel} role="alert"><h2>Failed to open route</h2>
      <p>You need a browser with WebGL2. Try downloading again.</p>
      <button className={styles.primary} onClick={() => { setError(false); onLoading(true); setRetry(value => value + 1) }}>Retry download</button>
    </div>}
  </>
}

export function OrbitalRunnerGame({ lessons, settings = defaultRunnerSettings, homework = false }: { lessons: readonly RunnerLesson[]; settings?: RunnerSettings; homework?: boolean }) {
  const { lowQuality, setLowQuality } = useGraphicsQuality()
  const [lessonId, setLessonId] = useState(lessons[0].id)
  const [session, setSession] = useState(() => new RunnerSession(learningGameQuestions(lessons[0], homework), settings))
  const [snapshot, setSnapshot] = useState<RunnerSnapshot>(() => session.snapshot())
  const [loading, setLoading] = useState(true)
  const [runId, setRunId] = useState(0)
  const [wardrobe, setWardrobe] = useState(false)
  const { profile, save, saved, ready } = useLocalAvatar()
  const skin = avatarSkins.find(item => item.id === profile.skinId)!
  const field = useRef<HTMLElement>(null), wardrobeButton = useRef<HTMLButtonElement>(null)
  const resumeAfterWardrobe = useRef(false)
  const focusGame = () => field.current?.querySelector('canvas')?.focus()
  const updateHud = useCallback(() => {
    const next = session.snapshot()
    setSnapshot(previous => Object.keys(next).every(key => previous[key as keyof RunnerSnapshot] === next[key as keyof RunnerSnapshot]) ? previous : next)
  }, [session])
  const reset = (nextLesson = lessonId, nextSettings = session.settings, questions: RunnerLesson['questions'] = learningGameQuestions(lessons.find(item => item.id === nextLesson)!, homework)) => {
    const next = new RunnerSession(questions, nextSettings)
    setLessonId(nextLesson); setSession(next); setSnapshot(next.snapshot()); setRunId(value => value + 1); setLoading(true)
  }
  const togglePause = useCallback(() => {
    if (session.status === 'playing') session.pause()
    else if (session.status === 'paused') session.resume()
    updateHud()
  }, [session, updateHud])
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest('input, select, textarea, a, [role="dialog"]')) return
      if (event.repeat) return
      if (event.code === 'KeyP' || event.code === 'Escape') { event.preventDefault(); togglePause() }
      else if (commands[event.code] && session.status === 'playing' && !(event.target as HTMLElement).closest('button')) { event.preventDefault(); session.command(commands[event.code]); updateHud() }
    }
    const pause = () => { session.pause(); updateHud() }
    const visibility = () => { if (document.hidden) pause() }
    window.addEventListener('keydown', keydown); window.addEventListener('blur', pause)
    document.addEventListener('visibilitychange', visibility)
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', visibility) }
  }, [session, togglePause, updateHud])
  const status = snapshot.status
  const playing = status === 'playing'
  const question = session.question

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link className={styles.back} href="/profile"><ArrowLeft size={27} /><span>Personal account</span></Link>
      <div className={styles.heading}><h1>Orbital runner</h1>
        <select aria-label="Runner Training Pack" value={lessonId} disabled={!['ready', 'finished', 'gameover'].includes(status) || status === 'ready' && snapshot.answered > 0} onChange={event => reset(event.target.value)}>
          {lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
        </select>
      </div>
      <div className={styles.tools}><span>Skin: {skin.name}</span>
        <button ref={wardrobeButton} className={styles.iconButton} aria-label="Character and skins" disabled={!ready} onClick={() => {
          resumeAfterWardrobe.current = session.status === 'playing'; session.pause(); updateHud(); setWardrobe(true)
        }}><UserRound size={25} /></button>
        <button className={styles.iconButton} disabled={loading || !['playing', 'paused'].includes(status)} aria-label={status === 'paused' ? 'Continue the race' : 'Pause'} aria-pressed={status === 'paused'} onClick={() => { togglePause(); focusGame() }}>
          {status === 'paused' ? <Play size={23} /> : <Pause size={25} />}
        </button>
      </div>
      <GraphicsToggle lowQuality={lowQuality} onChange={value => { session.pause(); updateHud(); setLoading(true); setLowQuality(value) }} />
    </header>
    <section className={styles.taskBand} aria-label="Study assignment">
      <span className={styles.taskNumber}>{homework ? 'Homework · ' : ''}Level {snapshot.level} / 3 Task {Math.min(snapshot.answered + 1, session.questionCount)} from {session.questionCount}</span>
      <h2>{question.prompt}</h2>
      <div className={styles.laneAnswers}>
        {question.options.map((option, index) => <button key={index} disabled={!['ready', 'playing'].includes(status)}
          aria-label={`Path ${['A', 'B', 'C'][index]}: ${option}`} aria-pressed={snapshot.lane === index - 1}
          onClick={() => { session.selectLane(index); updateHud(); if (playing) focusGame() }}>
          <span><b>{['A', 'B', 'C'][index]}</b> · {['Left', 'Middle', 'Right'][index]}</span><strong className={option.length > 16 ? styles.longAnswer : undefined}>{option}</strong>
        </button>)}
      </div>
    </section>
    <section className={styles.track} ref={field} aria-label="Orbital runner">
      {ready && <RunnerCanvas key={`${runId}-${profile.skinId}-${lowQuality}`} session={session} avatar={profile} onTick={updateHud} onLoading={setLoading} />}
      <div className={`${styles.hud} ${styles.distance}`}><span>Distance</span><strong>{snapshot.distance} m</strong></div>
      <div className={`${styles.hud} ${styles.stats}`}>
        <div><span>Health</span><div className={styles.hearts} aria-label={`Health: ${snapshot.lives}`}>
          {[0, 1, 2].map(index => <Heart key={index} size={28} className={index < snapshot.lives ? styles.alive : styles.lost} />)}
        </div></div>
        <div><span>Coins</span><strong>{snapshot.coins}</strong></div>
      </div>
      {loading && <div className={styles.loading} role="status">We are preparing the route...</div>}
      {!loading && status === 'ready' && <div className={`${styles.panel} ${styles.readyPanel}`}>
        <h2>Continuous run</h2><p>Pass the box with the correct answer. A mistake takes a life. After the frame, the next task begins immediately.</p>
        <label className={styles.obstacleOption}><input type="checkbox" checked={session.settings.obstacles} disabled={snapshot.answered > 0} onChange={event => reset(lessonId, { ...session.settings, obstacles: event.target.checked }, session.questions)} />Obstacles</label>
        <button className={styles.primary} onClick={() => { session.start(); updateHud(); focusGame() }}>Start the race</button>
      </div>}
      {status === 'paused' && !wardrobe && !loading && <div className={styles.panel}>
        <h2>Pause</h2><p>The route will wait.</p>
        <button className={styles.primary} onClick={() => { session.resume(); updateHud(); focusGame() }}>Continue the race</button>
        <button className={styles.secondary} onClick={() => reset()}><RotateCcw size={17} />Start over</button>
      </div>}
      {status === 'playing' && snapshot.feedback && <p className={styles.answerToast} role="status">{snapshot.feedback}</p>}
      {(status === 'finished' || status === 'gameover') && <div className={styles.panel} role="region" aria-label="Race result">
        <h2>{status === 'finished' ? 'Finish!' : 'The race is over'}</h2>
        <p>{snapshot.distance} m {snapshot.coins} coins</p>
        <p>Correct answers: {snapshot.correct} from {snapshot.answered}.<br />Collisions: {snapshot.collisions}.</p>
        <button className={styles.primary} onClick={() => reset()}>Start over</button>
        {session.incorrectQuestions.length > 0 && <button className={styles.secondary} onClick={() => reset(lessonId, session.settings, session.incorrectQuestions)}>Repeat mistakes</button>}
        {status === 'finished' && <HomeworkResult templateId="orbital-runner" lesson={lessons.find(item => item.id === lessonId)!} homework={homework} results={session.responses.map(result => ({ questionId: result.questionId, mastered: result.correct, firstTry: result.correct }))} />}
      </div>}
      <output className={styles.srOnly} aria-label="Runner State">{JSON.stringify(snapshot)}</output>
    </section>
    <footer className={styles.controls}>
      <div className={styles.buttons}>{controls.map(({ command, label, Icon }) => <button key={command} disabled={!playing || loading} aria-label={label} onClick={() => {
        session.command(command); updateHud(); focusGame()
      }}><span><Icon size={34} strokeWidth={2.1} /></span>{label}</button>)}</div>
      <p>Arrows or WASD P - pause<span>On the phone - swipes or buttons</span></p>
    </footer>
    {wardrobe && <AvatarWardrobe profile={profile} saved={saved} actionLabel="On the track" onChange={next => { setLoading(true); save(next) }} onClose={() => {
      setWardrobe(false); if (resumeAfterWardrobe.current) session.resume(); updateHud(); wardrobeButton.current?.focus()
    }} />}
  </main>
}
