'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Award, Check, Flag, Lightbulb, Pause, PawPrint, Play, RotateCw, Undo2, Redo2, Unlink, UserRound, Map, X } from 'lucide-react'
import { useLocalAvatar } from '@/lib/avatar/use-local-avatar'
import type { AvatarProfile } from '@/lib/avatar/profile'
import { directions, expeditionTopics, type ExpeditionTopic, type Route } from '@/lib/expedition/content'
import { ExpeditionSession } from '@/lib/expedition/session'
import { saveHomeworkResults } from '@/lib/learning-achievements'
import { GraphicsToggle, useGraphicsQuality } from '../graphics-toggle'
import { AvatarWardrobe } from '../space-maze/avatar-wardrobe'
import { ConstructionBoard } from './construction-board'
import styles from './expedition.module.css'

function TeamView({ session, profile, onTick, onReady, onError }: { session: ExpeditionSession; profile: AvatarProfile; onTick: () => void; onReady: () => void; onError: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!host.current) return
    const element = host.current
    let cancelled = false, view: { dispose: () => void } | undefined
    import('./expedition-view').then(({ createExpeditionView }) => {
      if (!cancelled) view = createExpeditionView(element, session, profile, () => { if (!cancelled) onReady() }, onTick, () => { if (!cancelled) onError() })
    }).catch(() => { if (!cancelled) onError() })
    return () => { cancelled = true; view?.dispose() }
  }, [session, profile, onTick, onReady, onError])
  return <div ref={host} className={styles.team} />
}

