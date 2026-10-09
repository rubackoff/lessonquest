'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { mechanics, scenarios, type MechanicId, type Check } from '@/lib/mechanics-lab'
import { MiniGame } from './mini-games'
import s from './mechanics.module.css'

type Review = { verdict: string; note: string; completed: number[] }
type Reviews = Partial<Record<MechanicId, Review>>
const key = 'corgi.mechanics-lab.v1'
function readReviews(): Reviews {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '{}'), result: Reviews = {}
    for (const { id } of mechanics) { const item = value[id]; if (item && ['','develop','revise','drop'].includes(item.verdict) && typeof item.note === 'string' && Array.isArray(item.completed)) result[id] = { verdict: item.verdict, note: item.note.slice(0, 1000), completed: [...new Set<number>(item.completed.filter((v: unknown) => v === 0 || v === 1 || v === 2))] } }
    return result
  } catch { return {} }
}
const emptyReview: Review = { verdict: '', note: '', completed: [] }
const verdicts = [{ id: 'develop', title: 'Develop' }, { id: 'revise', title: 'Remake' }, { id: 'drop', title: 'Postpone' }]

export function MechanicsLab() {
  const [game, setGame] = useState<MechanicId | null>(null), [round, setRound] = useState(0), [attempt, setAttempt] = useState(0)
  const [reviews, setReviews] = useState<Reviews>({}), [ready, setReady] = useState(false), [saveError, setSaveError] = useState(false)
  const [feedback, setFeedback] = useState<Check | null>(null), [hint, setHint] = useState(''), [hints, setHints] = useState(0), [checks, setChecks] = useState(0)
  const feedbackRef = useRef<HTMLDivElement>(null), heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { const data = readReviews(); queueMicrotask(() => { setReviews(data); setReady(true) }) }, [])
  useEffect(() => { if (!ready) return; try { localStorage.setItem(key, JSON.stringify(reviews)) } catch { queueMicrotask(() => setSaveError(true)) } }, [reviews, ready])
  useEffect(() => { if (feedback) feedbackRef.current?.focus() }, [feedback])
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo(0, 0) }, [game, round, attempt])
  const current = mechanics.find(m => m.id === game), review = game ? reviews[game] ?? emptyReview : emptyReview
  const changeReview = (patch: Partial<Review>) => { if (game) setReviews(old => ({ ...old, [game]: { ...(old[game] ?? emptyReview), ...patch } })) }
  const reset = () => { setFeedback(null); setHint(''); setChecks(0); setHints(0) }
  const open = (id: MechanicId | null) => { reset(); setGame(id); setRound(0); setAttempt(n => n + 1) }
  const selectRound = (n: number) => { reset(); setRound(n); setAttempt(a => a + 1) }
  const check = (result: Check) => {
    setFeedback(result); setChecks(n => n + 1)
    if (result.ok) changeReview({ completed: [...new Set([...review.completed, round])] })
  }
  return <main className={s.page}>
    <header className={s.header}><Link href="/profile">LessonQuest</Link><span>Laboratory mechanics</span>{game && <button onClick={() => open(null)}>To all games</button>}</header>
    {!current ? <>
      <section className={s.intro}><h1 ref={heading} tabIndex={-1}>Short simulators.</h1><p><Link href="/lab/missions">100 scenario games →</Link> Missions with several related mechanics, shared resources and changing conditions.</p><p>There are 8 separate training mechanics, three exercises each.</p><p className={s.muted}>Choose a simulator → go through the episode → mark what is worth developing. Completed steps and feedback are saved in this browser. An unfinished stage of the simulator starts again when you exit.</p></section>
      <div className={s.catalog}>{mechanics.map((m, i) => <article key={m.id}><div className={s.cardTop}><span>{String(i + 1).padStart(2, '0')} / {m.subject}</span><small>{reviews[m.id]?.completed.length ?? 0} out of 3</small></div><h2>{m.title}</h2><p>{m.action}</p><small>{m.audience}</small><div className={s.cardBottom}><button className={s.primary} disabled={!ready} onClick={() => open(m.id)}>Try it</button><span>{verdicts.find(v => v.id === reviews[m.id]?.verdict)?.title ?? 'Not rated yet'}</span></div></article>)}</div>
    </> : <>
      <section className={s.gameHeading}><p>{current.subject} · {current.audience}</p><h1 ref={heading} tabIndex={-1}>{current.title}</h1><p className={s.story}>{scenarios[current.id].story}</p><div className={s.rounds} aria-label="Scenario Stages">{[0, 1, 2].map(n => <button key={n} aria-pressed={round === n} disabled={n > 0 && !review.completed.includes(n - 1)} onClick={() => selectRound(n)}>{n + 1}. {scenarios[current.id].chapters[n]}{review.completed.includes(n) ? ' ✓' : ''}</button>)}</div></section>
      <div className={s.gameLayout}><section className={s.game} aria-label="Playing field">
        <div className={s.brief}><h2>{scenarios[current.id].chapters[round]}</h2><p>{scenarios[current.id].briefs[round]}</p></div>
        <fieldset disabled={feedback?.ok} className={s.gameControls}><MiniGame key={`${game}:${round}:${attempt}`} id={game!} round={round} onCheck={check} onHint={text => { setHint(text); setHints(n => n + 1) }} /></fieldset>
        {hint && <aside className={s.hint} role="status"><strong>Hint</strong><p>{hint}</p></aside>}
        {feedback && <div ref={feedbackRef} tabIndex={-1} className={s.feedback} data-ok={feedback.ok} role="status"><h2>{feedback.ok ? round === 2 ? 'Scenario completed' : 'Stage passed' : 'The plan hasn\'t worked yet'}</h2><p>{feedback.message}</p>{feedback.ok && <p className={s.ending}>{scenarios[current.id].endings[round]}</p>}<small>Checks: {checks} · {hints ? 'with a hint' : 'no hints'}</small>{feedback.ok && <div className={s.actions}>{round < 2 ? <button className={s.primary} onClick={() => selectRound(round + 1)}>Continue story</button> : <button className={s.primary} onClick={() => open(null)}>Choose another game</button>}<button onClick={() => selectRound(round)}>Try another way</button></div>}</div>}
      </section>
      <aside className={s.review}><h2>Should we leave it to the mechanics?</h2><p>{current.question}</p><div className={s.verdicts}>{verdicts.map(v => <button key={v.id} aria-pressed={review.verdict === v.id} onClick={() => changeReview({ verdict: v.id })}>{v.title}</button>)}</div><label>What did you like or dislike?<textarea maxLength={1000} value={review.note} onChange={ev => changeReview({ note: ev.target.value })} placeholder="For example: it’s interesting to distribute the parts, but it takes a long time to choose the span." /></label><small>{saveError ? 'The browser did not save the review.' : 'The review is saved automatically.'}</small><p className={s.muted}>We do not estimate the solution time. What is important is action, an explanation of the error, and the desire to continue.</p><button className={s.subtle} onClick={() => open(null)}>Return to games list</button></aside></div>
    </>}
    {saveError && <p role="alert" className={s.storageError}>Browser storage is unavailable. You can play, but after closing the page, the results and reviews may be lost.</p>}
    <footer className={s.footer}>Prototypes for choosing mechanics. Graphics, common island and AI - after checking interest in the game.<Link href="/profile">In profile and previous games</Link></footer>
  </main>
}
