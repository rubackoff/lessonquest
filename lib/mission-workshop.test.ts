import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { workshopMissions } from './mission-content'
import { missionCatalog } from './scenario-missions'
import { type Activity, type Workspace, evaluateActivity, initialWorkspace, measure, transformShape, transformed, walk } from './mission-workshop'

const solutions = new Map<string, Workspace>()
function findSolution(a: Activity): Workspace | undefined {
  const key = JSON.stringify(a)
  if (solutions.has(key)) return solutions.get(key)
  let best: Workspace | undefined, price = Infinity
  const offer = (values: number[], trace: number[] = [], seen: number[] = []) => { const candidate = { values, trace, seen }, verdict = evaluateActivity(a, candidate); if (verdict.ok && verdict.cost < price) { best = candidate; price = verdict.cost } }
  const enumerate = (limits: number[], min = 0) => {
    const visit = (prefix: number[]) => { if (prefix.length === limits.length) { offer(prefix, [], a.kind === 'proof' ? prefix : []); return } for (let n = min; n <= limits[prefix.length]; n++) visit([...prefix, n]) }
    visit([])
  }
  switch (a.kind) {
    case 'sequence': a.orders.forEach(v => offer(v)); break
    case 'sort': offer(a.cards.map(c => c.group)); break
    case 'pack': enumerate(a.items.map(i => i.stock)); break
    case 'balance': enumerate(a.terms.map(() => 8), 1); break
    case 'schedule': enumerate(a.jobs.map(j => a.horizon - j.duration)); break
    case 'machine': {
      const visit = (prefix: number[]) => { if (prefix.length) offer(prefix); if (prefix.length < a.slots) for (let i = 0; i < a.ops.length; i++) visit([...prefix, i]) }; visit([]); break
    }
    case 'experiment': { const y = a.domain === 'fraction' ? 2 : 1; offer([1, y, measure(a, ...a.test)], [1, y, measure(a, 1, y), 2, y, measure(a, 2, y)]); break }
    case 'proof':
    case 'network': {
      const length = a.kind === 'proof' ? a.sources.length : a.edges.length
      for (let mask = 0; mask < 2 ** length; mask++) { const picked = Array.from({ length }, (_, i) => i).filter(i => mask & (1 << i)); offer(picked, [], a.kind === 'proof' ? picked : []) }
      break
    }
    case 'route': {
      const queue: number[][] = [[]], seen = new Set<string>()
      while (queue.length && !best) {
        const commands = queue.shift()!, result = walk(a, commands)
        if (result.error) continue
        const key = `${result.path.at(-1)}:${a.stops.map(n => result.path.includes(n) ? 1 : 0).join('')}`
        if (seen.has(key)) continue; seen.add(key); offer(commands)
        if (commands.length < a.max) for (let cmd = 0; cmd < 4; cmd++) queue.push([...commands, cmd])
      }
      break
    }
    case 'transform': {
      const queue: number[][] = [[]], seen = new Set<string>()
      while (queue.length && !best) {
        const commands = queue.shift()!, shape = transformed(a, commands)
        if (!shape) continue
        const key = [...shape].sort((x,y) => x-y).join(',')
        if (seen.has(key)) continue; seen.add(key); offer(commands)
        if (commands.length < a.max) for (let cmd = 0; cmd < 6; cmd++) queue.push([...commands, cmd])
      }
      break
    }
    case 'plot': {
      // Enumerate actual connected shapes instead of blessing a single rectangle fixture.
      let layer = new Map<string, number[]>([[String(a.required[0] ?? 12), [a.required[0] ?? 12]]])
      for (let size = 1; size < a.area; size++) {
        const next = new Map<string, number[]>()
        for (const cells of layer.values()) for (const cell of cells) for (const n of [cell % 5 ? cell - 1 : -1, cell % 5 < 4 ? cell + 1 : -1, cell >= 5 ? cell - 5 : -1, cell < 20 ? cell + 5 : -1]) {
          if (n < 0 || cells.includes(n) || a.blocked.includes(n)) continue
          const shape = [...cells, n].sort((x,y) => x-y); next.set(shape.join(','), shape)
        }
        layer = next
      }
      for (const shape of layer.values()) offer(shape)
      break
    }
  }
  if (best) solutions.set(key, best)
  return best
}