export function ExpeditionGame({ topic = 'triangle', homework = false, chapter = 1 }: { topic?: ExpeditionTopic; homework?: boolean; chapter?: number }) {
  const router = useRouter(), { profile, ready, save, saved } = useLocalAvatar(), { lowQuality, setLowQuality } = useGraphicsQuality()
  const [session, setSession] = useState(() => new ExpeditionSession(topic, homework, chapter))
  const [snapshot, setSnapshot] = useState(() => session.snapshot()), [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(true), [assetError, setAssetError] = useState(false), [retry, setRetry] = useState(0)
  const [saveFailed, setSaveFailed] = useState(false), [scheme, setScheme] = useState(false), [wardrobe, setWardrobe] = useState(false)
  const [dialog, setDialog] = useState<'clear' | 'restart' | 'plan' | null>(null), [pendingRoute, setPendingRoute] = useState<Route>('direct')
  const [history, setHistory] = useState<string[]>([]), [achievement, setAchievement] = useState<'saved' | 'failed' | null>(null)
  const world = useRef<HTMLElement>(null), heading = useRef<HTMLHeadingElement>(null), modal = useRef<HTMLDialogElement>(null), wardrobeButton = useRef<HTMLButtonElement>(null)
  const storageKey = `corgi.expedition.v1:${topic}:${homework ? 'home' : 'lesson'}:${chapter}`, c = session.content
  const area = topic === 'area', phase = snapshot.phase, paused = snapshot.paused
  const topicInfo = expeditionTopics.find(t => t.id === topic)!
  const nextUrl = (nextTopic = topic, home = homework, nextChapter = chapter) => `/lab/expedition?topic=${nextTopic}&mode=${home ? 'homework' : 'lesson'}&chapter=${nextChapter}`
  const update = useCallback(() => { const next = session.snapshot(); setSnapshot(old => JSON.stringify(old) === JSON.stringify(next) ? old : next) }, [session])
  const persist = useCallback(() => {
    try { localStorage.setItem(storageKey, session.serialize()); return true } catch { queueMicrotask(() => setSaveFailed(true)); return false }
  }, [session, storageKey])
  const loaded = useCallback(() => setLoading(false), [])
  const failed = useCallback(() => { session.pause(); update(); setAssetError(true) }, [session, update])
  useEffect(() => {
    let restored: ExpeditionSession | null = null, attempts: string[] = []
    try {
      restored = ExpeditionSession.restore(localStorage.getItem(storageKey), topic, homework, chapter)
      const previous = JSON.parse(localStorage.getItem(`${storageKey}:history`) ?? '[]')
      if (Array.isArray(previous)) attempts = previous.filter((v: unknown) => typeof v === 'string' && ExpeditionSession.restore(v, topic, homework, chapter)).slice(-20)
    } catch { /* A fresh local mission also works without storage. */ }
    queueMicrotask(() => { if (restored) { setSession(restored); setSnapshot(restored.snapshot()) }; setHistory(attempts); setHydrated(true) })
  }, [storageKey, topic, homework, chapter])
  useEffect(() => {
    if (!hydrated) return
    persist(); const timer = setInterval(persist, 1000)
    const pause = () => { session.pause(); update(); persist() }, visibility = () => { if (document.hidden) pause() }
    window.addEventListener('blur', pause); window.addEventListener('pagehide', pause); document.addEventListener('visibilitychange', visibility)
    return () => { clearInterval(timer); persist(); window.removeEventListener('blur', pause); window.removeEventListener('pagehide', pause); document.removeEventListener('visibilitychange', visibility) }
  }, [session, hydrated, persist, update])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (wardrobe || dialog || event.key !== 'Escape') return
      event.preventDefault(); if (session.paused) session.resume(); else session.pause(); update(); persist()
    }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [session, wardrobe, dialog, update, persist])
  useEffect(() => { if (dialog) modal.current?.showModal(); else modal.current?.close() }, [dialog])
  useEffect(() => { if (!dialog && !wardrobe && phase !== 'inspect') heading.current?.focus({ preventScroll: true }) }, [phase, paused, dialog, wardrobe])
  useEffect(() => {
    if (!homework || phase !== 'finished') return
    const id = `${topic}:chapter${chapter}:variant${session.variant}`
    const success = saveHomeworkResults('expedition', `${topic}:chapter${chapter}`, `${topicInfo.title} · head ${chapter}`, [id], [{ questionId: id, mastered: true, firstTry: session.independent }])
    queueMicrotask(() => setAchievement(success ? 'saved' : 'failed'))
  }, [phase, homework, topic, chapter, session, topicInfo.title])
  const act = (action: () => void) => { action(); update(); persist() }
  const focusMap = () => { if (innerWidth <= 720) world.current?.scrollIntoView({ block: 'start', behavior: 'auto' }) }
  const choosePlan = (route: Route) => {
    if (session.draft.parts.length || session.draft.platform) { setPendingRoute(route); setDialog('plan') }
    else act(() => session.choosePlan(route))
  }
  const restart = () => {
    const previous = [...history, session.serialize()].slice(-20)
    try { localStorage.setItem(`${storageKey}:history`, JSON.stringify(previous)) } catch { setSaveFailed(true); setDialog(null); return }
    const next = new ExpeditionSession(topic, homework, chapter, session.variant + 1)
    setHistory(previous); setSession(next); setSnapshot(next.snapshot()); setLoading(true); setScheme(false); setAchievement(null); setDialog(null)
  }
  const phaseTitles = { inspect: 'Check out the crossing', plan: 'Choose a plan', building: area ? 'Assemble the site' : 'Build a crossing', prediction: 'Predict the result', failed: 'The test found a problem', passed: 'The design has been tested', crossing: 'The team is following your route', finished: 'The expedition continues!' }
  return <main className={styles.page}>
    <header className={styles.header}>
      <Link className={styles.brand} href="/profile" onClick={() => { session.pause(); persist() }}><PawPrint fill="currentColor" size={28} />LessonQuest</Link><strong>Expedition</strong>
      <select aria-label="Expedition theme" value={topic} disabled={!hydrated || !['inspect', 'finished'].includes(phase)} onChange={event => router.push(nextUrl(event.target.value as ExpeditionTopic))}>{expeditionTopics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
      <button aria-label="Save and exit" onClick={() => { session.pause(); update(); if (persist()) router.push('/profile') }}><span>Save and exit</span><ArrowRight size={18} /></button>
      <button ref={wardrobeButton} aria-label="Select character" disabled={!ready} onClick={() => { act(() => session.pause()); setWardrobe(true) }}><UserRound size={20} /></button>
      <button aria-label={paused ? 'Continue expedition' : 'Pause'} disabled={!hydrated || phase === 'finished'} onClick={() => act(() => paused ? session.resume() : session.pause())}>{paused ? <Play size={20} /> : <Pause size={20} />}</button>
      <GraphicsToggle lowQuality={lowQuality} onChange={value => { act(() => session.pause()); setLoading(true); setLowQuality(value) }} />
    </header>
    <div className={styles.layout} inert={wardrobe}>
      <section className={styles.panel} aria-label="Assignment and construction">
        <div className={styles.intro}><h1>{c.title}</h1><p>{homework ? `Homework · chapter ${chapter} out of 3` : 'Short training mission'} · {topicInfo.title}</p></div>
        <div className={styles.steps} aria-label="Progress of the expedition">{['Inspect', 'Build', 'Experience', 'Go'].map((label, i) => <span key={label} data-active={i === (phase === 'inspect' || phase === 'plan' ? 0 : phase === 'building' ? 1 : ['prediction', 'failed', 'passed'].includes(phase) ? 2 : 3)}>{i + 1}. {label}</span>)}</div>
        <h2 ref={heading} tabIndex={-1} className={styles.stateTitle}>{paused ? 'Expedition on pause' : phaseTitles[phase]}</h2>
        {saveFailed && <p className={styles.error} role="alert">Saving in the browser is not available. Do not close the page so as not to lose the project. <Link href="/profile">Exit without saving</Link></p>}
        {paused ? <div className={styles.pause}><p>The design, responses and movement of the team are stopped. You can continue from the same place.</p><button className={styles.primary} disabled={loading || assetError} onClick={() => act(() => session.resume())}><Play size={18} />Continue</button><button className={styles.textButton} onClick={() => setDialog('restart')}>Start a new attempt</button></div> : <>
          {phase === 'inspect' && <><p className={styles.goal}>{c.description}</p><div className={styles.measurements}><strong>{area ? `${c.targetArea} m²` : topic === 'scale' ? `1:${c.scale}` : `${c.horizontal} m + ${c.vertical} m`}</strong><span>{area ? `Fence - no more ${c.fence} m` : topic === 'scale' ? 'In the drawing - 3 and 4 cm' : 'Two perpendicular offsets'}</span></div><p>You select the parts and assemble the structure. The test will test your calculations, and then the hero and your pets will follow your path.</p><button className={styles.primary} disabled={!hydrated || loading || assetError} onClick={() => act(() => session.inspect())}>{loading ? 'We are preparing an expedition...' : 'Choose a plan'}<ArrowRight size={18} /></button></>}
          {phase === 'plan' && <><p>{c.description}</p><div className={styles.routes}>
            {!['segments', 'area'].includes(topic) && <button onClick={() => choosePlan('direct')}><strong>Direct path A-B</strong><span>One diagonal span. Find its length from two displacements.</span><ArrowRight size={20} /></button>}
            <button onClick={() => choosePlan('via')}><strong>{area ? 'Platform at support C' : 'Through support C'}</strong><span>{area ? 'Match the sides, then install the rectangular platform.' : 'Two spans at right angles. Check every area.'}</span><ArrowRight size={20} /></button>
          </div></>}
          {phase === 'building' && <>
            <p className={styles.goal}>{c.description}</p>
            {area ? <div className={styles.sides}><label>Width, m<select aria-label="Platform width" value={session.panelWidth} onChange={e => act(() => session.setSide('width', Number(e.target.value)))}>{c.sides.map(n => <option key={n}>{n}</option>)}</select></label><label>Length, m<select aria-label="Platform length" value={session.panelHeight} onChange={e => act(() => session.setSide('height', Number(e.target.value)))}>{c.sides.map(n => <option key={n}>{n}</option>)}</select></label><button className={styles.secondary} onClick={() => { act(() => session.placePlatform()); focusMap() }}>Install at C</button></div> : <>
              <h3>Materials</h3><div className={styles.materials} role="group" aria-label="Ferry details">{session.materials.map(m => <button key={m.length} aria-label={`Detail ${m.length} m`} aria-pressed={session.selectedLength === m.length} disabled={m.remaining === 0} onClick={() => { act(() => session.selectMaterial(m.length)); focusMap() }}><span className={styles.beamThumbnail} /><strong>{m.length} m</strong><small>{m.remaining} in stock</small></button>)}</div>
              <p className={styles.instruction}>{session.selectedLength !== null ? `Detail ${session.selectedLength} m: ${session.from ? 'select the second point' : 'click two points of the desired span'}.` : 'Select a detail, then two points on the map.'}</p>
            </>}
            <div className={styles.tools}>
              <button onClick={() => act(() => session.rotate())} aria-label="Rotate part"><RotateCw size={17} />Rotate</button>
              <button disabled={!session.undoStack.length} onClick={() => act(() => session.undo())} aria-label="Cancel move"><Undo2 size={17} />Cancel</button>
              <button disabled={!session.redoStack.length} onClick={() => act(() => session.redo())} aria-label="Return the move"><Redo2 size={17} />Return</button>
              <button disabled={area ? !session.draft.platform : session.selectedPart === null} onClick={() => act(() => session.remove())}><Unlink size={17} />Disconnect</button>
            </div>
            {!area && <p className={styles.direction}>Direction: <strong>{directions[session.direction].title}</strong></p>}
            {!area && session.draft.parts.length > 0 && <div className={styles.parts} role="group" aria-label="Installed parts">{session.draft.parts.map((p, i) => <button key={p.id} aria-pressed={session.selectedPart === p.id} onClick={() => act(() => session.selectPart(p.id))}>#{i + 1} · {p.edge === 'ab' ? 'A-B' : p.edge === 'ac' ? 'A-C' : 'S—B'} · {p.length} m</button>)}</div>}
            <button className={styles.primary} onClick={() => act(() => session.predict())}>Predict the result<ArrowRight size={18} /></button>
            <div className={styles.minorActions}><button onClick={() => setDialog('clear')}>Reset design</button>{!['segments', 'area'].includes(topic) && <button onClick={() => choosePlan(session.route === 'direct' ? 'via' : 'direct')}>Another way</button>}</div>
          </>}
          {phase === 'prediction' && <form onSubmit={e => { e.preventDefault(); act(() => session.test()) }}><p className={styles.goal}>{c.predictionLabel}</p><p>{area ? 'Add up the lengths of all sides of the established platform.' : topic === 'segments' ? 'Consider both spans of the path through N.' : 'Even when going through C, the length of the straight line A-B is needed here.'}</p><label className={styles.answer}><span>Your forecast</span><div><input aria-label="Your forecast in meters" inputMode="decimal" autoComplete="off" value={session.prediction} onChange={e => act(() => session.setPrediction(e.target.value))} /><span>m</span></div></label><button className={styles.primary} type="submit">Experience<Flag size={18} /></button><button type="button" className={styles.textButton} onClick={() => act(() => session.edit())}><ArrowLeft size={16} />Return to design</button></form>}
          {phase === 'failed' && <><ul className={styles.issues}>{session.issues.map((issue, i) => <li key={i} data-kind={issue.kind}>{issue.message}</li>)}</ul><p>The materials and design remained in place. Correct the cause and try again.</p><button className={styles.primary} onClick={() => act(() => session.edit())}>Correct the design<ArrowRight size={18} /></button><button className={styles.textButton} onClick={() => { setScheme(true); focusMap() }}><Map size={17} />Show on diagram</button></>}
          {phase === 'passed' && <><p className={styles.success}><Check size={22} />Calculation and design have been agreed upon.</p><p>{area ? `Area — ${c.targetArea} m²; there is enough fence.` : session.route === 'direct' ? `Direct crossing - ${c.diagonal} m.` : `Path through C - ${c.horizontal + c.vertical} m; each span reaches a support.`}</p><button className={styles.primary} disabled={loading || assetError} onClick={() => { act(() => session.cross()); focusMap() }}><PawPrint size={20} />Guide the team</button><button className={styles.textButton} onClick={() => act(() => session.edit())}>Change project and try again</button></>}
          {phase === 'crossing' && <><p>The path has been verified. The hero and pets walk through your design.</p><progress className={styles.crossing} aria-label="Team transition" max={100} value={snapshot.crossing} /><button className={styles.textButton} onClick={focusMap}>Show command</button></>}
          {phase === 'finished' && <><p className={styles.success}><Check size={22} />The team reached the other side.</p><div className={styles.result}><strong>{session.independent ? 'Independently' : session.hintLevel ? 'Using parsing' : 'After correction'}</strong><span>Tests: {session.attempts.length} · calculation errors: {session.mathErrors}</span></div><p>{topicInfo.skill}</p>{!session.independent && <p>There will be new sizes in the next chapter - you can check the method yourself.</p>}
            {homework && <p className={styles.achievement}><Award size={20} />{achievement === 'saved' ? 'The achievements for the chapter are saved in the profile.' : achievement === 'failed' ? 'The chapter is completed, but the browser did not save the achievement.' : 'We save the result of the chapter...'}</p>}
            {(!homework || chapter < 3) && <Link className={styles.primary} href={nextUrl(topic, true, homework ? chapter + 1 : 1)}>{homework ? `Next chapter · ${chapter + 1} / 3` : 'Continue at home · Chapter 1 / 3'}<ArrowRight size={18} /></Link>}
            <button className={styles.textButton} onClick={() => setDialog('restart')}>New try with different sizes</button>
            <details><summary>My trials</summary><ol>{session.attempts.map((a, i) => <li key={i}>Forecast {a.answer} m {a.success ? 'the project passed' : a.mathError ? 'a new calculation was required' : 'required rotation of the part'}{a.helped ? ' · with a hint' : ''}</li>)}</ol></details>
          </>}
          {['building', 'prediction', 'failed'].includes(phase) && <div className={styles.help}><button className={styles.textButton} disabled={session.hintLevel >= 3} onClick={() => act(() => session.hint())}><Lightbulb size={18} />{session.hintLevel ? 'Next step hint' : 'Hint'}</button>{session.hintLevel > 0 && <p>{c.hints[session.hintLevel - 1]}</p>}</div>}
        </>}
        {session.notice && <p className={styles.notice} role="status">{session.notice}</p>}
        {history.length > 0 && ['inspect', 'finished'].includes(phase) && <details><summary>Previous attempts · {history.length}</summary><ul>{history.map((raw, i) => { const s = ExpeditionSession.restore(raw, topic, homework, chapter)!; return <li key={i}>{s.phase === 'finished' ? 'Passed' : 'Not completed'} · tests {s.attempts.length} · calculation errors {s.mathErrors}</li> })}</ul></details>}
        <footer className={styles.footer}><span>Character and pets are from your profile</span><span>{saveFailed ? 'Saving is not available' : 'The project is saved in this browser'}</span></footer>
      </section>
      <section ref={world} className={styles.world} aria-label="Gorge and structure">
        <div className={styles.scene}>
          <ConstructionBoard key={retry} session={session} scheme={scheme} act={act} onAssetError={failed} />
          {hydrated && ready && <TeamView key={`${lowQuality}:${retry}`} session={session} profile={profile} onTick={update} onReady={loaded} onError={failed} />}
          <button className={styles.schemeButton} aria-pressed={scheme} onClick={() => setScheme(!scheme)}><Map size={17} />{scheme ? 'Return to the island' : 'Diagram and measurements'}</button>
          {assetError && <div className={styles.loadError} role="alert"><h2>Failed to load expedition</h2><button className={styles.primary} onClick={() => { setAssetError(false); setLoading(true); setRetry(n => n + 1) }}>Retry download</button></div>}
          {paused && !assetError && <div className={styles.pausedMap}><Pause size={16} />Paused</div>}
        </div>
      </section>
    </div>
    <dialog ref={modal} className={styles.dialog} aria-label="Design Change Confirmation" onCancel={() => setDialog(null)}>
      <button className={styles.close} aria-label="Close window" onClick={() => setDialog(null)}><X size={20} /></button><h2>{dialog === 'restart' ? 'Start a new attempt?' : dialog === 'plan' ? 'Choose a different path?' : 'Reset the structure?'}</h2>
      <p>{dialog === 'restart' ? 'The previous attempt will remain in history. The new mission will have different dimensions. Skins, pets and achievements will remain.' : 'The materials will be returned to stock. Training attempts and used tips will be saved.'}</p>
      <button className={styles.primary} onClick={() => { if (dialog === 'restart') restart(); else { act(() => dialog === 'plan' ? session.choosePlan(pendingRoute) : session.resetDraft()); setDialog(null) } }}>{dialog === 'restart' ? 'Start over' : dialog === 'plan' ? 'Choose a different path' : 'Reset'}</button><button className={styles.secondary} onClick={() => setDialog(null)}>Leave the project</button>
    </dialog>
    {wardrobe && <AvatarWardrobe profile={profile} saved={saved} onChange={p => { setLoading(true); save(p) }} onClose={() => { setWardrobe(false); wardrobeButton.current?.focus() }} actionLabel="Return to expedition" />}
    <output className={styles.debug} aria-label="Expedition status">{JSON.stringify(snapshot)}</output>
  </main>
}
