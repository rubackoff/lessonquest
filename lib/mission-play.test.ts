import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { investigationCases } from './mission-investigations'
import { workshopMissions } from './mission-content'
import { type PlayScenario, type PlayState, assemblyStep, dispatchStep, docks, examineLink, initialPlay, moveInvestigator, neighbor, playScenario, sourceCells, returnDispatch, investigationRoute, playStep, submitCase, caseSealed, finishCensus, dispatchOnBuiltRoute } from './mission-play'

const games = workshopMissions.map(playScenario).filter((g): g is PlayScenario => !!g)
function path(start: number, goal: number, blocked: number[] = [], tracks: number[] = []) {
  const queue: [number, number[], number][] = [[start, [], 0]], seen = new Set<number>()
  while(queue.length) {
    queue.sort((a,b)=>a[2]-b[2] || a[1].length-b[1].length)
    const [pos, route, price] = queue.shift()!
    if(seen.has(pos))continue
    seen.add(pos)
    if (pos === goal) return route
    for (let dir = 0; dir < 4; dir++) { const n = neighbor(pos, dir); if (n !== null && !blocked.includes(n) && !seen.has(n)) queue.push([n, [...route, dir],price+(tracks.includes(n)?0:1)]) }
  }
  throw new Error('No route')
}
function links(game: Exclude<PlayScenario, { kind: 'dispatch' }>) { return game.proof.facts.map((_, i) => game.proof.sources.findIndex(doc => doc.supports.includes(i))) }
function approve(game: Exclude<PlayScenario, { kind: 'dispatch' }>, s: PlayState) {
  s = { ...s, links: links(game), running: true }
  for (let i = 0; i < game.proof.facts.length; i++) s = examineLink(game, s)
  expect(s.checked).toHaveLength(game.proof.facts.length)
  return s
}
function drive(game: Extract<PlayScenario, { kind: 'dispatch' }>, s: PlayState, target: number) {
  const forbidden = docks.slice(0, game.sort.groups.length).filter(n => n !== target && n !== s.pos)
  s = { ...s, running: true, program: path(s.pos, target, [...forbidden, ...(s.barrier && !s.repaired ? [12] : [])], s.tracks), cursor: 0 }
  for (let i = 0; i < 40 && s.running; i++) s = dispatchStep(game, s)
  expect(s.pos, s.feedback).toBe(target)
  return s
}

describe('continuous replacements for the 33 text-heavy missions', () => {
  it('replaces all 33 flagged missions with three playable systems', () => {
    expect(games).toHaveLength(33)
    expect(new Set(games.map(g => g.kind)).size).toBe(3)
    for (const id of ['eng-news','ela-quote','hist-sources']) expect(games.find(g=>g.mission.id===id)?.kind).toBe('investigation')
  })
  it.each(games.map(g => [g.mission.id, g] as const))('%s can finish using its persistent world state', (_, game) => {
    let s = { ...initialPlay(game), phase: 1 }
    if (game.kind === 'dispatch') {
      for (let i = 0; i < game.sort.cards.length; i++) {
        s = { ...s, selected: i }
        s = drive(game, s, docks[game.sort.cards[i].group]); const oldTracks = [...s.tracks]
        s = drive(game, s, 10)
        expect(oldTracks.every(n => s.tracks.includes(n))).toBe(true)
      }
      expect(s.barrier).toBe(true)
      expect(s.delivered).toHaveLength(game.sort.cards.length)
      if (game.mission.id === 'math-census') s = finishCensus(game, { ...s, chain: [4], selected: 2 })
    } else if (game.kind === 'investigation') {
      for (const i of new Set(links(game))) {
        for (const dir of path(s.pos, sourceCells[i])) s = moveInvestigator(game, s, dir)
        s = { ...s, seen: [...s.seen, i], bag: [...s.bag, i] }
        expect(s.filed).not.toContain(i)
        for (const dir of path(s.pos, 10)) s = moveInvestigator(game, s, dir)
        expect(s.filed).toContain(i)
      }
      s = approve(game, s)
      s = submitCase(game, { ...s, selected: investigationCases[game.mission.id].answer })
      for (const dir of path(s.pos, 24)) s = moveInvestigator(game, s, dir)
    } else {
      s = approve(game, { ...s, filed: [...new Set(links(game))] })
      s = { ...s, chain: game.sequence.orders[0], running: true }
      for(let i=0;i<game.sequence.cards.length;i++) s=assemblyStep(game,s)
      expect(s.product).toBe(1)
      const retained = [...s.chain]
      s = { ...s, running: true }
      s=assemblyStep(game,s);s=assemblyStep(game,s)
      expect(s.running).toBe(false)
      expect(s.fault).toBe(1)
      s = { ...s, power: s.power.map((v,i)=>i===s.chain[1]?2:v), running: true }
      for(let i=0;i<game.sequence.cards.length && s.running;i++)s=assemblyStep(game,s)
      expect(s.chain).toEqual(retained)
      expect(s.finished).toEqual([0,1])
    }
    expect(s.done, s.feedback).toBe(true)
  })
  it('does not accept the wrong category, teleport across edges, or pass a real obstruction', () => {
    const game = games.find((g): g is Extract<PlayScenario,{kind:'dispatch'}>=>g.kind==='dispatch')!
    let s = {...initialPlay(game), selected: 0, pos: 3, program:[1], running:true }
    const item = game.sort.cards.findIndex(c=>c.group!==0)
    s = dispatchStep(game,{...s,selected:item})
    expect(s.delivered).toEqual([]);expect(s.selected).toBe(item);expect(s.running).toBe(false)
    s=dispatchStep(game,{...s,pos:11,barrier:true,repaired:false,cursor:0,running:true})
    expect(s.pos).toBe(11)
    expect(neighbor(4,1)).toBeNull();expect(neighbor(0,3)).toBeNull()
  })
  it('requires delivered evidence and a real partner handoff in cooperative play', () => {
    const game=games.find((g):g is Extract<PlayScenario,{kind:'investigation'}>=>g.kind==='investigation')!
    let s={...initialPlay(game),links:links(game),seen:[0,1],running:true}
    expect(examineLink(game,s).checked).toEqual([])
    s={...s,filed:[...new Set(links(game))],mode:'coop'}
    expect(examineLink(game,s).checked).toEqual([])
    s=approve(game,{...s,approved:[...s.filed]})
    expect(s.checked.length).toBe(game.proof.facts.length)
    expect(moveInvestigator(game,{...initialPlay(game),pos:23},1).pos).toBe(23)
  })
  it('keeps finished route history bounded while retaining the world for save and reload', () => {
    const game=games.find((g):g is Extract<PlayScenario,{kind:'dispatch'}>=>g.kind==='dispatch')!
    let s=initialPlay(game)
    for(let i=0;i<120;i++)s=dispatchStep(game,{...s,program:[i%2===0?0:2],cursor:0,running:true})
    expect(s.program).toEqual([]);expect(s.tracks).toEqual([10,5]);expect(s.battery).toBe(10)
  })
  it('stops the line before the first causal error, preserving completed work', () => {
    const game=games.find((g):g is Extract<PlayScenario,{kind:'assembly'}>=>g.kind==='assembly')!
    const order=game.sequence.orders[0]
    let s=approve(game,{...initialPlay(game),filed:[...new Set(links(game))]})
    s={...s,chain:[order[0],order[2],order[1],...order.slice(3)],running:true}
    s=assemblyStep(game,s);s=assemblyStep(game,s)
    expect(s.stage).toBe(1);expect(s.finished).toEqual([]);expect(s.running).toBe(false)
  })
  it('exports browser fixtures only on explicit request', () => {
    if(process.env.PLAY_QA_FIXTURES)writeFileSync(process.env.PLAY_QA_FIXTURES,JSON.stringify(games),'utf8')
  })
})

