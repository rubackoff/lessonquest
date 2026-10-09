'use client'

import { useEffect } from 'react'
import { type PlayScenario, type PlayState, docks, initialPlay, moveInvestigator, neighbor, investigationRoute, investigationDestination, returnDispatch, caseSealed, submitCase, finishCensus, dispatchOnBuiltRoute, playLoops, playNames, playStep, sourceCells } from '@/lib/mission-play'
import { investigationCases } from '@/lib/mission-investigations'
import { Frame, NumberField, useMission } from './mission-shared'
import s from './active-mission.module.css'

const directions = ['North ↑', 'East →', 'South ↓', 'West ←']
const replace = (a: number[], i: number, v: number) => a.map((n, j) => j === i ? v : n)

function MapBoard({ game, state, onCell }: { game: PlayScenario; state: PlayState; onCell?: (cell: number) => void }) {
  const dispatch = game.kind === 'dispatch', sealed = game.kind === 'investigation' && caseSealed(game, state)
  return <div className={s.map} data-live-board role="group" aria-label={dispatch ? 'Live station map' : 'Research map'}>
    {Array.from({ length: 25 }, (_, cell) => {
      const dock = dispatch ? docks.indexOf(cell) : -1, source = sourceCells.indexOf(cell)
      const label = cell === 10 ? 'Warehouse' : dispatch && dock >= 0 && dock < game.sort.groups.length ? `Port ${dock + 1}` : !dispatch && source >= 0 && source < game.proof.sources.length ? `Archive ${source + 1}` : !dispatch && cell === 24 ? investigationDestination(game as Extract<PlayScenario, { kind: 'investigation' }>) + (sealed ? ' ✓' : ' ⛔') : ''
      const cargo = dispatch && dock >= 0 ? state.delivered.filter(i => game.sort.cards[i].group === dock).length : 0
      const Cell = onCell ? 'button' : 'div'
      return <Cell key={cell} onClick={onCell ? () => onCell(cell) : undefined} disabled={onCell ? state.running : undefined} aria-label={onCell ? `Go: ${label || `cell ${cell % 5}; ${4 - Math.floor(cell / 5)}`}` : undefined} className={s.cell} data-track={state.tracks.includes(cell)} data-closed={dispatch && cell === 12 && state.barrier && !state.repaired} data-dock={!!label} data-fault={dispatch && state.fault === cell}>
        <span>{label}</span>{cargo > 0 && <b aria-label={`Delivered to port ${dock + 1}: ${cargo}`}>{'▣'.repeat(cargo)}</b>}
        {dispatch && cell === 12 && state.barrier && !state.repaired && <b>Collapse</b>}
        {!dispatch && source >= 0 && state.filed.includes(source) && <b>✓</b>}
        <small>{cell % 5}; {4 - Math.floor(cell / 5)}</small>
      </Cell>
    })}
    <div className={s.actor} style={{ left: `${(state.pos % 5) * 20}%`, top: `${Math.floor(state.pos / 5) * 20}%` }} data-moving={state.running}><b>{dispatch ? state.selected >= 0 ? '▣' : '◆' : sealed ? '▣' : '●'}</b></div>
  </div>
}

function Sources({ game, state, update, archive = false, partner = false }: { game: Exclude<PlayScenario, { kind: 'dispatch' }>; state: PlayState; update: (v: Partial<PlayState>) => void; archive?: boolean; partner?: boolean }) {
  return <div className={s.sources}>{game.proof.sources.map((source, i) => <section key={source.name}>
    <h4>{i + 1}. {source.name}</h4>
    {archive || state.seen.includes(i) ? <p>{source.text}</p> : <p>Find the document in the archive {i + 1} on the map.</p>}
    {archive && <button data-file-source={i} aria-pressed={state.filed.includes(i)} disabled={state.running || state.checked.length > 0} onClick={() => update({ filed: state.filed.includes(i) ? state.filed.filter(n => n !== i) : [...state.filed, i], seen: [...new Set([...state.seen, i])], feedback: '' })}>{state.filed.includes(i) ? 'Remove from materials' : 'Accept in materials'}</button>}
    <button data-approve={i} hidden={!partner || !state.filed.includes(i)} disabled={state.approved.includes(i)} onClick={() => update({ approved: [...state.approved, i], feedback: 'The partner checked the document and handed over the permit to the student.' })}>{state.approved.includes(i) ? 'Permit issued' : 'Submit a verified document'}</button><small>Source check: {source.cost} · {state.filed.includes(i) ? 'In action' : 'Not attached'}</small>
  </section>)}</div>
}

