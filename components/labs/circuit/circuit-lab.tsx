'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, RotateCw, X, Download, ArrowUpRight } from 'lucide-react'
import { companionHint, createSession, limits, type Dial } from '@/lib/circuit-lab/session'
import type { Point, SceneFrame, createCircuitScene } from './scene'
import styles from './circuit.module.css'

const number = (value: number, digits = 2) => value.toLocaleString('en-US', { maximumFractionDigits: digits })
const emptyFrame: SceneFrame = { anchors: {}, selected: null, dragging: null, hover: null, reacting: false }
const wires = [
  ['Red lead', 'Switch terminal'], ['Rheostat lead', 'Left rheostat terminal'],
  ['Lamp lead', 'Right lamp terminal'], ['Return lead', 'Negative supply terminal'],
]

export function CircuitLab() {
  const [session] = useState(createSession)
  const host = useRef<HTMLDivElement>(null), view = useRef<ReturnType<typeof createCircuitScene> | null>(null)
  const [world, setWorld] = useState(emptyFrame), [loaded, setLoaded] = useState(false), [error, setError] = useState('')
  const [notebook, setNotebook] = useState(false), [petHint, setPetHint] = useState(false)
  const bookButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!host.current) return
    let cancelled = false, dispose: (() => void) | undefined
    const container = host.current
    import('./scene').then(({ createCircuitScene }) => {
      if (cancelled) return
      const scene = createCircuitScene(container, session, { frame: setWorld, ready: () => setLoaded(true), error: setError, hint: () => setPetHint(value => !value) })
      view.current = scene; dispose = scene.dispose
    }).catch(() => { if (!cancelled) setError('Could not start the scene. Enable hardware acceleration and reload.') })
    return () => { cancelled = true; dispose?.(); view.current = null }
  }, [session])
  useEffect(() => {
    if (!petHint) return
    const timer = setTimeout(() => setPetHint(false), 7500)
    return () => clearTimeout(timer)
  }, [petHint])
  const result = session.result()
  const prompt = world.selected !== null ? 'Move the lead to the glowing terminal'
    : !session.complete() ? (!session.connected[0] ? 'Connect the red lead to the switch' : 'Reconnect the loose lead')
    : !session.switchClosed ? 'Lower the white handle to close the circuit'
    : world.dragging === 'voltage' || world.hover === 'voltage' ? 'More voltage — more current'
    : world.dragging === 'resistance' || world.hover === 'resistance' ? 'More resistance — less current'
    : world.hover === 'pet' ? 'Doge has a hint'
    : 'It is lit! Turn the large knob on the right'
  const closeBook = () => { setNotebook(false); requestAnimationFrame(() => bookButton.current?.focus()) }
  function download() {
    const rows = ['Voltage (V);Rheostat (ohm);Current (A);Lamp power (W);Circuit', ...session.measurements.map(row => [number(row.voltage), number(row.resistance), number(row.current, 3), number(row.power, 3), row.closed ? 'Closed' : 'Open'].join(';'))]
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' })), link = document.createElement('a')
    link.href = url; link.download = 'electric-circuit-measurements.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  function dialKey(event: React.KeyboardEvent, id: Dial) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const range = limits[id]
    session.dial(id, event.key === 'Home' ? range.min : event.key === 'End' ? range.max : session[id] + (['ArrowUp', 'ArrowRight'].includes(event.key) ? range.step : -range.step))
    session.record()
  }

  return <main className={styles.lab}>
    <div className={styles.backdrop} />
    <section className={styles.stage} aria-label="Electric circuit in the night depot" inert={notebook} data-powered={result.current > 0}>
      <div ref={host} className={styles.canvas} />
      <header className={styles.header}>
        <Link href="/" aria-label="Home" className={styles.round}><ArrowLeft /></Link>
        <h1>Electric Circuit</h1>
        <button className={styles.round} aria-label="Start over" onClick={() => { session.reset(); view.current?.reset(); setPetHint(false) }}><RotateCcw /></button>
      </header>
      {!loaded && !error && <div className={styles.loading}><i />Preparing the experiment…</div>}
      {error && <div className={styles.error} role="alert">{error}<button onClick={() => location.reload()}>Try again</button></div>}
      {loaded && !error && <div className={styles.overlay}>
        {wires.map(([name, terminal], id) => <div key={name}>
          <WorldAt anchor={world.anchors['lead' + id]} className={styles.lead}>
            <button aria-label={name} aria-pressed={world.selected === id} data-connected={session.connected[id]} data-loose={!session.connected[id]}
              onPointerDown={event => { event.preventDefault(); view.current?.beginWire(id, event) }}
              onClick={event => { if (event.detail === 0) view.current?.selectWire(id) }} />
          </WorldAt>
          {!session.connected[id] && <WorldAt anchor={world.anchors['terminal' + id]} className={styles.terminal}>
            <button aria-label={terminal} data-target={world.selected === id} onClick={() => view.current?.connectWire(id)} />
          </WorldAt>}
        </div>)}
        {(['voltage', 'resistance'] as const).map(id => <WorldAt key={id} anchor={world.anchors[id]} className={styles.dial + ' ' + (id === 'resistance' ? styles.largeDial : '')}>
          <button role="slider" aria-label={id === 'voltage' ? 'Supply voltage' : 'Rheostat resistance'} aria-valuemin={limits[id].min} aria-valuemax={limits[id].max} aria-valuenow={session[id]}
            aria-valuetext={number(session[id]) + (id === 'voltage' ? ' volts' : ' ohms')}
            onPointerEnter={() => view.current?.inspect(id)} onPointerLeave={() => view.current?.inspect(null)}
            onPointerDown={event => { event.preventDefault(); view.current?.beginDial(id, event) }} onKeyDown={event => dialKey(event, id)} />
        </WorldAt>)}
        <WorldAt anchor={world.anchors.switch} className={styles.switch}>
          <button role="switch" aria-label="Circuit switch" aria-checked={session.switchClosed} onClick={() => session.toggle()} />
        </WorldAt>
        <WorldAt anchor={world.anchors.voltageReadout} className={styles.voltageReadout}>
          <output aria-label="Voltage">{number(session.voltage)} <small>V</small></output>
        </WorldAt>
        <WorldAt anchor={world.anchors.resistanceReadout} className={styles.resistanceReadout}>
          <output aria-label="Resistance">{session.resistance} <small>Ω</small></output>
        </WorldAt>
        <WorldAt anchor={world.anchors.currentReadout} className={styles.currentReadout}>
          <small>CURRENT</small><output aria-label="Current">{number(result.current, 3)} <small>A</small></output>
        </WorldAt>
        <WorldAt anchor={world.anchors.pet} className={styles.pet}>
          <button aria-label="Doge — experiment hint" data-reaction={world.reacting ? 'reacting' : 'idle'} onClick={() => view.current?.greet()} onPointerEnter={() => view.current?.inspect('pet')} onPointerLeave={() => view.current?.inspect(null)} />
        </WorldAt>
        {petHint && <p className={styles.petHint} role="status">{companionHint(session)}</p>}
        <WorldAt anchor={world.anchors.notebook} className={styles.book}>
          <button ref={bookButton} aria-label="Open measurements" onClick={() => { session.record(); setNotebook(true) }}><span>Measurements</span></button>
        </WorldAt>
      </div>}
      {loaded && !error && <p className={styles.prompt} aria-live="polite">{prompt}</p>}
    </section>
    <p className={styles.rotateHint}><RotateCw size={18} />Rotate your phone for a larger experiment</p>
    {notebook && <div className={styles.scrim} onClick={closeBook}>
      <section className={styles.notebook} role="dialog" aria-modal="true" aria-label="Measurements" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === 'Escape') closeBook()
        if (event.key === 'Tab') {
          const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], summary'), first = controls[0], last = controls[controls.length - 1]
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
        }
      }}>
        <div className={styles.notebookHeader}><h2>Light the bulb</h2><button autoFocus aria-label="Close measurements" onClick={closeBook}><X size={20} /></button></div>
        <p>Close the circuit. Change one variable at a time: first voltage, then resistance. Compare current and brightness. Disconnect any lead — what happens to the current?</p>
        <div className={styles.tableScroll}><table><thead><tr><th>Supply, V</th><th>Rheostat, Ω</th><th>Current, A</th><th>Lamp, W</th><th>Circuit</th></tr></thead><tbody>{session.measurements.map(row => <tr key={row.id}><td>{number(row.voltage)}</td><td>{row.resistance}</td><td>{number(row.current, 3)}</td><td>{number(row.power, 3)}</td><td>{row.closed ? 'Closed' : 'Open'}</td></tr>)}</tbody></table></div>
        <button className={styles.download} disabled={!session.measurements.length} onClick={download}><Download size={16} />Download results</button>
        <details><summary>How the experiment works</summary>
          <p>All components are connected in series, so the current is the same throughout the circuit. Ohm’s law: I = U / (Rlamp + Rrheostat). Lamp power P = I²Rlamp. An open circuit carries no current.</p>
          <p>Teaching model: a 3–12 V supply, a constant 12 Ω lamp and a 0–36 Ω rheostat. A real filament changes resistance with temperature; here resistance is fixed to isolate Ohm’s law. Leads and the switch are ideal. The light dots show conventional current from positive to negative, with speed and brightness amplified for visibility.</p>
          <p>With a mouse or finger: drag a lead to the glowing terminal; drag knobs right or up to increase a value. With a keyboard: Tab selects an object; Enter picks up a lead, then select its terminal and press Enter. Arrow keys turn a knob; Home and End select its minimum and maximum.</p>
        </details>
        <a href="https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc" target="_blank" rel="noreferrer">Reference: PhET Circuit Construction Kit<ArrowUpRight size={13} /></a>
      </section>
    </div>}
  </main>
}

function WorldAt({ anchor, className, children }: { anchor?: Point; className: string; children: ReactNode }) {
  if (!anchor) return null
  return <div className={styles.worldAt + ' ' + className} style={{ '--x': anchor.x + 'px', '--y': anchor.y + 'px' } as CSSProperties}>{children}</div>
}
