import { defenseExercise, type DefenseLessonId } from './content'
import type { LearningResult } from '../learning-achievements'

export const defenseTowers = [
  { name: 'Laser', detail: 'Quick Damage', color: '#16aaa9', x: -4, z: -3.8 },
  { name: 'Cryo', detail: 'Slows down enemies', color: '#4288e8', x: 1.4, z: -2 },
  { name: 'Pulse', detail: 'Area Damage', color: '#dd983a', x: 1.6, z: 3.2 },
] as const
export const defensePads = [
  { x: -4, z: -3.8 }, { x: 1.4, z: -2 }, { x: 1.6, z: 3.2 },
  { x: -4.7, z: .4 }, { x: -3.4, z: 3.8 }, { x: 4.7, z: .9 },
] as const
export const bubbleKinds = [
  { color: '#73ddc6', size: .45, speed: 1.2, health: .8 },
  { color: '#b58bff', size: .65, speed: 1, health: 1 },
  { color: '#ffb66b', size: .85, speed: .8, health: 1.5 },
] as const
export const defenseMissions = [
  { id: 'watch', title: 'First watch', detail: 'Regular bubbles · get to know the defense' },
  { id: 'swift', title: 'Fast flow', detail: 'Quick targets · slowdown will come in handy' },
  { id: 'group', title: 'Dense wave', detail: 'Bubbles in groups · try impulse' },
  { id: 'giant', title: 'Big bubble', detail: 'Hard targets · focus fire' },
  { id: 'night', title: 'Night watch', detail: 'Mixed waves plan the charge' },
] as const
export type DefenseMission = typeof defenseMissions[number]['id']
export type DefenseStatus = 'ready' | 'choosing' | 'question' | 'explanation' | 'correct' | 'wave-ready' | 'wave' | 'between' | 'finished' | 'paused' | 'defeated'
export type Recharge = { tower: number; remaining: number; feedback: string; helped: boolean; hint: boolean; expired: boolean; tried: number[] }
export const shotCosts = [12, 15, 25]
export const towerRange = 4.5
export type Alien = { id: number; progress: number; hp: number; maxHp: number; slow: number }
export type Shot = { tower: number; x: number; z: number; ttl: number }
// Cubic curves follow the centre of the road in the approved arena artwork.
const roadCurves = [
  [[.436, .103], [.436, .153], [.435, .174], [.50, .191]],
  [[.50, .191], [.59, .213], [.652, .209], [.659, .254]],
  [[.659, .254], [.669, .308], [.591, .317], [.50, .325]],
  [[.50, .325], [.402, .337], [.337, .358], [.338, .398]],
  [[.338, .398], [.337, .439], [.44, .448], [.54, .459]],
  [[.54, .459], [.612, .469], [.647, .49], [.646, .528]],
  [[.646, .528], [.64, .571], [.54, .58], [.466, .601]],
  [[.466, .601], [.375, .626], [.371, .671], [.445, .705]],
  [[.445, .705], [.501, .731], [.496, .76], [.497, .808]],
]
const roadSamples: { x: number; z: number; distance: number }[] = []
for (const curve of roadCurves) for (let i = roadSamples.length ? 1 : 0; i <= 30; i++) {
  const t = i / 30, s = 1 - t
  const at = (axis: number) => (s ** 3 * curve[0][axis] + 3 * s * s * t * curve[1][axis] + 3 * s * t * t * curve[2][axis] + t ** 3 * curve[3][axis] - .5) * 20
  const x = at(0), z = at(1), previous = roadSamples.at(-1)
  roadSamples.push({ x, z, distance: previous ? previous.distance + Math.hypot(x - previous.x, z - previous.z) : 0 })
}
const routeLength = roadSamples.at(-1)!.distance
export function pathPosition(progress: number) {
  const distance = Math.max(0, Math.min(1, progress)) * routeLength
  const index = Math.max(1, roadSamples.findIndex(point => point.distance >= distance))
  const before = roadSamples[index - 1], after = roadSamples[index], mix = (distance - before.distance) / (after.distance - before.distance)
  return { x: before.x + (after.x - before.x) * mix, z: before.z + (after.z - before.z) * mix }
}

