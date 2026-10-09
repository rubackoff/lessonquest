import { anchors, edgeAnchors, edgeDirection, expeditionContent, type Anchor, type Edge, type ExpeditionTopic, type Route } from './content'

export type ExpeditionPhase = 'inspect' | 'plan' | 'building' | 'prediction' | 'failed' | 'passed' | 'crossing' | 'finished'
export type BridgePart = { id: number; edge: Edge; length: number; direction: number }
export type Draft = { parts: BridgePart[]; platform: { width: number; height: number } | null }
type Issue = { kind: 'math' | 'placement'; message: string }
type Attempt = { route: Route; answer: number; success: boolean; mathError: boolean; helped: boolean; issues: Issue[]; draft: Draft }
const copy = (draft: Draft): Draft => ({ parts: draft.parts.map(p => ({ ...p })), platform: draft.platform ? { ...draft.platform } : null })

export class ExpeditionSession {
  phase: ExpeditionPhase = 'inspect'
  paused = false
  route: Route = 'direct'
  draft: Draft = { parts: [], platform: null }
  undoStack: Draft[] = []
  redoStack: Draft[] = []
  selectedLength: number | null = null
  selectedPart: number | null = null
  direction = 0
  from: Anchor | null = null
  panelWidth = 4
  panelHeight = 6
  prediction = ''
  forecast: number | null = null
  hintLevel = 0
  attempts: Attempt[] = []
  crossing = 0
  nextId = 1
  notice = ''

