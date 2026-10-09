'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowRight, ArrowUp, Award, Check, Lightbulb, Pause, PawPrint, Play, ShieldCheck, UserRound, Waves } from 'lucide-react'
import { useLocalAvatar } from '@/lib/avatar/use-local-avatar'
import type { AvatarProfile } from '@/lib/avatar/profile'
import { defenseLessons, type DefenseLessonId } from '@/lib/tower-defense/content'
import { DefenseSession, defenseTowers, defenseMissions, shotCosts, type DefenseMission } from '@/lib/tower-defense/session'
import { decodeLearningProgress, learningProgressSnapshot, saveHomeworkResults, subscribeLearningProgress } from '@/lib/learning-achievements'
import { AvatarWardrobe } from '../space-maze/avatar-wardrobe'
import styles from './tower-defense.module.css'
import { GraphicsToggle, useGraphicsQuality } from '../graphics-toggle'

const serverProgress = () => ''

function DefenseCanvas({ session, avatar, onTick, onLoading, onSelect, onPlace }: {
  session: DefenseSession; avatar: AvatarProfile; onTick: () => void; onLoading: (loading: boolean) => void; onSelect: (index: number) => void; onPlace: (index: number) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false), [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!host.current) return
    const element = host.current
    let cancelled = false, view: { dispose: () => void } | undefined
    const fail = () => { if (!cancelled) { setError(true); onLoading(true); session.pause(); onTick() } }
    import('./defense-view').then(({ createDefenseView }) => {
      if (!cancelled) view = createDefenseView(element, session, avatar, () => { if (!cancelled) onLoading(false) }, onTick, fail, onSelect, styles.worldLabel, onPlace)
    }).catch(fail)
    return () => { cancelled = true; view?.dispose() }
  }, [session, avatar, onTick, onLoading, onSelect, onPlace, retry])
  return <><div ref={host} className={styles.canvas} />{error && <div className={styles.loadError} role="alert"><h2>Failed to load database</h2><button onClick={() => { setError(false); onLoading(true); setRetry(value => value + 1) }}>Retry download</button></div>}</>
}

function DefenseAchievement({ session }: { session: DefenseSession }) {
  const raw = useSyncExternalStore(subscribeLearningProgress, learningProgressSnapshot, serverProgress)
  const progressId = `${session.lesson}:${session.mission}:chapter${session.chapter}`
  const progress = useMemo(() => decodeLearningProgress(raw).progress[`tower-defense:${progressId}`], [raw, progressId])
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const lesson = defenseLessons.find(item => item.id === session.lesson)!
    const success = saveHomeworkResults('tower-defense', progressId, `${lesson.title} · head ${session.chapter}`, session.results.map(result => result.questionId), session.results)
    if (!success) queueMicrotask(() => setFailed(true))
  }, [session, progressId])
  return <p className={styles.achievement} role="status"><Award size={23} />{progress?.achievement ? 'Achievement “Knowledge in action” received!' : failed ? 'Homework completed. The browser did not allow me to save the achievement.' : 'Homework completed. Let\'s save the achievement...'}</p>
}