export class DefenseSession {
  status: DefenseStatus = 'ready'
  beforePause: DefenseStatus = 'ready'
  readonly levels = [1, 1, 1, 1, 1, 1]
  readonly types = [0, 1, 2, 0, 1, 2]
  readonly results: LearningResult[] = []
  readonly reviewPrompts: string[] = []
  readonly chargeResults: { prompt: string; firstTry: boolean }[] = []
  readonly aliens: Alien[] = []
  readonly shots: Shot[] = []
  readonly cooldowns = [0, 0, 0, 0, 0, 0]
  readonly placements = [-1, -1, -1, -1, -1, -1]
  readonly energy = [0, 0, 0, 0, 0, 0]
  readonly priorities = [false, false, false, false, false, false]
  placingTower: number | null = null
  recharge: Recharge | null = null
  mode: 'practice' | 'calm' = 'practice'
  kits = 2
  rechargeCount = 0
  rechargeSolved = 0
  selectedTower = 0
  index = 0
  recovery = 0
  variant = 0
  helped = false
  errors = 0
  selectedAnswer: number | null = null
  wave = 1
  spawned = 0
  defeated = 0
  shieldHits = 0
  health = 100
  waveStartHealth = 100
  waveStartEnergy = [0, 0, 0, 0, 0, 0]
  waveTime = 0
  nextSpawn = 0
  petUsed = false
  petShield = 0
  retries = 0
  notice = ''