describe('one hundred playable mission scenarios', () => {
  it('contains 100 unique titles and IDs across 11 subjects', () => {
    const all = [...missionCatalog, ...workshopMissions]
    expect(all).toHaveLength(100)
    expect(new Set(all.map(m => m.id)).size).toBe(100)
    expect(new Set(all.map(m => m.title)).size).toBe(100)
    expect(new Set(workshopMissions.map(m => m.subject)).size).toBe(11)
    expect(new Set(workshopMissions.flatMap(m => m.stages.map(a => a.kind))).size).toBe(12)
  })
  it('gives every new mission three different interactive activities', () => {
    for (const m of workshopMissions) expect(new Set(m.stages.map(a => a.kind)).size, m.id).toBe(3)
    expect(new Set(workshopMissions.map(m => m.stages.map(a => a.kind).join('>'))).size).toBe(workshopMissions.length)
  })
  it.each(workshopMissions.map(m => [m.id, m] as const))('%s has a playable complete route including the incident cost', (_, mission) => {
    let reserve = 18
    mission.stages.forEach((a, i) => {
      if (i === 2) reserve -= 3
      const solution = findSolution(a)
      expect(solution, `${mission.id} / ${a.title}`).toBeDefined()
      const result = evaluateActivity(a, solution!, reserve)
      expect(result.ok, `${mission.id} / ${a.title}: ${result.message}`).toBe(true)
      reserve -= result.cost
    })
    expect(reserve).toBeGreaterThanOrEqual(0)
  })
  it('checks routes, resource constraints and physical conservation, not only a success button', () => {
    const route = workshopMissions.flatMap(m => m.stages).find(a => a.kind === 'route')!
    expect(evaluateActivity(route, { values: [3], trace: [], seen: [] }).ok).toBe(false)
    const reaction = workshopMissions.find(m => m.id === 'chem-water')!.stages[0]
    expect(evaluateActivity(reaction, { values: [1, 1, 1], trace: [], seen: [] }).ok).toBe(false)
    expect(evaluateActivity(reaction, { values: [4, 2, 4], trace: [], seen: [] }).ok).toBe(false)
    expect(evaluateActivity(reaction, { values: [2, 1, 2], trace: [], seen: [] }).ok).toBe(true)
    const pack = workshopMissions[0].stages[0]
    const solution = findSolution(pack)!
    expect(evaluateActivity(pack, solution, 0).ok).toBe(false)
    expect(evaluateActivity(pack, { ...solution, values: solution.values.map(v => v + 50) }).ok).toBe(false)
  })
  it('requires controlled measurements rather than an unexplained prediction', () => {
    const a = workshopMissions.flatMap(m => m.stages).find(a => a.kind === 'experiment')!
    if (a.kind !== 'experiment') throw new Error('Missing experiment')
    const candidate = findSolution(a)!
    expect(evaluateActivity(a, { ...candidate, trace: [] }).ok).toBe(false)
    expect(evaluateActivity(a, { ...candidate, trace: [1,1,measure(a,1,1),2,2,measure(a,2,2)] }).ok).toBe(false)
    expect(evaluateActivity(a, { ...candidate, values: [1,1,999] }).ok).toBe(false)
    expect(evaluateActivity(a, candidate).ok).toBe(true)
  })
  it('rejects schedule overlap, unseen sources and out-of-grid transformations', () => {
    const a = workshopMissions.flatMap(m => m.stages).find(a => a.kind === 'schedule')!
    expect(evaluateActivity(a, { values: [0,0,0], trace: [], seen: [] }).ok).toBe(false)
    const proof = workshopMissions.flatMap(m => m.stages).find(a => a.kind === 'proof')!
    expect(evaluateActivity(proof, { ...findSolution(proof)!, seen: [] }).ok).toBe(false)
    expect(transformShape([0,1,5],0)).toBeNull()
  })
  it('exports optional browser-play fixtures only when requested', () => {
    const path = process.env.MISSION_QA_FIXTURES
    if (!path) return
    const fixtures = workshopMissions.map(m => ({ id: m.id, title: m.title, subject: m.subject, stages: m.stages.map(a => ({ title: a.title, kind: a.kind, initial: initialWorkspace(a), solution: findSolution(a), data: a })) }))
    writeFileSync(path, JSON.stringify(fixtures), 'utf8')
  })
})