  constructor(readonly topic: ExpeditionTopic = 'triangle', readonly homework = false, readonly chapter = 1, readonly variant = 0) {
    if (topic === 'segments' || topic === 'area') this.route = 'via'
    this.panelWidth = this.content.sides[0]; this.panelHeight = this.content.sides[0]
  }
  get content() { return expeditionContent(this.topic, this.homework, this.chapter, this.variant) }
  get editable() { return this.phase === 'building' && !this.paused }
  get edges(): Edge[] { return this.route === 'direct' ? ['ab'] : ['ac', 'cb'] }
  get mathErrors() { return this.attempts.filter(a => a.mathError).length }
  get independent() { return this.hintLevel === 0 && this.mathErrors === 0 }
  get complete() { return this.topic === 'area' ? Boolean(this.draft.platform) : this.edges.every(edge => this.draft.parts.some(p => p.edge === edge)) }
  get issues() { return this.attempts.at(-1)?.issues ?? [] }
  get materials() { return this.content.materials(this.route).map(m => ({ ...m, remaining: m.count - this.draft.parts.filter(p => p.length === m.length).length })) }
  edgeLength(edge: Edge) { return edge === 'ab' ? this.content.diagonal : edge === 'ac' ? this.content.horizontal : this.content.vertical }
  inspect() { if (!this.paused && this.phase === 'inspect') { this.phase = 'plan'; this.notice = '' } }
  choosePlan(route: Route) {
    if (this.paused || !['plan', 'building', 'failed'].includes(this.phase) || !['direct', 'via'].includes(route)) return
    if ((this.topic === 'segments' || this.topic === 'area') && route !== 'via') return
    this.route = route; this.draft = { parts: [], platform: null }; this.undoStack = []; this.redoStack = []
    this.from = null; this.selectedPart = null; this.selectedLength = null; this.forecast = null; this.prediction = ''; this.notice = ''; this.phase = 'building'
  }
  private change() { this.undoStack.push(copy(this.draft)); this.undoStack = this.undoStack.slice(-40); this.redoStack = []; this.forecast = null; this.notice = '' }
  selectMaterial(length: number) {
    if (!this.editable || !this.materials.some(m => m.length === length && m.remaining > 0)) return
    this.selectedLength = length; this.selectedPart = null; this.from = null; this.notice = 'Click the start and end points of the desired flight.'
  }
  selectPart(id: number) {
    if (!this.editable) return
    const part = this.draft.parts.find(p => p.id === id)
    if (!part) return
    this.selectedPart = id; this.selectedLength = null; this.from = null; this.direction = part.direction; this.notice = ''
  }
  rotate() {
    if (!this.editable) return
    if (this.topic === 'area') {
      if (this.draft.platform) { this.change(); const p = this.draft.platform; this.draft.platform = { width: p.height, height: p.width } }
      const width = this.panelWidth; this.panelWidth = this.panelHeight; this.panelHeight = width
      return
    }
    this.direction = (this.direction + 1) % 3
    const part = this.draft.parts.find(p => p.id === this.selectedPart)
    if (part) { this.change(); part.direction = this.direction }
  }
  anchor(anchor: Anchor) {
    if (!this.editable || !anchors[anchor]) return
    if (this.topic === 'area') { if (anchor === 'c') this.placePlatform(); else this.notice = 'The platform is located at support C.'; return }
    if (this.selectedLength === null) { this.notice = 'First, select the part in the materials.'; return }
    if (!this.from) { this.from = anchor; this.notice = 'Now press the second fly point.'; return }
    if (this.from === anchor) { this.from = null; this.notice = 'The point selection is cancelled.'; return }
    const from = this.from
    const edge = this.edges.find(e => edgeAnchors[e].includes(from) && edgeAnchors[e].includes(anchor))
    this.from = null
    if (!edge) { this.notice = 'These points do not connect in the selected plan. Choose a flight along the dotted line.'; return }
    const material = this.materials.find(m => m.length === this.selectedLength && m.remaining > 0)
    if (!material) return
    this.change(); this.draft.parts.push({ id: this.nextId++, edge, length: material.length, direction: this.direction })
    this.selectedPart = this.nextId - 1; this.selectedLength = null
    this.notice = 'The part is installed. You can rotate, add the next one, or go to the calculation.'
  }
  setSide(side: 'width' | 'height', value: number) {
    if (!this.editable || this.topic !== 'area' || !this.content.sides.includes(value)) return
    if (side === 'width') this.panelWidth = value; else this.panelHeight = value
  }
  placePlatform() {
    if (!this.editable || this.topic !== 'area') return
    this.change(); this.draft.platform = { width: this.panelWidth, height: this.panelHeight }; this.notice = 'The site has been installed. Predict its perimeter and test the design.'
  }
  remove() {
    if (!this.editable) return
    if (this.topic === 'area' && this.draft.platform) { this.change(); this.draft.platform = null }
    else if (this.draft.parts.some(p => p.id === this.selectedPart)) { this.change(); this.draft.parts = this.draft.parts.filter(p => p.id !== this.selectedPart) }
    this.selectedPart = null; this.from = null
  }
  undo() {
    if (!this.editable || !this.undoStack.length) return
    this.redoStack.push(copy(this.draft)); this.draft = this.undoStack.pop()!; this.selectedPart = null; this.from = null; this.forecast = null
  }
  redo() {
    if (!this.editable || !this.redoStack.length) return
    this.undoStack.push(copy(this.draft)); this.draft = this.redoStack.pop()!; this.selectedPart = null; this.from = null; this.forecast = null
  }
  resetDraft() {
    if (!this.editable) return
    this.change(); this.draft = { parts: [], platform: null }; this.from = null; this.selectedPart = null; this.notice = 'The materials have been returned. Previous training attempts are saved.'
  }
  predict() {
    if (!this.editable) return
    if (!this.complete) { this.notice = this.topic === 'area' ? 'First install the platform at support C.' : 'Install at least one part on each span of the selected path.'; return }
    this.phase = 'prediction'; this.from = null; this.notice = ''
  }
  setPrediction(value: string) { if (!this.paused && this.phase === 'prediction') this.prediction = value.slice(0, 12) }
  hint() { if (!this.paused && ['building', 'prediction', 'failed'].includes(this.phase)) this.hintLevel = Math.min(3, this.hintLevel + 1) }
  edit() { if (!this.paused && ['prediction', 'failed', 'passed'].includes(this.phase)) { this.phase = 'building'; this.forecast = null; this.notice = '' } }
  test() {
    if (this.paused || this.phase !== 'prediction') return
    const input = this.prediction.trim().replace(',', '.')
    const answer = Number(input)
    if (!/^\d+(?:\.\d+)?$/.test(input) || !Number.isFinite(answer) || answer <= 0 || answer > 10000) { this.notice = 'Enter a positive number in meters, for example 10. This is not a practice attempt for now.'; return }
    if (!this.complete) { this.notice = 'The structure has not yet been assembled.'; return }
    this.forecast = answer
    const issues: Issue[] = [], c = this.content
    if (this.topic === 'area') {
      const p = this.draft.platform!, area = p.width * p.height, perimeter = 2 * (p.width + p.height)
      if (area !== c.targetArea) issues.push({ kind: 'math', message: `At the site ${p.width} × ${p.height} = ${area} m². According to the condition it is necessary ${c.targetArea} m². Change sides.` })
      if (perimeter > c.fence) issues.push({ kind: 'math', message: `For the fence you need 2 × (${p.width} + ${p.height}) = ${perimeter} m, but there is ${c.fence} m. Look for another rectangle of the same area.` })
      if (Math.abs(answer - perimeter) > .001) issues.push({ kind: 'math', message: 'The predicted perimeter did not match the design. Consider all four sides of the site.' })
    } else {
      for (const edge of this.edges) {
        const parts = this.draft.parts.filter(p => p.edge === edge), length = parts.reduce((sum, p) => sum + p.length, 0), expected = this.edgeLength(edge)
        const label = edge === 'ab' ? 'A-B' : edge === 'ac' ? 'A-C' : 'S—B'
        if (parts.some(p => p.direction !== edgeDirection[edge])) issues.push({ kind: 'placement', message: `${label}: the part is rotated past the support. Select it and click "Rotate". This is an installation error, not a calculation error.` })
        if (Math.abs(length - expected) > .001) issues.push({ kind: 'math', message: edge === 'ab' && length === c.horizontal + c.vertical
          ? `${length} m is the length of the detour along both sides. For straight line A-B, you need the third side of a right triangle.`
          : `${label}: ${length < expected ? 'parts are missing to support' : 'parts extend beyond the support'}. Check ${edge === 'ab' ? 'length along two known sides' : `amount: needed ${expected} m`}.` })
      }
      const expected = this.topic === 'segments' ? c.horizontal + c.vertical : c.diagonal
      if (Math.abs(answer - expected) > .001) issues.push({ kind: 'math', message: this.topic === 'segments' ? 'In the forecast, you need to add the lengths of both spans.' : 'The forecast of straight line A-B did not coincide with the calculation. Check the squares of the sides and the units of measurement.' })
    }
    this.attempts.push({ route: this.route, answer, success: !issues.length, mathError: issues.some(i => i.kind === 'math'), helped: this.hintLevel > 0, issues, draft: copy(this.draft) })
    this.phase = issues.length ? 'failed' : 'passed'; this.notice = ''
  }
  cross() { if (!this.paused && this.phase === 'passed') { this.phase = 'crossing'; this.crossing = 0 } }
  tick(delta: number) {
    if (this.paused || this.phase !== 'crossing' || !Number.isFinite(delta)) return
    this.crossing = Math.min(1, this.crossing + Math.max(0, Math.min(.1, delta)) / 7)
    if (this.crossing >= 1) this.phase = 'finished'
  }
  pause() { if (this.phase !== 'finished') this.paused = true }
  resume() { this.paused = false }
  serialize() { return JSON.stringify({ version: 1, state: { ...this } }) }
  static restore(raw: string | null, topic: ExpeditionTopic, homework: boolean, chapter: number) {
    if (!raw) return null
    try {
      const { version, state: s } = JSON.parse(raw)
      if (version !== 1 || !s || s.topic !== topic || s.homework !== homework || s.chapter !== chapter || !Number.isInteger(s.variant) || s.variant < 0) return null
      const result = new ExpeditionSession(topic, homework, chapter, s.variant)
      if (!['inspect', 'plan', 'building', 'prediction', 'failed', 'passed', 'crossing', 'finished'].includes(s.phase) || typeof s.paused !== 'boolean' || !['direct', 'via'].includes(s.route) || (['segments', 'area'].includes(topic) && s.route !== 'via')) return null
      result.route = s.route
      const materials = result.content.materials(result.route)
      const validDraft = (d: Draft, route: Route = result.route) => {
        const stock = result.content.materials(route), edges = route === 'direct' ? ['ab'] : ['ac', 'cb']
        return d && Array.isArray(d.parts) && d.parts.length <= 20 && d.parts.every(p => p && Number.isInteger(p.id) && p.id > 0 && edges.includes(p.edge) && stock.some(m => m.length === p.length) && [0, 1, 2].includes(p.direction))
          && new Set(d.parts.map(p => p.id)).size === d.parts.length && stock.every(m => d.parts.filter(p => p.length === m.length).length <= m.count)
          && (topic === 'area' ? d.parts.length === 0 : d.platform === null)
          && (d.platform === null || d.platform && result.content.sides.includes(d.platform.width) && result.content.sides.includes(d.platform.height))
      }
      if (!validDraft(s.draft) || !Array.isArray(s.undoStack) || s.undoStack.length > 40 || !s.undoStack.every((d: Draft) => validDraft(d)) || !Array.isArray(s.redoStack) || s.redoStack.length > 40 || !s.redoStack.every((d: Draft) => validDraft(d))) return null
      if (typeof s.prediction !== 'string' || s.prediction.length > 12 || typeof s.notice !== 'string' || ![0, 1, 2].includes(s.direction) || ![0, 1, 2, 3].includes(s.hintLevel)) return null
      if (![null, 'a', 'b', 'c'].includes(s.from) || s.selectedLength !== null && !materials.some(m => m.length === s.selectedLength) || s.selectedPart !== null && !s.draft.parts.some((p: BridgePart) => p.id === s.selectedPart)) return null
      if (!result.content.sides.includes(s.panelWidth) || !result.content.sides.includes(s.panelHeight) || !Number.isFinite(s.crossing) || s.crossing < 0 || s.crossing > 1 || !Number.isInteger(s.nextId) || s.nextId <= Math.max(0, ...s.draft.parts.map((p: BridgePart) => p.id))) return null
      if (s.forecast !== null && (!Number.isFinite(s.forecast) || s.forecast <= 0)) return null
      if (!Array.isArray(s.attempts) || !s.attempts.every((a: Attempt) => a && ['direct', 'via'].includes(a.route) && Number.isFinite(a.answer) && typeof a.success === 'boolean' && typeof a.mathError === 'boolean' && typeof a.helped === 'boolean' && validDraft(a.draft, a.route) && Array.isArray(a.issues) && a.issues.every(i => i && ['math', 'placement'].includes(i.kind) && typeof i.message === 'string'))) return null
      for (const key of Object.keys(result)) Object.assign(result, { [key]: s[key] })
      if (!['inspect', 'finished'].includes(result.phase)) result.pause()
      return result
    } catch { return null }
  }
  snapshot() { return { phase: this.phase, paused: this.paused, topic: this.topic, chapter: this.chapter, route: this.route,
    parts: this.draft.parts.map(p => ({ ...p })), platform: this.draft.platform ? { ...this.draft.platform } : null, selectedPart: this.selectedPart, selectedLength: this.selectedLength, direction: this.direction, from: this.from,
    panelWidth: this.panelWidth, panelHeight: this.panelHeight, prediction: this.prediction, forecast: this.forecast, hintLevel: this.hintLevel,
    attempts: this.attempts.length, mathErrors: this.mathErrors, independent: this.independent, crossing: Math.round(this.crossing * 100),
    undo: this.undoStack.length, redo: this.redoStack.length, notice: this.notice } }
}