function EvidenceBoard({ game, state, update }: { game: Exclude<PlayScenario, { kind: 'dispatch' }>; state: PlayState; update: (v: Partial<PlayState>) => void }) {
  return <div className={s.evidence} data-live-proof aria-label="Evidence board"><p><strong>{game.proof.claim}</strong></p><p>Connect each fact to the document. Budget of included sources: {game.proof.budget}. One document can confirm several facts.</p>
    {game.proof.facts.map((fact, i) => <div className={s.link} data-checked={state.checked.includes(i)} data-failed={state.fault === i} key={fact}>
      <b>{state.checked.includes(i) ? '✓' : i + 1}</b><span>{fact}</span><span aria-hidden="true">←</span><label>Source for fact {i + 1}<select data-fact={i} value={state.links[i]} disabled={state.running || state.checked.length === game.proof.facts.length} onChange={e => update({ links: replace(state.links, i, Number(e.target.value)), checked: [], fault: -1, feedback: '' })}><option value={-1}>Connect to document</option>{game.proof.sources.map((doc, j) => <option value={j} key={j} disabled={!state.filed.includes(j)}>{j + 1}. {doc.name}{!state.filed.includes(j) ? ' - not delivered' : ''}</option>)}</select></label>
    </div>)}
    {state.checked.length < game.proof.facts.length ? <button className={s.launch} disabled={state.running} onClick={() => update({ running: true, program: [], cursor: 0, checked: [], fault: -1, attempts: state.attempts + 1, feedback: 'The check proceeds through connections: document → fact → finished case.' })}>Check connections</button> : <p className={s.seal}>✓ The grounds are confirmed by documents</p>}
  </div>
}

