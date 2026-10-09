import { plotMetrics } from './mechanics-lab'

export type Subject = 'Mathematics' | 'Algebra' | 'Geometry' | 'English' | 'Language Arts' | 'Physics' | 'Chemistry' | 'Biology' | 'Geography' | 'Computer Science' | 'History'
type Base = { title: string; brief: string; success: string }
export type Activity = Base & (
  | { kind: 'route'; start: number; goal: number; blocked: number[]; stops: number[]; max: number }
  | { kind: 'pack'; axes: string[]; target: number[]; items: { name: string; vector: number[]; stock: number }[] }
  | { kind: 'sequence'; cards: string[]; orders: number[][] }
  | { kind: 'sort'; groups: string[]; cards: { text: string; group: number; why: string }[] }
  | { kind: 'balance'; elements: string[]; terms: { name: string; atoms: number[]; side: number }[] }
  | { kind: 'machine'; inputs: number[]; outputs: number[]; ops: { name: string; op: 'add' | 'multiply' | 'divide' | 'power' | 'mod'; n: number }[]; slots: number }
  | { kind: 'experiment'; x: string; y: string; unit: string; model: 'product' | 'sum' | 'ratio' | 'square'; factor: number; test: [number, number]; range: number[]; domain?: 'fraction' }
  | { kind: 'plot'; area: number; fence: number; blocked: number[]; required: number[] }
  | { kind: 'network'; nodes: string[]; edges: { a: number; b: number; cost: number }[]; required: number[]; budget: number; blocked: number[] }
  | { kind: 'schedule'; jobs: { name: string; duration: number; after: number[] }[]; horizon: number; blocked: number[] }
  | { kind: 'transform'; shape: number[]; target: number[]; max: number }
  | { kind: 'proof'; claim: string; sources: { name: string; text: string; supports: number[]; cost: number }[]; facts: string[]; budget: number }
)
export type WorkshopMission = { id: string; title: string; subject: Subject; audience: string; hook: string; incident: string; resource: string; stages: [Activity, Activity, Activity]; ending: string }
export type Workspace = { values: number[]; trace: number[]; seen: number[] }
export const blankWorkspace = (): Workspace => ({ values: [], trace: [], seen: [] })
export const mechanicNames: Record<Activity['kind'], string> = { route: 'Route programming', pack: 'Bundling resources', sequence: 'Sequence assembly', sort: 'Distribution according to rules', balance: 'Balancing', machine: 'Operations pipeline', experiment: 'Controlled experiment', plot: 'Site design', network: 'Network design', schedule: 'Work planning', transform: 'Shape Transformations', proof: 'Verification of evidence' }
const total = (values: number[]) => values.reduce((a, b) => a + b, 0)
const same = (a: number[], b: number[]) => a.length === b.length && a.every((n, i) => n === b[i])
export function energyCost(raw: number) { return Math.max(1, Math.ceil(raw / 3)) }
export function initialWorkspace(activity: Activity): Workspace {
  return { values: activity.kind === 'balance' ? activity.terms.map(() => 1) : activity.kind === 'sort' ? activity.cards.map(() => -1) : activity.kind === 'pack' ? activity.items.map(() => 0) : activity.kind === 'schedule' ? activity.jobs.map(() => -1) : activity.kind === 'experiment' ? [1, 1, 0] : [], trace: [], seen: [] }
}
export function measure(a: Extract<Activity, { kind: 'experiment' }>, x: number, y: number) {
  return a.factor * (a.model === 'product' ? x * y : a.model === 'sum' ? x + y : a.model === 'ratio' ? x / y : x * x * y)
}
export function executeMachine(a: Extract<Activity, { kind: 'machine' }>, chain: number[], input: number) {
  return chain.reduce((v, i) => { const op = a.ops[i]; if (!op) return NaN; return op.op === 'add' ? v + op.n : op.op === 'multiply' ? v * op.n : op.op === 'divide' ? v / op.n : op.op === 'power' ? v ** op.n : v % op.n }, input)
}
export function walk(a: Extract<Activity, { kind: 'route' }>, commands: number[]) {
  let cell = a.start; const path = [cell]
  for (const [i, dir] of commands.entries()) {
    const x = cell % 5, y = Math.floor(cell / 5), next = dir === 0 ? cell - 5 : dir === 1 ? cell + 1 : dir === 2 ? cell + 5 : cell - 1
    if ((dir === 0 && y === 0) || (dir === 2 && y === 4) || (dir === 1 && x === 4) || (dir === 3 && x === 0) || a.blocked.includes(next)) return { path, error: `Step ${i + 1}: The path is blocked. Fix the program; The cells passed are marked on the map.` }
    cell = next; path.push(cell)
  }
  return { path, error: '' }
}
export function transformShape(shape: number[], operation: number): number[] | null {
  const points = shape.map(cell => { const x = cell % 5, y = Math.floor(cell / 5); return operation === 0 ? [x, y - 1] : operation === 1 ? [x + 1, y] : operation === 2 ? [x, y + 1] : operation === 3 ? [x - 1, y] : operation === 4 ? [4 - y, x] : [4 - x, y] })
  return points.some(([x, y]) => x < 0 || x > 4 || y < 0 || y > 4) ? null : points.map(([x, y]) => y * 5 + x)
}
export function transformed(a: Extract<Activity, { kind: 'transform' }>, operations: number[]) {
  let shape = a.shape
  for (const op of operations) { const next = transformShape(shape, op); if (!next) return null; shape = next }
  return shape
}
export type Verdict = { ok: boolean; message: string; cost: number }
export function evaluateActivity(a: Activity, work: Workspace, remaining = Infinity): Verdict {
  const fail = (message: string): Verdict => ({ ok: false, message, cost: 0 })
  let raw = 0; const v = work.values
  if (v.some(n => !Number.isFinite(n))) return fail('Fill in the empty fields before checking.')
  switch (a.kind) {
    case 'route': {
      if (v.length > a.max) return fail(`Program limit - ${a.max} commands`)
      const { path, error } = walk(a, v)
      if (error) return fail(error)
      if (path.at(-1) !== a.goal || !a.stops.every(c => path.includes(c))) return fail('You need to reach the goal and visit all the marked intermediate points. Check the route.')
      raw = v.length; break
    }
    case 'pack': {
      if (v.length !== a.items.length || v.some((n, i) => !Number.isInteger(n) || n < 0 || n > a.items[i].stock)) return fail('Check the quantity: you cannot take more than is in stock.')
      const current = a.axes.map((_, j) => total(a.items.map((item, i) => item.vector[j] * v[i])))
      if (!same(current, a.target)) return fail(`The composition is not suitable yet: ${a.axes.map((axis, i) => `${axis} ${current[i]}/${a.target[i]}`).join('; ')}. Parts can be returned and reassembled differently.`)
      raw = total(v); break
    }
    case 'sequence': {
      if (!a.orders.some(order => same(order, v))) return fail('The order still changes the meaning or breaks the causal relationship. Re-read the terms; Any fragment can be removed.')
      raw = v.length; break
    }
    case 'sort': {
      const wrong = a.cards.findIndex((card, i) => v[i] !== card.group)
      if (wrong >= 0) return fail(`${a.cards[wrong].text}: ${v[wrong] < 0 || v[wrong] === undefined ? 'First select a department.' : a.cards[wrong].why}`)
      raw = a.cards.length; break
    }
    case 'balance': {
      if (v.length !== a.terms.length || v.some(n => !Number.isInteger(n) || n < 1 || n > 12)) return fail('Odds must be integers from 1 to 12.')
      const delta = a.elements.map((_, j) => total(a.terms.map((term, i) => term.atoms[j] * term.side * v[i])))
      const bad = delta.findIndex(n => n !== 0)
      if (bad >= 0) return fail(`Balance "${a.elements[bad]}» did not agree: difference ${delta[bad]}. Change the odds while maintaining the composition of each card.`)
      let gcd = v[0]; for (const n of v) { let b = n; while (b) { const c = gcd % b; gcd = b; b = c } }
      if (gcd > 1) return fail(`The balance is correct, but all coefficients are divided by ${gcd}. Reduce the notation to the minimum integers.`)
      raw = total(v); break
    }
    case 'machine': {
      if (!v.length || v.length > a.slots) return fail(`Assemble a conveyor with a length of 1 to ${a.slots} modules.`)
      const bad = a.inputs.findIndex((n, i) => Math.abs(executeMachine(a, v, n) - a.outputs[i]) > 1e-7 || !Number.isFinite(executeMachine(a, v, n)))
      if (bad >= 0) return fail(`Login ${a.inputs[bad]} gives ${executeMachine(a, v, a.inputs[bad])}, required ${a.outputs[bad]}. The order of operations matters.`)
      raw = v.length; break
    }
    case 'experiment': {
      if (v.length !== 3) return fail('Specify two experimental settings and a numerical prediction.')
      const trials = Array.from({ length: work.trace.length / 3 }, (_, i) => work.trace.slice(i * 3, i * 3 + 3))
      if (a.domain === 'fraction' && trials.some(t => t[0] > t[1])) return fail('The mass of the substance cannot exceed the mass of the entire solution. Correct the experimental conditions.')
      if (!trials.some(t => trials.some(other => t[0] !== other[0] && t[1] === other[1]))) return fail('It is not yet possible to isolate the influence of the first magnitude. Conduct two experiments with different first values ​​and the same second.')
      if (Math.abs(v[2] - measure(a, ...a.test)) > 0.01) return fail('The forecast does not match the model. Compare measurements and check the relationship; a new experiment can be carried out without losing a stage.')
      raw = trials.length; break
    }
    case 'plot': {
      const metrics = plotMetrics(v)
      if (v.some(c => a.blocked.includes(c)) || !a.required.every(c => v.includes(c))) return fail('Save the required cells and do not occupy prohibited areas.')
      if (!metrics.connected || metrics.area !== a.area || metrics.perimeter > a.fence) return fail(`We need a connected area with an area ${a.area} and the border is no longer ${a.fence}. Now the area ${metrics.area}, border ${metrics.perimeter}.`)
      raw = metrics.perimeter; break
    }
    case 'network': {
      if (v.some(i => a.blocked.includes(i) || !a.edges[i])) return fail('There is an unavailable channel on the network. Take it off.')
      const seen = new Set([0]); let changed = true
      while (changed) { changed = false; for (const i of v) { const e = a.edges[i]; if (seen.has(e.a) && !seen.has(e.b)) { seen.add(e.b); changed = true } if (seen.has(e.b) && !seen.has(e.a)) { seen.add(e.a); changed = true } } }
      raw = total(v.map(i => a.edges[i].cost))
      if (!a.required.every(n => seen.has(n))) return fail('Not all necessary points are connected to node 0. An isolated segment does not transfer a resource.')
      if (raw > a.budget) return fail(`The network is worth ${raw}; limit ${a.budget}. Find a shorter connected circuit.`)
      break
    }
    case 'schedule': {
      if (v.length !== a.jobs.length || v.some((n, i) => !Number.isInteger(n) || n < 0 || n + a.jobs[i].duration > a.horizon)) return fail('Place all work within the available time window.')
      for (let i = 0; i < v.length; i++) {
        if (a.jobs[i].after.some(j => v[j] + a.jobs[j].duration > v[i])) return fail(`«${a.jobs[i].name}» begins before the completion of the required previous work.`)
        for (let t = v[i]; t < v[i] + a.jobs[i].duration; t++) {
          if (a.blocked.includes(t)) return fail(`In the interval ${t}–${t + 1} equipment is not available. Move the work.`)
          if (v.some((start, j) => i !== j && t >= start && t < start + a.jobs[j].duration)) return fail('Two jobs use the same equipment at the same time. Spread out the intervals.')
        }
      }
      raw = Math.max(...v.map((start, i) => start + a.jobs[i].duration)); break
    }
    case 'transform': {
      const shape = transformed(a, v)
      if (!shape) return fail('The figure walked off the edge of the field. Undo your last move.')
      if (v.length > a.max || !same([...shape].sort((x, y) => x - y), [...a.target].sort((x, y) => x - y))) return fail('Align all the cells of the figure with the outline. The turn goes around the center of the field; reflection - relative to the vertical midline.')
      raw = v.length; break
    }
    case 'proof': {
      if (v.some(i => !work.seen.includes(i))) return fail('First, open and read the selected sources.')
      raw = total(v.map(i => a.sources[i]?.cost ?? 100))
      const supported = new Set(v.flatMap(i => a.sources[i]?.supports ?? []))
      if (!a.facts.every((_, i) => supported.has(i))) return fail('The selection does not prove all parts of the statement. Find the document for the missing fact.')
      if (raw > a.budget) return fail(`It's worth checking these sources ${raw}, available ${a.budget}. Remove the unnecessary stuff and keep evidence of all the facts.`)
      if (v.some(i => !a.sources[i].supports.length)) return fail('The selection includes a source that does not confirm the necessary facts. Separate the message from the evidence.')
      break
    }
  }
  const cost = energyCost(raw)
  if (cost > remaining) return fail(`The solution is correct, but it requires ${cost} units of stock left ${remaining}. Find a more economical way or return to the previous stage and save the resource.`)
  return { ok: true, message: `${a.success} Stock consumption: ${cost}.`, cost }
}
