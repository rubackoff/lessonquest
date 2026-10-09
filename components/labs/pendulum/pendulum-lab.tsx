'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, Pause, Play, X, Download, ArrowUpRight, RotateCw } from 'lucide-react'
import { companionHint, createSession, observation } from '@/lib/pendulum-lab/session'
import type { Anchor, SceneFrame, createPendulumScene } from './scene'
import styles from './pendulum.module.css'

const number = (value: number, digits = 2) => value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })
const emptyFrame: SceneFrame = { anchors: {}, hover: null, drag: null }

export function PendulumLab() {
  const [session] = useState(createSession)
  const host = useRef<HTMLDivElement>(null), view = useRef<ReturnType<typeof createPendulumScene> | null>(null)
  const [world, setWorld] = useState(emptyFrame), [loaded, setLoaded] = useState(false), [error, setError] = useState('')
  const [notebook, setNotebook] = useState(false), [petHint, setPetHint] = useState(false)
  const bookButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!host.current) return
    let cancelled = false, dispose: (() => void) | undefined
    const container = host.current
    import('./scene').then(({ createPendulumScene }) => {
      if (cancelled) return
      const scene = createPendulumScene(container, session, {
        frame: setWorld, ready: () => setLoaded(true), error: setError,
        hint: () => setPetHint(value => !value), notebook: () => { session.pause(); setNotebook(true) },
      })
      view.current = scene; dispose = scene.dispose
    }).catch(() => { if (!cancelled) setError('Failed to run scene. Turn on hardware acceleration and refresh the page.') })
    return () => { cancelled = true; dispose?.(); view.current = null }
  }, [session])
  useEffect(() => {
    if (!petHint) return
    const timer = setTimeout(() => setPetHint(false), 6500)
    return () => clearTimeout(timer)
  }, [petHint])
  const hover = world.drag ?? world.hover
  const result = observation(session)
  function download() {
    const lines = ['Pendulum;Length (m);Mass (kg);Angle;g (m/s2);Resistance;Period (s)', ...session.measurements.map(row => [row.pendulum, row.length, row.mass, row.angle, row.gravity, row.friction, row.period.toFixed(4)].join(';'))]
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })), link = document.createElement('a')
    link.href = url; link.download = 'Pendulum - measurements.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const act = (id: string) => view.current?.activate(id)
  const begin = (id: string, event: React.PointerEvent) => { event.preventDefault(); view.current?.begin(id, event) }
  const closeBook = () => { setNotebook(false); bookButton.current?.focus() }
  const prompt = hover?.startsWith('length') ? 'Pull the handle up - shorten the thread'
    : hover?.startsWith('mass') ? 'Transfer the weight to the pendulum'
    : hover === 'avatar' ? 'Let\'s watch together'
    : hover === 'pet' ? 'The fox will tell you'
    : world.drag?.startsWith('bob') ? 'Let go'
    : !session.interactions ? 'Pull and release'
    : session.states.some(state => state.period === null) ? 'Watch the complete swing'
    : result.title

  return <main className={styles.lab}>
    <div className={styles.backdrop} />
    <section className={styles.stage} aria-label="Interactive pendulum laboratory">
      <div ref={host} className={styles.canvas} />
      <header className={styles.header}>
        <Link href="/" aria-label="Home" className={styles.round}><ArrowLeft /></Link>
        <h1>Pendulum</h1>
        <button className={styles.round} aria-label="Start over" title="Start over" onClick={() => { session.resetAll(); setPetHint(false) }}><RotateCcw /></button>
      </header>
      {!loaded && !error && <div className={styles.loading}><i />We are preparing an experiment...</div>}
      {error && <div className={styles.error} role="alert">{error}<button onClick={() => location.reload()}>Repeat</button></div>}
      {loaded && !error && <div className={styles.overlay}>
        {[0, 1].map(i => <div key={i}>
          <WorldAt anchor={world.anchors['length' + i]} className={styles.length}>
            <span>{number(session.settings[i].length)} m</span>
          </WorldAt>
          <WorldAt anchor={world.anchors['knob' + i]} className={styles.knob}>
            <button aria-label={'Pendulum length ' + (i + 1)} role="slider" aria-valuemin={.55} aria-valuemax={1.8} aria-valuenow={session.settings[i].length} aria-valuetext={number(session.settings[i].length) + ' meters'}
              onPointerEnter={() => view.current?.inspect('length' + i)} onPointerLeave={() => view.current?.inspect(null)}
              onPointerDown={event => begin('length' + i, event)}
              onKeyDown={event => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                  event.preventDefault()
                  const length = event.key === 'Home' ? .55 : event.key === 'End' ? 1.8 : session.settings[i].length + (['ArrowDown', 'ArrowRight'].includes(event.key) ? .05 : -.05)
                  session.setLength(i, Math.min(1.8, length)); session.launch()
                }
              }} />
          </WorldAt>
          <WorldAt anchor={world.anchors['bob' + i]} className={styles.bobLabel}>
            <button aria-label={'Pendulum ' + (i + 1) + ': ' + number(session.settings[i].mass, 1) + ' kg. Drag or use the arrows.'}
              data-bob={i} onPointerDown={event => begin('bob' + i, event)}
              onKeyDown={event => {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                  event.preventDefault(); session.pull(i, Math.max(-35, Math.min(35, session.settings[i].angle + (event.key === 'ArrowRight' ? 2 : -2))))
                } else if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); session.launch() }
              }}>{number(session.settings[i].mass, session.settings[i].mass % 1 ? 1 : 0)} kg</button>
          </WorldAt>
          <WorldAt anchor={world.anchors['period' + i]} className={styles.period}>
            <output aria-label={'Pendulum period ' + (i + 1)}>{session.states[i].period === null ? '— —' : number(session.states[i].period!)}<small> s</small></output>
          </WorldAt>
          {world.drag?.startsWith('bob') && <WorldAt anchor={world.anchors['angle' + i]} className={styles.angle}>{Math.abs(session.settings[i].angle)}°</WorldAt>}
        </div>)}
        {[.5, 1, 2].map((mass, i) => <WorldAt key={mass} anchor={world.anchors['mass' + i]} className={styles.weight}>
          <button aria-label={'Kettlebell ' + mass + ' kg. Transfer to the pendulum or click for the selected one.'}
            onPointerEnter={() => view.current?.inspect('mass' + i)} onPointerLeave={() => view.current?.inspect(null)}
            onPointerDown={event => begin('mass' + i, event)} onClick={event => { if (event.detail === 0) act('mass' + i) }} />
        </WorldAt>)}
        <WorldAt anchor={world.anchors.play} className={styles.play}>
          <button aria-label={session.running ? 'Pause' : 'Launch'} onClick={() => act('play')}>{session.running ? <Pause /> : <Play />}<span>{session.running ? 'Pause' : 'Start'}</span></button>
        </WorldAt>
        <WorldAt anchor={world.anchors.avatar} className={styles.avatar}>
          <button aria-label="Call a character" onPointerEnter={() => view.current?.inspect('avatar')} onPointerLeave={() => view.current?.inspect(null)} onClick={() => act('avatar')} />
        </WorldAt>
        <WorldAt anchor={world.anchors.pet} className={styles.pet}>
          <button aria-label="Pet hint" onPointerEnter={() => view.current?.inspect('pet')} onPointerLeave={() => view.current?.inspect(null)} onClick={() => act('pet')} />
          {petHint && <p role="status">{companionHint(session)}</p>}
        </WorldAt>
        <WorldAt anchor={world.anchors.notebook} className={styles.book}>
          <button ref={bookButton} aria-label="Open measurements" onClick={() => act('notebook')}><span>Measurements</span></button>
        </WorldAt>
      </div>}
      {loaded && !error && <p className={styles.prompt} aria-live="polite">{prompt}</p>}
    </section>
    <p className={styles.rotateHint}><RotateCw size={18} />Turn your phone and the stand will become larger</p>
    {notebook && <div className={styles.scrim} onClick={closeBook}>
      <section className={styles.notebook} role="dialog" aria-modal="true" aria-label="Measurements" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === 'Escape') closeBook()
        if (event.key === 'Tab') {
          const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], summary')
          const first = controls[0], last = controls[controls.length - 1]
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
        }
      }}>
        <div className={styles.notebookHeader}><h2>Measurements</h2><button autoFocus aria-label="Close measurements" onClick={closeBook}><X size={20} /></button></div>
        <p>Change one parameter at a time and compare the full period.</p>
        {session.measurements.length ? <div className={styles.tableScroll}><table><thead><tr><th>Pendulum</th><th>Thread</th><th>Weight</th><th>Period</th></tr></thead><tbody>{session.measurements.map(row => <tr key={row.id}><td>{row.pendulum === 1 ? 'Blue' : 'Red'}</td><td>{number(row.length)} m</td><td>{number(row.mass, 1)} kg</td><td>{number(row.period, 3)} s</td></tr>)}</tbody></table></div> : <div className={styles.empty}>Release the pendulum and wait for it to swing completely.</div>}
        <button className={styles.download} disabled={!session.measurements.length} onClick={download}><Download size={16} />Download results</button>
        <details><summary>How the experience works</summary><p>Check whether the period depends on the mass of the load. Then shorten one thread, maintaining the same amplitude.</p><p>For small angles T ≈ 2π√(L/g). Here the period is measured by movement: between two passes through the lower point in the same direction. The pendulums are modeled independently, without collisions.</p></details>
        <a href="https://phet.colorado.edu/en/simulations/pendulum-lab" target="_blank" rel="noreferrer">Reference: PhET Pendulum Lab<ArrowUpRight size={13} /></a>
      </section>
    </div>}
  </main>
}

function WorldAt({ anchor, className, children }: { anchor?: Anchor; className: string; children: ReactNode }) {
  if (!anchor?.visible) return null
  return <div className={styles.worldAt + ' ' + className} style={{ '--x': anchor.x + 'px', '--y': anchor.y + 'px' } as CSSProperties}>{children}</div>
}