export function ActiveMission({ game }: { game: PlayScenario }) {
  const m = useMission(`${game.kind === 'investigation' || game.mission.id === 'math-census' ? 'play-v3-' : 'play-v2-'}${game.mission.id}`, initialPlay(game)), v = m.state
  const presentation = v.mode === 'show', coop = v.mode === 'coop', tutor = coop && v.partner
  useEffect(() => {
    if (!m.ready || !v.running || (presentation && !v.autoRun) || tutor || v.done) return
    const timer = window.setTimeout(() => m.update(playStep(game, v)), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 480)
    return () => window.clearTimeout(timer)
  }, [game, m, v, presentation, tutor])
  useEffect(() => {
    if (!v.running || window.innerWidth > 760) return
    const target = game.kind !== 'dispatch' && !v.program.length && v.checked.length < game.proof.facts.length ? '[data-live-proof]' : '[data-live-board]'
    document.querySelector(target)?.scrollIntoView({ block: 'start' })
  }, [v.running, v.checked.length, v.program.length, game])
  const progress = game.kind === 'dispatch' ? `${v.delivered.length}/${game.sort.cards.length} cargo` : game.kind === 'assembly' ? `${v.product}/2 issues` : `${v.checked.length}/${game.proof.facts.length} facts`
  const ending = game.mission.id === 'math-census' ? v.feedback : game.kind === 'dispatch' ? 'Your routes have been saved, all cargo has arrived in the appropriate compartments, and the cart has returned to the warehouse. The collapse changed the current network, and you restored delivery.' : game.kind === 'assembly' ? 'Verified sources have become the input of your line. The assembled order and distribution of the team made it possible to release two batches; the change in load did not reset the structure.' : investigationCases[game.mission.id].outcome
  const execute = () => m.update({ program: [], cursor: 0, running: true, feedback: '', fault: -1, attempts: v.attempts + 1 })
  return <Frame {...m} {...v} phases={game.mission.id === 'math-census' ? ['Format selection', playNames[game.kind], 'What is known about birds?'] : ['Format selection', playNames[game.kind]]} resources={[progress, `Tests: ${v.attempts}`, `Format: ${presentation ? 'presentational' : coop ? 'two behind one screen' : 'single'}`]} ending={ending}>
    {v.phase === 0 ? <div className={s.setup}>
      <p>{playLoops[game.kind]}</p>
      <p>{game.kind === 'dispatch' ? game.sort.brief : game.kind === 'assembly' ? game.sequence.brief : game.proof.claim}</p>
      <div className={s.formats}>{[['solo','One','Control the field and watch the tests.'],['show','On the general screen','First the solution, then the presenter shows the test frame by frame.'],['coop','Co-op','The student controls the field. The partner works with a directory or sources.']].map(([id, title, detail]) => <button key={id} data-mode={id} aria-pressed={v.mode === id} onClick={() => m.update({ mode: id })}><strong>{title}</strong><span>{detail}</span></button>)}</div>
      <p>{game.kind === 'dispatch' ? 'Recognize the meaning of the cargo and direct it to the desired port. The rails remain after the trip; travel on them is free. After the second delivery the center will collapse. The final goal is to return the empty cart to the warehouse.' : game.kind === 'investigation' ? 'Carry documents to the archive: the bag holds two. The open document has not yet been attached to the case. Connect the delivered sources with facts and convey the supported conclusion to the recipient. To move, click on a location on the map.' : 'First, check the materials against the sources. Assemble the stations in a meaningful order, assign workers and run the line. The second release uses the same line, but requires one station to be strengthened.'}</p>
      <button className={s.launch} onClick={() => m.update({ phase: 1 })}>Start game</button>
    </div> : game.mission.id === 'math-census' && v.phase === 2 ? <section className={s.census}><h3>How many different birds were observed?</h3><p>The mark belongs to one bird and does not change between sites. Repetitions have already been removed from the magazine. A mere sum of numbers by area is not enough here.</p><div className={s.censusSites}>{[['North','A · B · C'],['Lake','B · D'],['Forest','No surveillance'],['Meadow','0 · camera was working']].map(([place, tags], i) => <button key={place} aria-pressed={v.selected === i} onClick={() => m.update({ selected: i, feedback: '' })}><strong>{place}</strong><span>{tags}</span><small>{v.selected === i ? '📷 Backup camera goes here' : 'Select for backup camera'}</small></button>)}</div><NumberField label="Various birds observed" value={v.chain[0] ?? 0} onChange={n => m.update({ chain: [n] })}/><p>Select an area where the backup camera will help fill in the gap. The backup camera will go to the selected area.</p><button className={s.launch} disabled={v.selected < 0} onClick={() => m.update(finishCensus(game, v))}>Approve the account and send the camera</button><p className={s.feedback} role="status">{v.feedback}</p></section> : <>
      {coop && <div className={s.roles}><p>Local play on one screen. Give control to your partner; There is no separate network connection.</p><button onClick={() => m.update({ partner: !v.partner, running: false })}>{tutor ? 'Give to student' : 'Transfer to partner'}</button></div>}
      {presentation && <p className={s.showNote}>Discuss the plan before launch. The presenter shows the consequences with the “Next frame” button; pace does not affect the result.</p>}
      {tutor ? <section className={s.partner}><h3>Partner remote control</h3><p>The student describes the situation and makes a learning decision. Provide the missing information; don&apos;t control his field.</p>
        {game.kind === 'dispatch' ? <><h4>Port code table</h4>{game.sort.groups.map((group, i) => <p key={group}>Port {i + 1}: {group}</p>)}<p>{v.barrier && !v.repaired ? 'The dispatcher sees a collapse in the center. You can order a bypass or restore the area near the cart.' : 'The central area is accessible.'}</p><button disabled={!v.barrier || v.repaired || ![7,11,13,17].includes(v.pos)} onClick={() => m.update({ repaired: true, feedback: 'The partner opened the central site. The path has been restored.' })}>Open repair passage</button></> : <><p>Choose documents that truly support the conditions. The student will receive their names and must match them with the facts.</p><Sources game={game} state={v} update={m.update} archive={game.kind === 'assembly'} partner/></>}
      </section> : game.kind === 'dispatch' ? <>
        <div className={s.layout}><section><MapBoard game={game} state={v}/><p className={s.legend}>◆ trolley · ▣ cargo · light paths have already been built. Charge: <b>{v.battery}/10</b>. Travel on the old route is 0, on the new route – 1.</p><div className={s.ports}>{game.sort.groups.map((group, i) => <button key={group} disabled={v.selected < 0 || v.running} onClick={() => m.update(dispatchOnBuiltRoute(v, i))}>Port {i + 1}: {coop ? 'partner\'s code' : group} along a familiar path</button>)}</div></section>
          <section><h3>{v.selected >= 0 ? 'Cart load' : v.pos === 10 ? 'Departure warehouse' : 'Delivery accepted'}</h3>
            <div className={s.cargo}>{game.sort.cards.map((item, i) => <button data-cargo={i} key={i} aria-pressed={v.selected === i} disabled={v.running || v.delivered.includes(i) || v.pos !== 10 || v.selected >= 0} onClick={() => m.update({ selected: i, feedback: '', program: [], cursor: 0 })}>{v.delivered.includes(i) ? '✓ ' : '▣ '}{item.text}</button>)}</div>
            {v.selected < 0 && v.pos !== 10 && <button className={s.launch} disabled={v.running} onClick={() => m.update(returnDispatch(v))}>Return along a familiar path</button>}
            <p><strong>{v.selected >= 0 ? game.sort.cards[v.selected].text : 'Trolley control'}</strong></p>
            <div className={s.commands} aria-label="Route program">{v.program.map((dir, i) => <button key={i} disabled={v.running || i < v.cursor} onClick={() => m.update({ program: v.program.filter((_, j) => j !== i) })}>{i < v.cursor ? '✓' : ''}{['↑','→','↓','←'][dir]}</button>)}</div>
            <button disabled={v.running || v.cursor === v.program.length} onClick={() => m.update({ program: v.program.slice(0, v.cursor), fault: -1 })}>Clear remaining commands</button><div className={s.controls}>{directions.map((name, dir) => <button key={dir} data-direction={dir} disabled={v.running || v.program.length - v.cursor >= 20} onClick={() => m.update({ program: [...v.program, dir], feedback: '' })}>{name}</button>)}</div>
            <button className={s.launch} disabled={v.running || v.cursor >= v.program.length} onClick={() => m.update({ running: true, fault: -1, attempts: v.attempts + 1 })}>Launch the cart</button>
            {!coop && v.barrier && !v.repaired && <button disabled={v.running || ![7,11,13,17].includes(v.pos)} onClick={() => m.update({ repaired: true, feedback: 'The repair passage is open. The completed rails are available again.' })}>Open repair passage nearby</button>}
            <button disabled={v.running || v.selected < 0} onClick={() => m.update({ pos: 10, selected: -1, battery: 10, program: [], cursor: 0, feedback: 'The cargo was returned to the warehouse. The rails and the goods already delivered were preserved.' })}>Return undelivered cargo</button>
          </section></div>
      </> : game.kind === 'investigation' ? <>
        <div className={s.layout}><section><MapBoard game={game} state={v} onCell={cell => m.update(investigationRoute(game, v, cell))}/><p className={s.legend}>● researcher · ▣ sealed case. Click on a place on the map and the character will reach it himself. Bag: {v.bag.length}/2. The warehouse accepts documents.</p><details className={s.manual}><summary>Step movement</summary><div className={s.controls}>{directions.map((label, dir) => <button data-walk={dir} key={dir} disabled={v.running || neighbor(v.pos, dir) === null} onClick={() => m.update(moveInvestigator(game, v, dir))}>{label}</button>)}</div></details><button disabled={v.running || v.pos === 10} onClick={() => m.update(investigationRoute(game, v, 10))}>Take documents to the archive</button></section>
          <section><h3>Inspection location</h3>{sourceCells.indexOf(v.pos) >= 0 && sourceCells.indexOf(v.pos) < game.proof.sources.length ? (() => { const i = sourceCells.indexOf(v.pos), doc = game.proof.sources[i]; return <div className={s.document}><h4>{doc.name}</h4><p>{coop ? 'The contents of the document are read by the partner. Deliver the find and request his conclusion.' : doc.text}</p><button data-take={i} disabled={v.bag.length >= 2 || v.bag.includes(i) || v.filed.includes(i)} onClick={() => m.update({ bag: [...v.bag, i], seen: [...new Set([...v.seen, i])], feedback: 'The document is placed in the bag. Bring it to the warehouse to attach to the case.' })}>{v.filed.includes(i) ? 'Already in action' : v.bag.includes(i) ? 'In the bag' : 'Pick up document'}</button></div> })() : <p>Reach the signed archive. The document opens only locally.</p>}<p>In the bag: {v.bag.map(i => game.proof.sources[i].name).join(', ') || 'empty'}</p><p>In action: {v.filed.map(i => game.proof.sources[i].name).join(', ') || 'nothing yet'}</p></section></div>
        <EvidenceBoard game={game} state={v} update={m.update}/>
        {v.checked.length === game.proof.facts.length && <section className={s.verdict}><h3>What conclusion do we sign?</h3><div className={s.cargo}>{investigationCases[game.mission.id].choices.map((choice, i) => <button key={choice} data-verdict={i} aria-pressed={v.selected === i} disabled={v.running || v.product === 1} onClick={() => m.update({ selected: i })}>{choice}</button>)}</div><button className={s.launch} disabled={v.selected < 0 || v.product === 1 || v.running} onClick={() => m.update(submitCase(game, v))}>{v.product === 1 ? 'The conclusion is signed · transfer the matter to the addressee' : 'Sign the output'}</button></section>}
        {!coop && <details className={s.journal}><summary>Delivered certificates</summary><Sources game={game} state={v} update={m.update}/></details>}
      </> : <>
        <section className={s.workshop}><h3>Release line · batch {Math.min(2, v.product + 1)} out of 2</h3><p>{game.sequence.brief}</p>
          <div className={s.line} data-live-board aria-label="Active line"><div className={s.bin}>Materials<br/>{v.checked.length === game.proof.facts.length ? '▣ ✓' : '▣ ?'}</div>{v.chain.map((part, i) => <div className={s.station} data-active={v.stage === i} data-complete={i < v.stage} data-failed={v.fault === i} key={part}><b>{i < v.stage ? '✓' : i === v.stage ? '▣' : i + 1}</b><span>{game.sequence.cards[part]}</span><small>Workers: {v.power[part]}</small><button data-remove-station={i} disabled={v.running} onClick={() => m.update({ chain: v.chain.filter((_, j) => i !== j), stage: Math.min(v.stage, i), fault: -1 })}>Remove station</button></div>)}<div className={s.bin}>Done<br/>{'▣'.repeat(v.finished.length) || '—'}</div></div>
          <div className={s.parts}>{game.sequence.cards.map((text, i) => ({text, i})).reverse().map(({text, i}) => <button data-station={i} key={i} disabled={v.running || v.chain.includes(i)} onClick={() => m.update({ chain: [...v.chain, i], fault: -1 })}>＋ {text}</button>)}</div>
          <div className={s.workers}><p>Team: {game.sequence.cards.length + 1} workers. Available: {game.sequence.cards.length + 1 - v.power.reduce((a,b) => a+b,0)}. For the first issue - one per station; for the second, station 2 requires two.</p>{game.sequence.cards.map((card, i) => <div key={i}><span>{card}</span><button data-power-minus={i} aria-label={`Remove an employee ${i + 1}`} disabled={v.running || v.power[i] === 0} onClick={() => m.update({ power: replace(v.power, i, v.power[i] - 1) })}>−</button><b>{v.power[i]}</b><button data-power-plus={i} aria-label={`Add an employee ${i + 1}`} disabled={v.running || v.power.reduce((a,b)=>a+b,0) >= game.sequence.cards.length + 1} onClick={() => m.update({ power: replace(v.power, i, v.power[i] + 1) })}>+</button></div>)}</div>
          <button className={s.launch} disabled={v.running || v.checked.length !== game.proof.facts.length || !v.chain.length} onClick={execute}>Start line</button>
        </section>
        {v.checked.length < game.proof.facts.length && <>{!coop && <Sources game={game} state={v} update={m.update} archive/>}<EvidenceBoard game={game} state={v} update={m.update}/></>}
      </>}
      {!tutor && <div className={s.playback} data-playing={v.running}>{v.running && <button onClick={() => m.update({ running: false, autoRun: false, feedback: 'The test has been suspended. The field state is saved.' })}>Pause test</button>}{presentation && <button className={s.launch} disabled={!v.running} onClick={() => m.update(playStep(game, v))}>Next frame</button>}{presentation && <button disabled={!v.running || v.autoRun} onClick={() => m.update({ autoRun: true })}>Show the whole test</button>}<p role="status" className={s.feedback}>{v.feedback || 'Get your plan together and run the test.'}</p></div>}
    </>}
  </Frame>
}
