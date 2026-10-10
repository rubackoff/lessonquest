'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, RotateCw, X, Download, ArrowUpRight } from 'lucide-react'
import { companionHint, createSession } from '@/lib/refraction-lab/session'
import { materials } from '@/lib/refraction-lab/physics'
import type { Point, SceneFrame, createRefractionScene } from './scene'
import styles from './refraction.module.css'

const number = (value: number, digits = 1) => value.toLocaleString('en-US', { maximumFractionDigits: digits })
const emptyFrame: SceneFrame = { anchors: {}, hover: null, dragging: false, petReacting: false }

export function RefractionLab() {
  const [session] = useState(createSession)
  const host = useRef<HTMLDivElement>(null), view = useRef<ReturnType<typeof createRefractionScene> | null>(null)
  const [world, setWorld] = useState(emptyFrame), [loaded, setLoaded] = useState(false), [error, setError] = useState('')
  const [notebook, setNotebook] = useState(false), [petHint, setPetHint] = useState(false)
  const bookButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!host.current) return
    let cancelled = false, dispose: (() => void) | undefined
    const container = host.current
    import('./scene').then(({ createRefractionScene }) => {
      if (cancelled) return
      const scene = createRefractionScene(container, session, {
        frame: setWorld, ready: () => setLoaded(true), error: setError, hint: () => setPetHint(value => !value),
      })
      view.current = scene; dispose = scene.dispose
    }).catch(() => { if (!cancelled) setError('Could not start the scene. Enable hardware acceleration and reload.') })
    return () => { cancelled = true; dispose?.(); view.current = null }
  }, [session])
  useEffect(() => {
    if (!petHint) return
    const timer = setTimeout(() => setPetHint(false), 6500)
    return () => clearTimeout(timer)
  }, [petHint])
  const result = session.optics()
  const prompt = !session.power ? 'Switch on the laser'
    : world.dragging ? (result.totalReflection ? 'All the light is reflected!' : 'Move the laser around the circle')
    : world.hover === 'pet' ? 'Smudge has a hint'
    : result.totalReflection ? 'Total internal reflection'
    : result.inside ? 'Light travels into air'
    : 'Turn the laser'
  const closeBook = () => { setNotebook(false); requestAnimationFrame(() => bookButton.current?.focus()) }
  function download() {
    const rows = ['Material;Direction;Incidence angle (deg);Refraction angle (deg);Reflection (%)', ...session.measurements.map(row => [row.material, row.direction, number(row.incidence, 2), row.refraction === null ? 'Total reflection' : number(row.refraction, 2), number(row.reflection * 100, 2)].join(';'))]
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' })), link = document.createElement('a')
    link.href = url; link.download = 'refraction-measurements.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <main className={styles.lab}>
    <div className={styles.backdrop} />
    <section className={styles.stage} aria-label="Refraction on the lighthouse terrace" inert={notebook}>
      <div ref={host} className={styles.canvas} />
      <header className={styles.header}>
        <Link href="/" aria-label="Home" className={styles.round}><ArrowLeft /></Link>
        <h1>Refraction</h1>
        <button className={styles.round} aria-label="Start over" title="Start over" onClick={() => { session.reset(); setPetHint(false) }}><RotateCcw /></button>
      </header>
      {!loaded && !error && <div className={styles.loading}><i />Preparing the experiment…</div>}
      {error && <div className={styles.error} role="alert">{error}<button onClick={() => location.reload()}>Try again</button></div>}
      {loaded && !error && <div className={styles.overlay}>
        {Array.from({ length: 12 }, (_, i) => i * 30).map(mark => <WorldAt key={mark} anchor={world.anchors['mark' + mark]} className={styles.mark}>
          {Math.round(Math.acos(Math.abs(Math.cos(mark * Math.PI / 180))) * 180 / Math.PI)}
        </WorldAt>)}
        <WorldAt anchor={world.anchors.laser} className={styles.laser}>
          <button aria-label="Laser position" role="slider" aria-valuemin={-180} aria-valuemax={180} aria-valuenow={session.rotation}
            aria-valuetext={number(result.incidence) + ' degrees, ' + (result.inside ? 'from material into air' : 'from air into material')}
            onPointerEnter={() => view.current?.inspect('laser')} onPointerLeave={() => view.current?.inspect(null)}
            onPointerDown={event => { event.preventDefault(); view.current?.begin(event) }}
            onKeyDown={event => {
              if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
                event.preventDefault()
                session.rotate(event.key === 'Home' ? 0 : event.key === 'End' ? 180 : session.rotation + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 3 : -3))
                session.record()
              }
            }} />
        </WorldAt>
        {session.power && <>
          <WorldAt anchor={world.anchors.angleIn} className={styles.angle}>{number(result.incidence)}°</WorldAt>
          {!result.totalReflection && <WorldAt anchor={world.anchors.angleOut} className={styles.angle}>{number(result.refraction!)}°</WorldAt>}
        </>}
        <WorldAt anchor={world.anchors.incidence} className={styles.lcd}>
          <small>INCIDENCE</small><output aria-label="Incidence angle">{session.power ? number(result.incidence) + '°' : '—'}</output>
        </WorldAt>
        <WorldAt anchor={world.anchors.refraction} className={styles.lcd}>
          <small>REFRACTION</small><output aria-label="Refraction angle">{session.power && result.refraction !== null ? number(result.refraction) + '°' : '—'}</output>
        </WorldAt>
        {materials.map(material => <WorldAt key={material.id} anchor={world.anchors[material.id]} className={styles.material}>
          <button aria-label={material.name} aria-pressed={session.material === material.id} onClick={() => session.choose(material.id)} />
        </WorldAt>)}
        <WorldAt anchor={world.anchors.power} className={styles.power}>
          <button aria-label={session.power ? 'Switch off laser' : 'Switch on laser'} aria-pressed={session.power} onClick={() => session.toggle()} />
        </WorldAt>
        <WorldAt anchor={world.anchors.avatar} className={styles.avatar}>
          <button aria-label="Greet the character" onClick={() => view.current?.greet('avatar')} />
        </WorldAt>
        <WorldAt anchor={world.anchors.pet} className={styles.pet}>
          <button aria-label="Smudge — experiment hint" data-reaction={world.petReacting ? 'reacting' : 'idle'} onPointerEnter={() => view.current?.inspect('pet')} onPointerLeave={() => view.current?.inspect(null)} onClick={() => view.current?.greet('pet')} />
          {petHint && <p role="status">{companionHint(session)}</p>}
        </WorldAt>
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
          const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], summary')
          const first = controls[0], last = controls[controls.length - 1]
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
        }
      }}>
        <div className={styles.notebookHeader}><h2>Catch the bending light</h2><button autoFocus aria-label="Close measurements" onClick={closeBook}><X size={20} /></button></div>
        <p>Turn the laser and compare materials. On the lower half of the circle, find the angle at which light stops escaping into air.</p>
        <div className={styles.tableScroll}><table><thead><tr><th>Material</th><th>Direction</th><th>Incidence</th><th>Refraction</th><th>Reflected</th></tr></thead><tbody>{session.measurements.map(row => <tr key={row.id}><td>{row.material}</td><td>{row.direction}</td><td>{number(row.incidence)}°</td><td>{row.refraction === null ? 'Total reflection' : number(row.refraction) + '°'}</td><td>{number(row.reflection * 100)}%</td></tr>)}</tbody></table></div>
        <button className={styles.download} disabled={!session.measurements.length} onClick={download}><Download size={16} />Download results</button>
        <details><summary>How the experiment works</summary>
          <p>The upper half is air; the lower half is the selected material. Angles are measured from the vertical dashed line, the normal to the boundary. Change one variable at a time: first the angle, then the material at the same angle.</p>
          <p>Snell’s law: n₁ sin α = n₂ sin β. Water: n = 1.333; glass: 1.50; diamond: 2.42. When light leaves the material, the critical angle is arcsin(1/n). For glass, it is about 41.8°.</p>
          <p>This is an ideal boundary with no absorption. Energy fractions use the Fresnel equations for unpolarized light; brightness is amplified to make weak reflections visible. Refractive indices are constant. The semicircle represents the selected material; losses at its outer edge are ignored.</p>
        </details>
        <a href="https://phet.colorado.edu/en/simulations/bending-light" target="_blank" rel="noreferrer">Reference: PhET Bending Light<ArrowUpRight size={13} /></a>
      </section>
    </div>}
  </main>
}

function WorldAt({ anchor, className, children }: { anchor?: Point; className: string; children: ReactNode }) {
  if (!anchor) return null
  return <div className={styles.worldAt + ' ' + className} style={{ '--x': anchor.x + 'px', '--y': anchor.y + 'px' } as CSSProperties}>{children}</div>
}
