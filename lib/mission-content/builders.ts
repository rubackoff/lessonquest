import type { Activity, Subject, WorkshopMission } from '../mission-workshop'

const base = (title: string, brief: string) => ({ title, brief, success: `«${title}": the result is accepted and passed on to the next stage.` })
export const pack = (title: string, brief: string, axes: string[], target: number[], items: [string, number[], number][]): Activity => ({ ...base(title, brief), kind: 'pack', axes, target, items: items.map(([name, vector, stock]) => ({ name, vector, stock })) })
export const sequence = (title: string, brief: string, cards: string[], orders = [cards.map((_, i) => i)]): Activity => ({ ...base(title, brief), kind: 'sequence', cards, orders })
export const sort = (title: string, brief: string, groups: string[], entries: [string, number, string][]): Activity => ({ ...base(title, brief), kind: 'sort', groups, cards: entries.map(([text, group, why]) => ({ text, group, why })) })
export const balance = (title: string, brief: string, elements: string[], terms: [string, number[], number][]): Activity => ({ ...base(title, brief), kind: 'balance', elements, terms: terms.map(([name, atoms, side]) => ({ name, atoms, side })) })
export const machine = (title: string, brief: string, inputs: number[], outputs: number[], ops: [string, 'add' | 'multiply' | 'divide' | 'power' | 'mod', number][], slots = 3): Activity => ({ ...base(title, brief), kind: 'machine', inputs, outputs, ops: ops.map(([name, op, n]) => ({ name, op, n })), slots })
export const experiment = (title: string, brief: string, x: string, y: string, unit: string, model: 'product' | 'sum' | 'ratio' | 'square', factor: number, test: [number, number]): Activity => ({ ...base(title, brief), kind: 'experiment', x, y, unit, model, factor, test, range: [1, 2, 3, 4], ...(unit === 'fraction' ? { domain: 'fraction' as const } : {}) })
export const plot = (title: string, brief: string, area = 6, fence = 12, blocked: number[] = [4, 24], required: number[] = [12]): Activity => ({ ...base(title, brief), kind: 'plot', area, fence, blocked, required })
export const network = (title: string, brief: string, nodes: string[], budget = 7, blocked: number[] = []): Activity => ({ ...base(title, brief), kind: 'network', nodes, required: nodes.map((_, i) => i), budget, blocked, edges: [{ a: 0, b: 1, cost: 2 }, { a: 0, b: 2, cost: 3 }, { a: 1, b: 2, cost: 1 }, { a: 1, b: 3, cost: 3 }, { a: 2, b: 3, cost: 2 }, { a: 0, b: 3, cost: 6 }] })
export const schedule = (title: string, brief: string, jobs: [string, number, number[]][], horizon = 10, blocked: number[] = []): Activity => ({ ...base(title, brief), kind: 'schedule', jobs: jobs.map(([name, duration, after]) => ({ name, duration, after })), horizon, blocked })
export const transform = (title: string, brief: string, shape = [6, 7, 11], target = [8, 9, 14], max = 5): Activity => ({ ...base(title, brief), kind: 'transform', shape, target, max })
export const proof = (title: string, claim: string, facts: string[], entries: [string, string, number[], number][], budget = 4): Activity => ({ ...base(title, 'Open your sources and gather evidence for all parts of the claim. Each source has a verification price. A rumor or similarity alone does not prove a fact.'), kind: 'proof', claim, facts, budget, sources: entries.map(([name, text, supports, cost]) => ({ name, text, supports, cost })) })
const routes = [
  { start: 20, goal: 4, blocked: [11, 12, 13], stops: [0], max: 12 },
  { start: 0, goal: 24, blocked: [6, 7, 16, 17], stops: [4], max: 12 },
  { start: 20, goal: 4, blocked: [6, 8, 12], stops: [22, 14], max: 14 },
  { start: 4, goal: 20, blocked: [7, 12, 17], stops: [0], max: 12 },
]
export const route = (title: string, brief: string, layout = 0): Activity => ({ ...base(title, brief), kind: 'route', ...routes[layout] })
export const mission = (id: string, title: string, subject: Subject, audience: string, hook: string, incident: string, stages: [Activity, Activity, Activity], resource = 'Team reserve'): WorkshopMission => ({ id, title, subject, audience, hook, incident, stages, resource, ending: `${title}: All parts of the plan worked. Compare the remaining supply and try another method - a shorter route, a compact design, or an economical selection of resources.` })