export function TowerDefenseGame({ lessonId = 'seven', homework = false, mission = 'watch', chapter = 1 }: {
  lessonId?: DefenseLessonId; homework?: boolean; mission?: DefenseMission; chapter?: number
}) {
  const router = useRouter()
  const { lowQuality, setLowQuality } = useGraphicsQuality()
  const [session, setSession] = useState(() => new DefenseSession(lessonId, homework, mission, chapter))
  const [snapshot, setSnapshot] = useState(() => session.snapshot())
  const [hydrated, setHydrated] = useState(false), [storageFailed, setStorageFailed] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [loading, setLoading] = useState(true), [wardrobe, setWardrobe] = useState(false)
  const [dialog, setDialog] = useState<'settings' | 'rule' | 'reset' | null>(null)
  const [sound, setSound] = useState(false), [largeText, setLargeText] = useState(false)
  const modal = useRef<HTMLDialogElement>(null), audio = useRef<AudioContext | null>(null)
  const feedbackCount = useRef(0)
  const { profile, ready, save, saved } = useLocalAvatar()
  const heading = useRef<HTMLHeadingElement>(null), wardrobeButton = useRef<HTMLButtonElement>(null)
  const world = useRef<HTMLElement>(null), controls = useRef<HTMLDivElement>(null)
  const storageKey = `corgi.defense.v2:${lessonId}:${mission}:${homework ? 'home' : 'lesson'}:${chapter}`
  const lesson = defenseLessons.find(item => item.id === session.lesson)!
  const status = snapshot.status
  const tower = session.selectedTower, towerInfo = session.towerInfo(tower), installed = Boolean(session.towerPosition(tower))
  const exercise = session.index < 6 ? session.exercise : null
  const charge = session.recharge
  const urlFor = (nextLesson = lessonId, nextMission = mission, home = homework, nextChapter = chapter) => `/lab/tower-defense?lesson=${nextLesson}&mission=${nextMission}&mode=${home ? 'homework' : 'lesson'}&chapter=${nextChapter}`
  const update = useCallback(() => {
    const next = session.snapshot(); setSnapshot(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
  }, [session])
  const persist = useCallback(() => {
    try { localStorage.setItem(storageKey, session.serialize()); return true } catch { queueMicrotask(() => setStorageFailed(true)); return false }
  }, [session, storageKey])
  useEffect(() => {
    let restored: DefenseSession | null = null
    let attempts: string[] = []
    try {
      restored = DefenseSession.restore(localStorage.getItem(storageKey), lessonId, homework, mission, chapter)
      const previous = JSON.parse(localStorage.getItem(`${storageKey}:history`) ?? '[]')
      if (Array.isArray(previous)) attempts = previous.filter((item: unknown) => typeof item === 'string' && DefenseSession.restore(item, lessonId, homework, mission, chapter)).slice(-20)
    } catch { /* Storage can be disabled. */ }
    queueMicrotask(() => {
      if (restored) { setSession(restored); setSnapshot(restored.snapshot()); feedbackCount.current = restored.results.length + restored.rechargeSolved }
      setHistory(attempts)
      setHydrated(true)
    })
  }, [storageKey, lessonId, homework, mission, chapter])
  useEffect(() => {
    if (!hydrated) return
    persist()
    const timer = window.setInterval(persist, 1000)
    const pause = () => { session.pause(); update(); persist() }
    const visibility = () => { if (document.hidden) pause() }
    window.addEventListener('blur', pause); window.addEventListener('pagehide', pause); document.addEventListener('visibilitychange', visibility)
    return () => { clearInterval(timer); persist(); window.removeEventListener('blur', pause); window.removeEventListener('pagehide', pause); document.removeEventListener('visibilitychange', visibility) }
  }, [hydrated, persist, session, update])
  useEffect(() => { if (dialog) modal.current?.showModal(); else modal.current?.close() }, [dialog])
  useEffect(() => { if (status !== 'ready' && !dialog && !wardrobe) heading.current?.focus({ preventScroll: true }) }, [status, dialog, wardrobe])
  useEffect(() => {
    const count = snapshot.completed + snapshot.rechargeSolved
    if (sound && count > feedbackCount.current && audio.current) {
      const context = audio.current, oscillator = context.createOscillator(), gain = context.createGain()
      oscillator.connect(gain); gain.connect(context.destination); oscillator.frequency.value = 660
      gain.gain.setValueAtTime(.035, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .18)
      oscillator.start(); oscillator.stop(context.currentTime + .18)
    }
    feedbackCount.current = count
  }, [sound, snapshot.completed, snapshot.rechargeSolved])
  useEffect(() => () => { void audio.current?.close() }, [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (wardrobe || dialog || event.ctrlKey || event.altKey || event.metaKey || /INPUT|SELECT|TEXTAREA/.test((event.target as HTMLElement).tagName)) return
      if (['1', '2', '3'].includes(event.key)) {
        if (session.recharge) session.answerRecharge(Number(event.key) - 1)
        else session.answer(Number(event.key) - 1)
        update(); persist()
      } else if (event.key === 'Escape' && !loading) { event.preventDefault(); if (session.status === 'paused') session.resume(); else session.pause(); update(); persist() }
    }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [session, update, persist, wardrobe, dialog, loading])
  const act = (action: () => void) => { action(); update(); persist() }
  const selectTower = useCallback((index: number) => { session.selectTower(index); update(); if (window.innerWidth <= 720) controls.current?.scrollIntoView({ block: 'nearest' }) }, [session, update])
  const placeTower = useCallback((index: number) => { session.placeTower(index); update(); persist() }, [session, update, persist])
  const show = (next: 'settings' | 'rule' | 'reset') => { act(() => session.pause()); setDialog(next) }
  const reset = () => {
    const attempts = [...history, session.serialize()].slice(-20)
    try { localStorage.setItem(`${storageKey}:history`, JSON.stringify(attempts)) } catch { setStorageFailed(true); setDialog(null); return }
    setHistory(attempts)
    const next = new DefenseSession(lessonId, homework, mission, chapter); next.variant = session.variant + 1; next.mode = session.mode
    setSession(next); setSnapshot(next.snapshot()); setLoading(true); feedbackCount.current = 0; setDialog(null)
  }
  const titles: Record<string, string> = { ready: 'Prepare the first patrol', choosing: 'What kind of tower will we prepare?', question: `Quest ${session.index + 1} out of 6`, explanation: 'Let\'s look at the solution', correct: 'Charge and kit received', 'wave-ready': 'Defense ready', wave: 'Defending the base', between: 'Wave reflected', paused: 'Pause · progress saved', finished: 'The base is protected!', defeated: 'Defense needs a different plan' }
  return <main className={styles.page} data-large-text={largeText} data-status={status}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} onClick={() => { session.pause(); persist() }}><PawPrint size={32} fill="currentColor" />LessonQuest</Link>
      <strong>Base Defense</strong>
      <select aria-label="Learning topic" value={lessonId} disabled={!hydrated || !['ready', 'finished'].includes(status)} onChange={event => router.push(urlFor(event.target.value as DefenseLessonId))}>{defenseLessons.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
      <button className={styles.back} aria-label="Save and exit" onClick={() => { session.pause(); update(); if (persist()) router.push('/profile') }}><span>Save and exit</span><ArrowRight size={18} /></button>
      <button ref={wardrobeButton} aria-label="Select character" disabled={!ready || !hydrated} onClick={() => { act(() => session.pause()); setWardrobe(true) }}><UserRound size={21} /></button>
      <button aria-label={status === 'paused' ? 'Continue' : 'Pause'} disabled={loading || !hydrated || ['finished', 'defeated'].includes(status)} onClick={() => act(() => status === 'paused' ? session.resume() : session.pause())}>{status === 'paused' ? <Play size={20} /> : <Pause size={20} />}</button>
      <button aria-label="Defense Settings" onClick={() => show('settings')}>⚙</button>
      <GraphicsToggle lowQuality={lowQuality} onChange={value => { act(() => session.pause()); setLoading(true); setLowQuality(value) }} />
    </header>
    <div className={styles.layout}>
      <section className={styles.panel} aria-label="Training missions and defense" inert={wardrobe}>
        <div className={styles.intro}><h1>{session.missionInfo.title}</h1><p>{homework ? `Homework · chapter ${chapter} out of 3` : 'Short training mission'} · 6 tasks · 3 waves</p></div>
        {status === 'ready' && <div className={styles.setup}>
          <label>Scenario<select aria-label="Defense scenario" value={mission} onChange={event => router.push(urlFor(lessonId, event.target.value as DefenseMission))}>{defenseMissions.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
          <label>Tempo<select aria-label="Defensive tempo" value={session.mode} onChange={event => act(() => { session.mode = event.target.value as 'calm' | 'practice' })}><option value="practice">Practice · charging in 12 seconds</option><option value="calm">Calm down · pause for task</option></select></label>
          <p>{session.missionInfo.detail}</p>
        </div>}
        {session.canBuild && <div className={styles.buildSection}>
          <p><strong>Build a tower</strong><span>Sets: {session.kits}</span></p>
          <div className={styles.buildCards}>{defenseTowers.map((type, index) => <button key={type.name} disabled={!hydrated || session.kits < 1 || !session.placements.includes(-1)} aria-label={`Build ${type.name}`} onClick={() => act(() => { session.selectBuild(index); if (window.innerWidth <= 720) world.current?.scrollIntoView({ block: 'start' }) })}><Image src={`/game-assets/tower-defense/tower-${index}.webp`} width={64} height={64} alt="" /><strong>{type.name}</strong><small>{type.detail}</small></button>)}</div>
        </div>}
        {session.placingTower !== null && session.canBuild && <div className={styles.placementHint} role="status">{session.towerInfo(session.placingTower).name}: select a free area on the map.<button className={styles.hint} onClick={() => act(() => session.cancelPlacement())}>Cancel</button></div>}
        <div className={styles.installed} role="group" aria-label="Installed towers">{session.placements.map((slot, index) => slot < 0 ? null : <button key={index} aria-label={`Select ${session.towerInfo(index).name}, place ${slot + 1}`} aria-pressed={index === tower} disabled={['paused', 'question', 'explanation', 'correct', 'finished', 'defeated'].includes(status) || Boolean(charge)} onClick={() => selectTower(index)}><span>{session.towerInfo(index).name} <small>#{slot + 1} · ur. {session.levels[index]}</small></span><progress aria-label={`Energy tower in place ${slot + 1}`} max={100} value={session.energy[index]} /><small>{Math.floor(session.energy[index])}% energy</small></button>)}</div>
        {installed && !['paused', 'question', 'explanation', 'correct', 'finished', 'defeated'].includes(status) && !charge && <div ref={controls} className={styles.towerControls} aria-label="Selected tower">
          <strong>{towerInfo.name} · platform {session.placements[tower] + 1}</strong><p>{towerInfo.detail}. The map shows the range.</p>
          <div className={styles.controlRow}>
            <button disabled={session.energy[tower] >= 100} onClick={() => act(() => session.beginRecharge(tower))}>Charge +60</button>
            <button onClick={() => act(() => session.togglePriority(tower))}>Goal: {session.priorities[tower] ? 'the largest' : 'closer to the base'}</button>
          </div>
          {session.canBuild && <>
            <p>{session.levels[tower] < 3 ? session.upgradeDescription : 'Maximum level'}</p>
            <div className={styles.controlRow}><button disabled={session.kits < 1 || session.levels[tower] >= 3} onClick={() => act(() => session.upgradeTower(tower))}>Improve · 1 set</button><button onClick={() => act(() => { session.selectPlacement(tower); if (window.innerWidth <= 720) world.current?.scrollIntoView({ block: 'start' }) })}>Transfer</button><button onClick={() => act(() => session.removeTower(tower))}>remove · return {session.levels[tower]}</button></div>
            <details><summary>Replace tower type</summary><p>Levels will return in sets. The new tower needs to be charged.</p><div className={styles.controlRow}>{defenseTowers.map((type, index) => <button key={type.name} disabled={session.types[tower] === index} onClick={() => act(() => session.replaceTower(tower, index))}>{type.name}</button>)}</div></details>
          </>}
        </div>}
        <div className={styles.lessonBody}>
          <h2 ref={heading} tabIndex={-1} className={styles.stateTitle}>{titles[status]}</h2>
          <p className={styles.notice} role="status">{session.notice}</p>
          {storageFailed && <p role="alert">The browser did not allow saving progress. Don&apos;t close the page until the end of the mission. <Link href="/profile">Exit without saving</Link></p>}
          {status === 'ready' && <><p className={styles.goal}>{lesson.goal}</p><p>Two sets - for the first towers. Select a type, then a site. Solutions will provide energy and new kits.</p><button className={styles.primary} disabled={loading || !hydrated || !session.deployed || Boolean(charge)} onClick={() => act(() => session.start())}>{loading ? 'Loading the database...' : session.deployed ? 'Prepare defense' : 'Place the first tower'}<Play size={18} /></button></>}
          {status === 'choosing' && <><p>Choose a tower and solve the task: it will receive 60 energy, and you will receive a kit for construction or improvement.</p><button className={styles.primary} disabled={!installed || Boolean(charge)} onClick={() => act(() => session.chooseTower(tower))}>Prepare {towerInfo.name.toLowerCase()} · task {session.index + 1}</button></>}
          {status === 'question' && exercise && <><p className={styles.upgrade}><ArrowUp size={16} />{towerInfo.name} · +60 energy and 1 set</p><p className={exercise.prompt.length < 25 ? styles.equation : styles.wordProblem}>{exercise.prompt}</p><div className={styles.answers} role="group" aria-label="Answer options">{exercise.options.map((option, index) => <button key={index} onClick={() => act(() => session.answer(index))}>{option}</button>)}</div><button className={styles.hint} onClick={() => act(() => session.hint())}><Lightbulb size={18} />Explain this problem</button></>}
          {status === 'explanation' && exercise && <><p className={styles.previous}>{exercise.prompt}{session.selectedAnswer !== null && <span>Your answer: {exercise.options[session.selectedAnswer]}</span>}</p><p className={styles.explanation}>{exercise.explanation}</p><p className={styles.note}>Now a new task using the same method. Analysis is marked separately from independent solution.</p><button className={styles.primary} onClick={() => act(() => session.continue())}>Solve a similar task</button></>}
          {status === 'correct' && <><p className={styles.success}><Check size={22} />+60 energy · +1 set</p><p>{session.helped ? 'Decided after analysis.' : 'Decided on my own.'} The set can be spent on a new tower or upgrade.</p><button className={styles.primary} onClick={() => act(() => session.continue())}>{session.prepared === 2 ? 'To the launch of the wave' : 'Next task'}</button></>}
          {status === 'wave-ready' && <><p>{session.missionInfo.detail}. Check placement, levels and charge.</p><button className={styles.primary} disabled={loading || Boolean(charge) || !session.placements.some((slot, index) => slot >= 0 && session.energy[index] >= shotCosts[session.types[index]])} onClick={() => act(() => session.launch())}><Play size={18} />Start a wave {session.wave}</button><p className={styles.note}>Towers with an empty battery are waiting to be charged. Rearrangement is available before the start of the wave.</p></>}
          {status === 'wave' && <><p>Select towers on the map or in the list. Charge those that are now covering the path.</p><button className={styles.primary} disabled={session.petUsed} onClick={() => act(() => session.protect())}><PawPrint size={20} />{session.petUsed ? 'Pet help used' : 'Cover base · 5 seconds'}</button><p className={styles.note}>{session.mode === 'calm' ? 'During the solution, the wave stops.' : 'Charges in 12 seconds. While you are deciding, the wave moves slower.'} Energy is spent only on shots.</p></>}
          {status === 'between' && <><p>Base strength: {session.health} / 100. You can rearrange the towers and prepare the next wave.</p><button className={styles.primary} disabled={Boolean(charge)} onClick={() => act(() => session.continue())}>Prepare the wave {session.wave + 1}</button></>}
          {status === 'paused' && <><p>The movement and timer are stopped. The lineup, tasks and energy are saved in this browser.</p><button className={styles.primary} disabled={loading} onClick={() => act(() => session.resume())}><Play size={18} />Continue mission</button><button className={styles.hint} onClick={() => show('rule')}>How to play and what we train</button><button className={styles.hint} onClick={() => setDialog('reset')}>Start over</button></>}
          {status === 'defeated' && <><p>The bubbles went to the base. Move the towers closer to the uncovered area, try cryo or impulse.</p><p className={styles.note}>Solved tasks remain as a result. Replay returns the state of the base and batteries before this wave.</p><button className={styles.primary} onClick={() => act(() => session.retryWave())}>Repeat wave {session.wave}</button></>}
          {status === 'finished' && <><p className={styles.goal}>All three waves are reflected. Base strength: {session.health} / 100.</p><div className={styles.results}><span><strong>{session.independent}</strong>on your own</span><span><strong>{session.results.length - session.independent}</strong>after analysis</span></div><p>Additionally: {session.rechargeSolved} recharges, of which {session.chargeIndependent} on your own. Wave repeats: {session.retries}.</p>{session.reviewPrompts.length > 0 && <details><summary>What&apos;s worth repeating</summary><ul>{session.reviewPrompts.map((prompt, index) => <li key={index}>{prompt}</li>)}</ul></details>}
            {homework && <DefenseAchievement session={session} />}
            {(!homework || chapter < 3) && <Link className={styles.primary} href={urlFor(lessonId, mission, true, homework ? chapter + 1 : 1)}><Award size={20} />{homework ? `Next chapter of Homework · ${chapter + 1} / 3` : 'Continue at home · Chapter 1 / 3'}</Link>}
            <p className={styles.note}>Completion rewards and independent solutions are noted separately. The hero, skins and pets are saved.</p><button className={styles.hint} onClick={() => setDialog('reset')}>Repeat with new tasks</button>
          </>}
          {history.length > 0 && ['ready', 'paused', 'finished'].includes(status) && <details><summary>Previous attempts · {history.length}</summary><ul>{history.map((raw, index) => {
            const attempt = DefenseSession.restore(raw, lessonId, homework, mission, chapter)!
            return <li key={index}>{attempt.status === 'finished' ? 'Completed' : 'Not completed'}: {attempt.results.length} / 6 tasks, independently {attempt.independent}, recharging {attempt.rechargeSolved}.</li>
          })}</ul><p className={styles.note}>The last 20 attempts of this script are saved in the browser.</p></details>}
          {charge && !['paused', 'defeated'].includes(status) && <div className={styles.recharge} role="region" aria-label="Recharging the tower">
            <strong>{session.towerInfo(charge.tower).name} · +60 energy</strong><div className={styles.chargeTimer} role="timer" aria-label="Charging time">{status === 'wave' && session.mode === 'practice' && !charge.hint ? `${snapshot.rechargeSeconds} s` : 'No rush'}</div>
            <p className={styles.wordProblem}>{session.rechargeExercise.prompt}</p>
            {charge.hint ? <><p className={styles.explanation}>{session.rechargeExercise.explanation}</p><button className={styles.primary} onClick={() => act(() => session.continueRecharge())}>Solve a similar task</button></> : <>
              {charge.feedback && <p role="status">{charge.feedback}</p>}
              {!charge.expired && <div className={styles.answers} role="group" aria-label="The answer is to recharge">{session.rechargeExercise.options.map((option, index) => <button disabled={charge.tried.includes(index)} key={index} onClick={() => act(() => session.answerRecharge(index))}>{option}</button>)}</div>}
              <div className={styles.controlRow}><button onClick={() => act(() => session.hintRecharge())}>Figure it out</button>{charge.expired && <button onClick={() => act(() => session.nextRecharge())}>Next task</button>}</div>
            </>}
            <button className={styles.hint} onClick={() => act(() => session.closeRecharge())}>Close charging</button>
          </div>}
        </div>
        <footer className={styles.progress}><div><span>Main quests</span><strong>{session.results.length} / 6</strong></div><div className={styles.dots}>{Array.from({ length: 6 }, (_, index) => <span key={index} data-done={index < session.results.length} />)}</div><small>{status === 'finished' ? 'Mission completed' : `Wave ${session.wave} / 3 sets ${session.kits}`}</small></footer>
      </section>
      <section ref={world} className={styles.world} aria-label="Base and towers, top view" inert={wardrobe}>
        {ready && hydrated && <DefenseCanvas key={String(lowQuality)} session={session} avatar={profile} onTick={update} onLoading={setLoading} onSelect={selectTower} onPlace={placeTower} />}
        <div className={styles.worldHud}><Waves size={25} /><div><strong>Wave {session.wave} / 3</strong><span><ShieldCheck size={15} />{status === 'paused' ? 'Paused' : 'Base'} · {session.health} / 100</span><progress aria-label="Base strength" max={100} value={session.health} /></div></div>
        <div className={styles.worldNote}>{session.petShield > 0 ? `Pet protects the base · ${Math.ceil(session.petShield)} s` : session.placingTower !== null ? 'Choose a free site' : 'Click on the tower to control it'}</div>
      </section>
    </div>
    <output className={styles.debug} aria-label="Base protection status">{JSON.stringify(snapshot)}</output>
    <dialog ref={modal} className={styles.dialog} aria-label={dialog === 'settings' ? 'Game Settings' : dialog === 'reset' ? 'New try' : 'Defense rules'} onCancel={() => setDialog(null)}>
      {dialog === 'settings' && <><h2>Defense Settings</h2><label>Tempo<select value={session.mode} onChange={event => act(() => { session.mode = event.target.value as 'practice' | 'calm' })}><option value="practice">Practice · 12 seconds</option><option value="calm">Calm down · pause for task</option></select></label><label><input type="checkbox" checked={sound} onChange={event => { const enabled = event.target.checked; setSound(enabled); if (enabled) { audio.current ??= new AudioContext(); void audio.current.resume() } }} />Sound of correct answer</label><label><input type="checkbox" checked={largeText} onChange={event => setLargeText(event.target.checked)} />Enlarged text</label><p>Motion reduction takes into account device settings. Graphics quality can be switched in the top panel.</p></>}
      {dialog === 'rule' && <><h2>How to protect your base</h2><p>{lesson.goal}</p><p>Choose a tower and complete two tasks before the wave. Each solution gives 60 energy and a kit. Kits are needed for construction and improvements.</p><p>The laser hits one target, the cryo slows it down, the impulse hits the group. In battle, recharge the required tower. Pet assistance covers the base once per wave.</p><p>Keys 1, 2, 3 select the answer. Escape pauses the game. Hints help you complete the mission and are marked as a result.</p></>}
      {dialog === 'reset' && <><h2>Start a new attempt?</h2><p>The alignment and current wave will begin anew with new tasks. The previous attempt will remain in history; achievements, skins and pets will be saved.</p><button className={styles.primary} onClick={reset}>Start over</button></>}
      <button className={styles.primary} onClick={() => setDialog(null)}>{dialog === 'reset' ? 'Continue current attempt' : 'Close'}</button>
    </dialog>
    {wardrobe && <AvatarWardrobe profile={profile} saved={saved} onChange={next => { setLoading(true); save(next) }} onClose={() => { setWardrobe(false); wardrobeButton.current?.focus() }} actionLabel="Return to base" />}
  </main>
}
