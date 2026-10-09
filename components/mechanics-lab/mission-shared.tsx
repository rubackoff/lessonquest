'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Result } from '@/lib/scenario-missions'
import s from './missions.module.css'

type Saved = { phase: number; done: boolean }
export function useMission<T extends Saved>(id: string, initial: T) {
  const [state, setState] = useState(initial), [ready, setReady] = useState(false), [saveError, setSaveError] = useState(false)
  const [notice, setNotice] = useState<Result | null>(null), defaults = useRef(initial)
  useEffect(() => {
    let value = defaults.current
    try {
      const parsed = JSON.parse(localStorage.getItem(`corgi.missions.v1.${id}`) ?? 'null')
      const valid = parsed && Object.entries(defaults.current).every(([key, fallback]) => {
        const v = parsed[key]
        if (Array.isArray(fallback)) return Array.isArray(v) && v.length < 100 && v.every(n => typeof n === 'number' && Number.isFinite(n))
        return typeof v === typeof fallback && (typeof v !== 'number' || Number.isFinite(v))
      })
      if (valid && Number.isInteger(parsed.phase) && parsed.phase >= 0 && parsed.phase <= 3) value = parsed
    } catch { /* A damaged draft starts a fresh mission. */ }
    queueMicrotask(() => { setState(value); setReady(true) })
  }, [id])
  useEffect(() => { if (!ready) return; try { localStorage.setItem(`corgi.missions.v1.${id}`, JSON.stringify(state, (_, value) => typeof value === 'number' && !Number.isFinite(value) ? 0 : value)) } catch { queueMicrotask(() => setSaveError(true)) } }, [id, ready, state])
  function update(patch: Partial<T>) { setState(v => ({ ...v, ...patch })); setNotice(null) }
  function check(result: Result, patch?: Partial<T>) { setNotice(result); if (result.ok && patch) setState(v => ({ ...v, ...patch })) }
  return { state, ready, saveError, notice, update, check, reset: () => { setState(defaults.current); setNotice(null) } }
}

export function Frame({ phases, phase, done, ready, saveError, notice, resources, children, reset, ending }: {
  phases: string[]; phase: number; done: boolean; ready: boolean; saveError: boolean; notice: Result | null;
  resources: string[]; children: ReactNode; reset: () => void; ending: string
}) {
  const heading = useRef<HTMLHeadingElement>(null), [review, setReview] = useState('')
  useEffect(() => { heading.current?.focus({ preventScroll: true }); if (phase > 0 || done) heading.current?.scrollIntoView({ block: 'start' }) }, [phase, done])
  return <>
    <ol className={s.steps}>{phases.map((label, i) => <li key={label} data-active={phase === i && !done} data-done={i < phase || done}><span>{i < phase || done ? '✓' : i + 1}</span>{label}</li>)}</ol>
    <div className={s.resources}>{resources.map(r => <span key={r}>{r}</span>)}</div>
    <section className={s.field}>
      <div className={s.stageHeading}><p>{done ? 'Mission completed' : `Stage ${phase + 1} / ${phases.length}`}</p><h2 ref={heading} tabIndex={-1}>{done ? 'The plan worked' : phases[phase]}</h2></div>
      {!ready ? <p>Restoring the mission...</p> : done ? <div className={s.finish}><p>{ending}</p><p>What solutions would you like to try differently?</p><div className={s.row}>{['I want another mission', 'There are interesting points', 'Bored yet'].map(label => <button key={label} aria-pressed={review === label} onClick={() => setReview(label)}>{label}</button>)}</div>{review && <p role="status">Discussion tag: &quot;{review}&quot; It lasts until you exit the game.</p>}<button onClick={reset}>Replay with a different plan</button></div> : children}
      {notice && <div className={s.notice} data-ok={notice.ok} role="status">{notice.message}</div>}
    </section>
    <div className={s.save}>{saveError ? 'The browser did not save the progress. Do not close the page before completion.' : 'The progress is saved on this device, including the unfinished stage.'}{!done && <button onClick={reset}>Start this mission again</button>}</div>
  </>
}
export function NumberField({ label, value, onChange, min = 0, max = 99, step = 1 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number | 'any' }) {
  return <label className={s.number}>{label}<input type="number" inputMode={step === 'any' ? 'decimal' : 'numeric'} min={min} max={max} step={step} value={Number.isNaN(value) ? '' : value} onChange={e => onChange(e.target.value === '' ? NaN : Number(e.target.value))} /></label>
}
export function Choice({ title, children, selected, onClick }: { title: string; children?: ReactNode; selected: boolean; onClick: () => void }) {
  return <button className={s.choice} aria-pressed={selected} onClick={onClick}><strong>{title}</strong>{children && <span>{children}</span>}</button>
}
export function Brief({ children }: { children: ReactNode }) { return <div className={s.brief}>{children}</div> }
export function Go({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) { return <button className={s.primary} disabled={disabled} onClick={onClick}>{children}</button> }
export function Grid({ cells, onCell, label }: { cells: { text: string; type?: string; label: string; disabled?: boolean; style?: CSSProperties }[]; onCell: (i: number) => void; label: string }) {
  return <div className={s.grid} role="group" aria-label={label}>{cells.map((cell, i) => <button key={i} disabled={cell.disabled} data-type={cell.type} style={cell.style} aria-label={cell.label} onClick={() => onCell(i)}>{cell.text}<small>{i % 5}; {4 - Math.floor(i / 5)}</small></button>)}</div>
}
export function toggle(items: number[], value: number) { return items.includes(value) ? items.filter(i => i !== value) : [...items, value] }
