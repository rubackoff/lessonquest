import type { QuizQuestion } from '../quiz-rush'
import { validateLearningGameQuestions, type LearningGameLesson } from '../learning-game-content'

export type RunnerCommand = 'left' | 'right' | 'jump' | 'slide'
export type RunnerStatus = 'ready' | 'playing' | 'paused' | 'finished' | 'gameover'
export type CourseItem = { id: number; distance: number; lane: number; kind: 'coin' | 'hurdle' | 'beam' | 'crate' }
export type RunnerLesson = LearningGameLesson
export type RunnerSettings = { obstacles: boolean; pace: 'calm' | 'normal' }
export const defaultRunnerSettings: RunnerSettings = { obstacles: true, pace: 'calm' }
export const laneWidth = 2.2
export const checkpointSpacing = 40
const durations = { jump: 1.05, slide: 1.05 }

// Each obstacle row leaves a full lane open, with no hazards at checkpoints.
export function createRunnerCourse(rounds: number, obstacles = true): CourseItem[] {
  const course: CourseItem[] = []
  const add = (distance: number, lane: number, kind: CourseItem['kind']) => course.push({ id: course.length, distance, lane, kind })
  for (let section = 0; section < rounds; section++) {
    const base = section * checkpointSpacing
    for (let i = 0; obstacles && i < 2; i++) {
      const distance = base + 14 + i * 10
      const lane = (i + section) % 3 - 1
      add(distance, lane, ['hurdle', 'beam', 'crate'][(i + section) % 3] as CourseItem['kind'])
      if (section > 1 && i === 0) add(distance, lane === -1 ? 1 : -1, 'crate')
    }
    for (let distance = 6; distance < 28; distance += 4) {
      const obstacles = course.filter((item) => item.kind !== 'coin' && Math.abs(item.distance - (base + distance)) < 3)
      let lane = Math.floor(distance / 16 + section) % 3 - 1
      while (obstacles.some((item) => item.lane === lane)) lane = lane === 1 ? -1 : lane + 1
      add(base + distance, lane, 'coin')
    }
  }
  return course.sort((a, b) => a.distance - b.distance || a.id - b.id)
}

export class RunnerSession {
  readonly course: CourseItem[]
  readonly resolved = new Set<number>()
  readonly responses: Array<{ questionId: string; answerIndex: number; correct: boolean }> = []
  status: RunnerStatus = 'ready'
  distance = 0
  lane = 0
  x = 0
  lives = 3
  coins = 0
  collisions = 0
  correct = 0
  answered = 0
  selectedAnswer: number | null = null
  action: 'jump' | 'slide' | null = null
  actionTime = 0
  invulnerable = 0
  feedbackTime = 0
  feedback = ''

  constructor(readonly questions: readonly QuizQuestion[], readonly settings: RunnerSettings = defaultRunnerSettings) {
    validateLearningGameQuestions(questions)
    this.course = createRunnerCourse(questions.length, settings.obstacles)
  }

  get level() { return Math.min(3, 1 + Math.floor(Math.min(this.answered, this.questionCount - 1) / Math.ceil(this.questionCount / 3))) }
  get speed() { return (this.settings.pace === 'calm' ? 5.5 : 7.5) + (this.level - 1) * .4 }
  get question() { return this.questions[Math.min(this.answered, this.questions.length - 1)] }
  get questionCount() { return this.questions.length }
  get incorrectQuestions() { return this.questions.filter((_, index) => this.responses[index] && !this.responses[index].correct) }
  get checkpoint() { return (Math.min(this.answered, this.questionCount - 1) + 1) * checkpointSpacing }
  get actionProgress() { return this.action ? Math.min(1, this.actionTime / durations[this.action]) : 0 }
  get jumpHeight() { return this.action === 'jump' ? Math.sin(this.actionProgress * Math.PI) * 1.45 : 0 }
  get sliding() { return this.action === 'slide' && this.actionProgress > .12 && this.actionProgress < .88 }

  start() { if (this.status === 'ready') this.status = 'playing' }
  pause() { if (this.status === 'playing') this.status = 'paused' }
  resume() { if (this.status === 'paused') this.status = 'playing' }

  command(command: RunnerCommand) {
    if (this.status !== 'playing') return
    if (command === 'left' || command === 'right') this.lane = Math.max(-1, Math.min(1, this.lane + (command === 'left' ? -1 : 1)))
    else if (!this.action) { this.action = command; this.actionTime = 0 }
  }

  selectLane(index: number) {
    if (!['ready', 'playing'].includes(this.status) || !Number.isInteger(index) || index < 0 || index > 2) return
    this.lane = index - 1
    if (this.status === 'ready') this.x = this.lane * laneWidth
  }

  tick(seconds: number) {
    if (this.status !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return
    // Substeps prevent tunnelling on slow frames, without fast-forwarding after a hidden tab.
    let remaining = Math.min(seconds, .1)
    while (remaining > 1e-8 && this.status === 'playing') {
      const dt = Math.min(remaining, 1 / 120)
      remaining -= dt
      const previous = this.distance
      const checkpoint = this.checkpoint
      this.distance = Math.min(checkpoint, this.distance + this.speed * dt)
      this.x += (this.lane * laneWidth - this.x) * (1 - Math.exp(-dt * 14))
      this.invulnerable = Math.max(0, this.invulnerable - dt)
      this.feedbackTime = Math.max(0, this.feedbackTime - dt)
      if (this.action) {
        this.actionTime += dt
        if (this.actionTime >= durations[this.action]) { this.action = null; this.actionTime = 0 }
      }
      for (const item of this.course) {
        if (this.resolved.has(item.id) || item.distance - .7 > this.distance) continue
        if (item.distance + .7 < previous) { this.resolved.add(item.id); continue }
        const nearLane = Math.abs(this.x - item.lane * laneWidth) < .78
        if (!nearLane) continue
        if (item.kind === 'coin') { this.coins++; this.resolved.add(item.id); continue }
        const cleared = item.kind === 'hurdle' && this.jumpHeight > .65 || item.kind === 'beam' && this.sliding
        if (cleared || this.invulnerable > 0) continue
        this.resolved.add(item.id)
        this.collisions++
        this.lives--
        this.invulnerable = 1.6
        if (!this.lives) { this.status = 'gameover'; break }
      }
      if (this.status === 'playing' && this.distance >= checkpoint) {
        this.selectedAnswer = Math.max(0, Math.min(2, Math.round(this.x / laneWidth) + 1))
        const correct = this.selectedAnswer === this.question.correctIndex
        if (correct) this.correct++
        else this.lives--
        this.feedback = correct ? 'That\'s right! Keep running.' : `−1 life. ${this.question.explanation}`
        this.feedbackTime = 3
        this.responses.push({ questionId: this.question.id, answerIndex: this.selectedAnswer, correct })
        this.answered++
        if (!this.lives) this.status = 'gameover'
        else if (this.answered === this.questionCount) this.status = 'finished'
      }
    }
  }

  snapshot() {
    return { status: this.status, distance: Math.floor(this.distance), lane: this.lane, lives: this.lives,
      coins: this.coins, collisions: this.collisions, correct: this.correct, answered: this.answered,
      selectedAnswer: this.selectedAnswer, action: this.action, level: this.level,
      feedback: this.feedbackTime > 0 ? this.feedback : '' }
  }
}

export type RunnerSnapshot = ReturnType<RunnerSession['snapshot']>