  constructor(readonly lesson: DefenseLessonId = 'seven', readonly homework = false,
    readonly mission: DefenseMission = 'watch', readonly chapter = 1) {}
  get exercise() { return defenseExercise(this.lesson, this.homework, this.index, this.recovery + this.variant + (this.chapter - 1) * 3) }
  get rechargeExercise() { return defenseExercise(this.lesson, this.homework, this.rechargeCount % 6, 2 + Math.floor(this.rechargeCount / 6) + this.variant + (this.chapter - 1) * 3) }
  get deployed() { return this.placements.some(slot => slot >= 0) }
  get canBuild() { return ['ready', 'choosing', 'wave-ready', 'between'].includes(this.status) && !this.recharge }
  get prepared() { return this.results.length - (this.wave - 1) * 2 }
  get totalAliens() { return (this.mission === 'group' ? 6 : 3) + this.wave * 2 }
  get independent() { return this.results.filter(result => result.firstTry).length }
  get chargeIndependent() { return this.chargeResults.filter(result => result.firstTry).length }
  get waveComplete() { return this.spawned === this.totalAliens && !this.aliens.length }
  get missionInfo() { return defenseMissions.find(item => item.id === this.mission)! }
  get upgradeDescription() {
    const level = this.levels[this.selectedTower], type = this.types[this.selectedTower]
    return type === 0 ? `Damage: ${level + 1} → ${level + 2}` : type === 1 ? `Slowdown: ${(2 + level * .8).toFixed(1)} → ${(2.8 + level * .8).toFixed(1)} s` : `Pulse radius: ${(1.4 + level * .4).toFixed(1)} → ${(1.8 + level * .4).toFixed(1)} m`
  }
  towerPosition(index: number) { return defensePads[this.placements[index]] }
  towerInfo(index: number) { return defenseTowers[this.types[index]] }
  selectBuild(type: number) {
    const index = this.placements.indexOf(-1)
    if (!this.canBuild || this.kits < 1 || index < 0 || !Number.isInteger(type) || !defenseTowers[type]) return
    this.types[index] = type; this.placingTower = index; this.selectedTower = index; this.notice = ''
  }
  selectPlacement(index: number) {
    if (!this.canBuild || !this.towerPosition(index)) return
    this.selectedTower = index; this.placingTower = index
  }
  cancelPlacement() { if (this.canBuild) this.placingTower = null }
  placeTower(slot: number) {
    const index = this.placingTower
    if (index === null || !this.canBuild || !Number.isInteger(slot) || !defensePads[slot]) return
    if (this.placements.some((value, other) => value === slot && other !== index)) return
    if (this.placements[index] < 0) {
      if (this.kits < 1) return
      this.kits--; this.levels[index] = 1; this.energy[index] = 0; this.priorities[index] = false
    }
    this.placements[index] = slot; this.placingTower = null; this.selectedTower = index
  }
  selectTower(index: number) {
    if (!['ready', 'choosing', 'wave-ready', 'between', 'wave'].includes(this.status) || this.recharge || !this.towerPosition(index)) return
    this.selectedTower = index; if (this.canBuild) this.placingTower = null
  }
  removeTower(index: number) {
    if (!this.canBuild || !this.towerPosition(index)) return
    this.kits += this.levels[index]; this.placements[index] = -1; this.levels[index] = 1; this.energy[index] = 0
    this.placingTower = null; this.selectedTower = Math.max(0, this.placements.findIndex(slot => slot >= 0))
  }
  replaceTower(index: number, type: number) {
    if (!this.canBuild || !this.towerPosition(index) || !Number.isInteger(type) || !defenseTowers[type] || this.types[index] === type) return
    this.kits += this.levels[index] - 1; this.types[index] = type; this.levels[index] = 1
    // Changing type cannot create a fresh battery.
    this.energy[index] = 0; this.cooldowns[index] = 0
  }
  upgradeTower(index: number) {
    if (!this.canBuild || !this.towerPosition(index) || this.kits < 1 || this.levels[index] >= 3) return
    this.kits--; this.levels[index]++
  }
  togglePriority(index: number) {
    if (!['ready', 'choosing', 'wave-ready', 'between', 'wave'].includes(this.status) || !this.towerPosition(index)) return
    this.priorities[index] = !this.priorities[index]
  }
  start() { if (this.status === 'ready' && this.deployed && !this.recharge) { this.placingTower = null; this.status = 'choosing' } }
  chooseTower(index: number) {
    if (this.status !== 'choosing' || this.recharge || !this.towerPosition(index)) return
    this.placingTower = null; this.selectedTower = index; this.status = 'question'; this.notice = ''
  }
  private markHelped() {
    if (!this.helped) this.reviewPrompts.push(this.exercise.prompt)
    this.helped = true
  }
  answer(index: number) {
    if (this.status !== 'question' || !Number.isInteger(index) || !this.exercise.options[index]) return
    this.selectedAnswer = index
    if (index !== this.exercise.correctIndex) { this.errors++; this.markHelped(); this.status = 'explanation'; return }
    this.kits++; this.energy[this.selectedTower] = Math.min(100, this.energy[this.selectedTower] + 60)
    this.results.push({ questionId: `${this.exercise.id}:chapter${this.chapter}:variant${this.variant}`, mastered: true, firstTry: !this.helped && this.recovery === 0 })
    this.status = 'correct'
  }
  hint() {
    if (this.status !== 'question') return
    this.markHelped(); this.selectedAnswer = null; this.status = 'explanation'
  }
  continue() {
    if (this.recharge) return
    if (this.status === 'explanation') { this.recovery++; this.selectedAnswer = null; this.status = 'question' }
    else if (this.status === 'correct') {
      this.index++; this.recovery = 0; this.helped = false; this.selectedAnswer = null
      this.status = this.prepared === 2 ? 'wave-ready' : 'choosing'
    } else if (this.status === 'between') { this.wave++; this.status = 'choosing'; this.placingTower = null }
  }
  beginRecharge(tower: number) {
    if (!['ready', 'choosing', 'wave-ready', 'between', 'wave'].includes(this.status) || this.recharge || !this.towerPosition(tower) || this.energy[tower] >= 100) return
    this.selectedTower = tower; this.placingTower = null; this.notice = ''
    this.recharge = { tower, remaining: 12, feedback: '', helped: false, hint: false, expired: false, tried: [] }
  }
  answerRecharge(index: number) {
    const charge = this.recharge
    if (this.status === 'paused' || this.status === 'defeated' || !charge || charge.hint || charge.expired || !Number.isInteger(index) || !this.rechargeExercise.options[index] || charge.tried.includes(index)) return
    if (index === this.rechargeExercise.correctIndex) {
      this.chargeResults.push({ prompt: this.rechargeExercise.prompt, firstTry: !charge.helped && charge.tried.length === 0 })
      this.energy[charge.tower] = Math.min(100, this.energy[charge.tower] + 60); this.rechargeSolved++
      this.notice = `${this.towerInfo(charge.tower).name}: +60 energy`; this.closeRecharge()
    } else {
      if (!charge.helped) this.reviewPrompts.push(this.rechargeExercise.prompt)
      charge.tried.push(index); charge.helped = true; this.errors++
      charge.feedback = 'It doesn\'t add up yet. Check the action or open a review.'
    }
  }
  hintRecharge() {
    if (!this.recharge || this.status === 'paused' || this.status === 'defeated') return
    if (!this.recharge.helped) this.reviewPrompts.push(this.rechargeExercise.prompt)
    this.recharge.helped = true; this.recharge.hint = true
  }
  continueRecharge() {
    if (!this.recharge?.hint || this.status === 'paused') return
    this.nextRecharge()
  }
  nextRecharge() {
    if (!this.recharge || this.status === 'paused') return
    const tower = this.recharge.tower, helped = this.recharge.helped || this.recharge.hint
    this.rechargeCount++
    this.recharge = { tower, remaining: 12, feedback: '', helped, hint: false, expired: false, tried: [] }
  }
  closeRecharge() { if (this.recharge && this.status !== 'paused') { this.recharge = null; this.rechargeCount++ } }
  launch() {
    if (this.status !== 'wave-ready' || this.prepared !== 2 || !this.deployed || this.recharge || !this.placements.some((slot, i) => slot >= 0 && this.energy[i] >= shotCosts[this.types[i]])) return
    this.placingTower = null; this.status = 'wave'; this.waveTime = 0; this.spawned = 0; this.nextSpawn = 0
    this.waveStartHealth = this.health; this.waveStartEnergy = [...this.energy]
    this.petUsed = false; this.petShield = 0; this.notice = ''
    this.cooldowns.fill(0); this.aliens.length = 0; this.shots.length = 0
  }
  retryWave() {
    if (this.status !== 'defeated') return
    this.health = this.waveStartHealth; this.energy.splice(0, 6, ...this.waveStartEnergy)
    this.aliens.length = 0; this.shots.length = 0; this.recharge = null; this.placingTower = null
    this.retries++; this.variant++; this.rechargeCount += 6; this.petShield = 0; this.petUsed = false
    this.status = 'wave-ready'; this.notice = 'Change the layout or type of tower. The learning results have been saved.'
  }
  protect() { if (this.status === 'wave' && !this.petUsed) { this.petUsed = true; this.petShield = 5; this.notice = 'Pet covers base for 5 seconds' } }
  pause() {
    if (['finished', 'defeated', 'paused'].includes(this.status)) return
    this.beforePause = this.status; this.status = 'paused'
  }
  resume() { if (this.status === 'paused') this.status = this.beforePause }
  private kindFor(spawn: number) {
    return this.mission === 'watch' ? 1 : this.mission === 'swift' ? (spawn % 3 ? 0 : 1)
      : this.mission === 'group' ? 1 : this.mission === 'giant' ? (spawn % 3 === 0 ? 2 : 1) : spawn % 3
  }
  tick(rawDelta: number) {
    if (this.status !== 'wave' || !Number.isFinite(rawDelta)) return
    const elapsed = Math.max(0, Math.min(.1, rawDelta))
    if (this.recharge?.hint || this.recharge && this.mode === 'calm') return
    if (this.recharge && !this.recharge.expired) {
      this.recharge.remaining = Math.max(0, this.recharge.remaining - elapsed)
      if (!this.recharge.remaining) {
        if (!this.recharge.helped) this.reviewPrompts.push(this.rechargeExercise.prompt)
        this.recharge.expired = true; this.recharge.helped = true; this.recharge.feedback = 'Time\'s up. You can analyze the method or take a new example.'
      }
    }
    const delta = elapsed * (this.recharge ? .35 : 1)
    this.waveTime += delta; this.petShield = Math.max(0, this.petShield - delta)
    for (let i = this.shots.length - 1; i >= 0; i--) { this.shots[i].ttl -= delta; if (this.shots[i].ttl <= 0) this.shots.splice(i, 1) }
    if (this.spawned < this.totalAliens && this.waveTime >= this.nextSpawn) {
      const kind = this.kindFor(this.spawned), hp = (4 + this.wave * 2) * bubbleKinds[kind].health
      this.aliens.push({ id: this.wave * 3000 + this.spawned++ * 3 + kind, progress: 0, hp, maxHp: hp, slow: 0 })
      this.nextSpawn += this.mission === 'group' ? .65 : 1.2
    }
    for (const alien of this.aliens) {
      alien.slow = Math.max(0, alien.slow - delta)
      alien.progress += delta * .032 * bubbleKinds[alien.id % 3].speed * (alien.slow > 0 ? .6 : 1)
    }
    this.placements.forEach((slot, index) => {
      if (slot < 0) return
      this.cooldowns[index] -= delta
      const type = this.types[index], cost = shotCosts[type], towerAt = this.towerPosition(index)
      if (this.cooldowns[index] > 0 || this.energy[index] < cost) return
      const target = this.aliens.filter(alien => {
        const at = pathPosition(alien.progress)
        return alien.hp > 0 && alien.progress < 1 && Math.hypot(at.x - towerAt.x, at.z - towerAt.z) < towerRange
      }).sort((a, b) => this.priorities[index] ? b.maxHp - a.maxHp || b.progress - a.progress : b.progress - a.progress)[0]
      if (!target) return
      this.energy[index] -= cost
      const at = pathPosition(target.progress), level = this.levels[index]
      this.shots.push({ tower: index, ...at, ttl: .16 })
      if (type === 2) {
        for (const alien of this.aliens) {
          const other = pathPosition(alien.progress)
          if (Math.hypot(other.x - at.x, other.z - at.z) < 1.4 + level * .4) alien.hp -= 2
        }
      } else { target.hp -= type === 0 ? level + 1 : 1; if (type === 1) target.slow = Math.max(target.slow, 2 + level * .8) }
      this.cooldowns[index] = [.65, 1.05, 1.6][type]
    })
    for (let i = this.aliens.length - 1; i >= 0; i--) {
      const alien = this.aliens[i]
      if (alien.hp <= 0) { this.defeated++; this.aliens.splice(i, 1) }
      else if (alien.progress >= 1) {
        this.shieldHits++; if (!this.petShield) this.health = Math.max(0, this.health - [5, 9, 18][alien.id % 3])
        this.aliens.splice(i, 1)
      }
    }
    if (!this.health) { this.status = 'defeated'; this.shots.length = 0; this.notice = 'The bubbles reached the base. Try closing another section of the road.' }
    else if (this.waveComplete) { this.status = this.wave === 3 ? 'finished' : 'between'; this.shots.length = 0 }
  }
  serialize() { return JSON.stringify({ version: 2, state: { ...this, shots: [] } }) }
  static restore(raw: string | null, lesson: DefenseLessonId, homework: boolean, mission: DefenseMission, chapter: number) {
    if (!raw) return null
    try {
      const { version, state } = JSON.parse(raw)
      if (version !== 2 || !state || state.lesson !== lesson || state.homework !== homework || state.mission !== mission || state.chapter !== chapter) return null
      const result = new DefenseSession(lesson, homework, mission, chapter)
      const statuses = ['ready', 'choosing', 'question', 'explanation', 'correct', 'wave-ready', 'wave', 'between', 'finished', 'defeated']
      if (![...statuses, 'paused'].includes(state.status) || !statuses.includes(state.beforePause) || !['calm', 'practice'].includes(state.mode)) return null
      const ints: Record<string, [number, number]> = { kits: [0, 8], selectedTower: [0, 5], index: [0, 6], recovery: [0, 100000], variant: [0, 100000], errors: [0, 100000], wave: [1, 3], spawned: [0, 12], defeated: [0, 100000], shieldHits: [0, 100000], rechargeCount: [0, 100000], rechargeSolved: [0, 100000], retries: [0, 100000] }
      for (const [key, [min, max]] of Object.entries(ints)) if (!Number.isInteger(state[key]) || state[key] < min || state[key] > max) return null
      for (const key of ['health', 'waveStartHealth', 'waveTime', 'nextSpawn', 'petShield']) if (!Number.isFinite(state[key]) || state[key] < 0) return null
      if (state.health > 100 || state.waveStartHealth > 100 || typeof state.helped !== 'boolean' || typeof state.petUsed !== 'boolean' || typeof state.notice !== 'string') return null
      for (const [key, min, max, integer] of [['levels', 1, 3, true], ['types', 0, 2, true], ['placements', -1, 5, true], ['energy', 0, 100, false], ['waveStartEnergy', 0, 100, false], ['cooldowns', -100000, 100, false]] as const) {
        if (!Array.isArray(state[key]) || state[key].length !== 6 || !state[key].every((n: number) => Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n)))) return null
      }
      if (new Set(state.placements.filter((n: number) => n >= 0)).size !== state.placements.filter((n: number) => n >= 0).length) return null
      if (!Array.isArray(state.priorities) || state.priorities.length !== 6 || !state.priorities.every((n: unknown) => typeof n === 'boolean')) return null
      if (state.placingTower !== null && (!Number.isInteger(state.placingTower) || state.placingTower < 0 || state.placingTower > 5)) return null
      if (state.selectedAnswer !== null && (!Number.isInteger(state.selectedAnswer) || state.selectedAnswer < 0 || state.selectedAnswer > 2)) return null
      if (!Array.isArray(state.results) || state.results.length > 6 || !state.results.every((r: LearningResult) => r && typeof r.questionId === 'string' && typeof r.firstTry === 'boolean' && typeof r.mastered === 'boolean')) return null
      if (!Array.isArray(state.reviewPrompts) || !state.reviewPrompts.every((p: unknown) => typeof p === 'string')) return null
      if (!Array.isArray(state.chargeResults) || !state.chargeResults.every((r: {prompt: string; firstTry: boolean}) => r && typeof r.prompt === 'string' && typeof r.firstTry === 'boolean')) return null
      if (!Array.isArray(state.aliens) || state.aliens.length > 12 || !state.aliens.every((a: Alien) => a && Number.isInteger(a.id) && a.id >= 0 && [a.progress, a.hp, a.maxHp, a.slow].every(Number.isFinite) && a.progress >= 0 && a.progress <= 1 && a.hp > 0 && a.maxHp > 0 && a.slow >= 0)) return null
      if (state.recharge !== null) {
        const r = state.recharge
        if (!r || !Number.isInteger(r.tower) || r.tower < 0 || r.tower > 5 || state.placements[r.tower] < 0 || !Number.isFinite(r.remaining) || r.remaining < 0 || r.remaining > 12 || typeof r.feedback !== 'string' || [r.helped, r.hint, r.expired].some(v => typeof v !== 'boolean') || !Array.isArray(r.tried) || !r.tried.every((v: number) => Number.isInteger(v) && v >= 0 && v <= 2)) return null
      }
      for (const key of Object.keys(result)) if (key !== 'shots') Object.assign(result, { [key]: state[key] })
      if (result.status !== 'ready') result.pause()
      return result
    } catch { return null }
  }
  snapshot() {
    return { status: this.status, wave: this.wave, index: this.index, recovery: this.recovery, levels: this.levels.join(','), types: this.types.join(','),
      prepared: this.prepared, completed: this.results.length, independent: this.independent, errors: this.errors, health: this.health, kits: this.kits,
      selectedTower: this.selectedTower, spawned: this.spawned, aliens: this.aliens.length, defeated: this.defeated,
      shieldHits: this.shieldHits, waveTime: Math.round(this.waveTime * 10) / 10, mode: this.mode, mission: this.mission,
      placements: this.placements.join(','), placingTower: this.placingTower, energy: this.energy.map(Math.floor).join(','), priorities: this.priorities.join(','),
      rechargeTower: this.recharge?.tower ?? null, rechargeSeconds: this.recharge ? Math.ceil(this.recharge.remaining) : 0,
      rechargeFeedback: this.recharge?.feedback ?? '', rechargeHint: this.recharge?.hint ?? false, rechargeExpired: this.recharge?.expired ?? false,
      rechargeSolved: this.rechargeSolved, chargeIndependent: this.chargeIndependent, notice: this.notice, petUsed: this.petUsed, petShield: Math.ceil(this.petShield), retries: this.retries }
  }
}