describe('review fixes: fewer empty actions, more reasoning', () => {
  it('returns an empty cart along built tracks, preserving the cargo decisions', () => {
    const game = games.find((g): g is Extract<PlayScenario, {kind:'dispatch'}> => g.kind === 'dispatch')!
    let s = drive(game, {...initialPlay(game), selected: 0}, docks[game.sort.cards[0].group])
    const battery = s.battery, delivered = [...s.delivered]
    s = returnDispatch(s)
    expect(s.running).toBe(true)
    for(let i=0;i<30 && s.running;i++) s=dispatchStep(game,s)
    expect(s.pos).toBe(10); expect(s.delivered).toEqual(delivered); expect(s.battery).toBeGreaterThanOrEqual(battery)
    expect(returnDispatch({...s, pos:4, selected:1}).selected).toBe(1)
  })
  it('does not send automatic returns through a newly blocked track', () => {
    const s={...initialPlay(games[0]),pos:14,tracks:[10,11,12,13,14],barrier:true}
    expect(returnDispatch(s).running).toBe(false)
    expect(returnDispatch({...s,repaired:true}).running).toBe(true)
  })
  it('reuses only existing open routes and still rejects a wrong chosen port', () => {
    const game = games.find(g => g.mission.id === 'math-census')!
    if (game.kind !== 'dispatch') throw new Error('expected station')
    let s = { ...initialPlay(game), selected: 1 }
    expect(dispatchOnBuiltRoute(s, 0).running).toBe(false)
    s = dispatchOnBuiltRoute({ ...s, tracks: [10, 5, 0, 1, 2, 3, 4] }, 0)
    expect(s.running).toBe(true)
    for (let i = 0; i < 20 && s.running; i++) s = dispatchStep(game, s)
    expect(s.pos).toBe(4); expect(s.selected).toBe(1); expect(s.delivered).toEqual([])
    expect(s.battery).toBe(10)
    expect(dispatchOnBuiltRoute({ ...s, pos: 10, tracks: [10, 11, 12, 13, 14], barrier: true }, 1).running).toBe(false)
  })
  it.each(games.filter((g):g is Extract<PlayScenario,{kind:'investigation'}> => g.kind==='investigation'))('requires evidence and a justified final conclusion in $mission.id', game => {
    let s=approve(game,{...initialPlay(game),filed:[...new Set(links(game))]})
    expect(caseSealed(game,s)).toBe(false)
    s=submitCase(game,{...s,selected:(investigationCases[game.mission.id].answer+1)%3})
    expect(caseSealed(game,s)).toBe(false)
    s=submitCase(game,{...s,selected:investigationCases[game.mission.id].answer})
    expect(caseSealed(game,s)).toBe(true)
    s=investigationRoute(game,s,24)
    for(let i=0;i<30 && s.running;i++) s=playStep(game,s)
    expect(s.done).toBe(true); expect(s.feedback).toBe(investigationCases[game.mission.id].outcome)
  })
})

it('distinguishes unique animals, repeated sightings, a missing observation and a measured zero', () => {
  const game=games.find(g=>g.mission.id==='math-census')!
  if(game.kind!=='dispatch')throw new Error('expected station')
  let s={...initialPlay(game),phase:2,delivered:game.sort.cards.map((_,i)=>i),chain:[5],selected:2}
  expect(finishCensus(game,s).done).toBe(false)
  s={...s,chain:[4],selected:3}; expect(finishCensus(game,s).done).toBe(false)
  expect(finishCensus(game,{...s,selected:2}).done).toBe(true)
  expect(finishCensus(game,{...s,selected:2,delivered:[]}).done).toBe(false)
})
