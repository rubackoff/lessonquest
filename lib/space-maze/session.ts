import type { QuizQuestion } from '../quiz-rush'
import { validateLearningGameQuestions } from '../learning-game-content'
import { canMove, createMaze, directionBetween, neighbour, samePoint, shortestPath, type Direction, type Maze, type Point } from './maze'

export type Actor = { cell: Point; next: Point | null; progress: number; facing: Direction }
export type MazeStatus = 'ready' | 'playing' | 'paused' | 'wrong' | 'won' | 'lost'
export type MazeSettings = { enemies: boolean }
export const defaultMazeSettings: MazeSettings = { enemies: true }
export type MazeSnapshot = {
  status: MazeStatus; lives: number; seconds: number; mistakes: number; collisions: number; answer: number | null; immunity: number; row: number; column: number
}

const createActor = (cell: Point): Actor => ({ cell: { ...cell }, next: null, progress: 0, facing: 'up' })
export function actorPosition(actor: Actor): Point {
  if (!actor.next) return actor.cell
  return {
    x: actor.cell.x + (actor.next.x - actor.cell.x) * actor.progress,
    y: actor.cell.y + (actor.next.y - actor.cell.y) * actor.progress,
  }
}

export class MazeSession {
  readonly maze: Maze
  player: Actor
  enemies: Actor[]
  status: MazeStatus = 'ready'
  lives = 3
  seconds = 0
  mistakes = 0
  collisions = 0
  answer: number | null = null
  immunity = 3
  private held: Direction | null = null
  private queued: Direction | null = null
  private continuing = false
  private patrol: number[]

  constructor(readonly level: number, readonly question: QuizQuestion, readonly settings: MazeSettings = defaultMazeSettings) {
    validateLearningGameQuestions([question])
    this.maze = createMaze(level)
    if (!settings.enemies) this.maze.enemies = []
    this.player = createActor(this.maze.start)
    this.enemies = this.maze.enemies.map((enemy) => createActor(enemy.spawn))
    this.patrol = this.enemies.map((_, index) => index)
  }

  snapshot(): MazeSnapshot {
    return { status: this.status, lives: this.lives, seconds: Math.floor(this.seconds),
      mistakes: this.mistakes, collisions: this.collisions, answer: this.answer, immunity: Math.ceil(this.immunity),
      row: this.player.cell.y + 1, column: this.player.cell.x + 1 }
  }

  start() { if (this.status === 'ready') this.status = 'playing' }
  pause() {
    if (this.status === 'playing') this.status = 'paused'
    this.clearInput()
  }
  resume() { if (this.status === 'paused') this.status = 'playing' }
  press(direction: Direction) {
    if (this.status !== 'playing') return
    // Turning back in a corridor must not wait until the next intersection.
    const reversing = this.player.next && directionBetween(this.player.next, this.player.cell) === direction
    if (reversing && this.player.next) {
      const previous = this.player.cell
      this.player.cell = this.player.next
      this.player.next = previous
      this.player.progress = 1 - this.player.progress
      this.player.facing = direction
    }
    this.held = direction
    this.queued = reversing ? null : direction
  }
  release(direction: Direction) { if (this.held === direction) { this.held = null; this.continuing = false } }
  clearInput() { this.held = null; this.queued = null; this.continuing = false }

  retryAnswer() {
    if (this.status !== 'wrong') return
    this.answer = null
    this.resetActors()
    this.status = 'ready'
  }

  private resetActors() {
    this.player = createActor(this.maze.start)
    this.enemies = this.maze.enemies.map((enemy) => createActor(enemy.spawn))
    this.immunity = 3
    this.clearInput()
  }

  private travel(actor: Actor, speed: number, dt: number) {
    if (!actor.next) return false
    actor.progress += speed * dt
    if (actor.progress < 1) return false
    actor.cell = actor.next
    actor.next = null
    actor.progress = 0
    return true
  }

  private move(actor: Actor, direction: Direction) {
    if (!canMove(this.maze, actor.cell, direction)) return
    actor.next = neighbour(actor.cell, direction)
    actor.facing = direction
  }

  private moveEnemy(index: number) {
    const actor = this.enemies[index]
    const spec = this.maze.enemies[index]
    const targets = [...this.maze.beacons, this.maze.start]
    let target = targets[this.patrol[index] % targets.length]
    const distance = Math.abs(actor.cell.x - this.player.cell.x) + Math.abs(actor.cell.y - this.player.cell.y)
    if (spec.kind !== 'scout' && distance <= 6) {
      target = this.player.next ?? this.player.cell
      if (spec.kind === 'interceptor') {
        for (let step = 0; step < 2; step++) {
          if (canMove(this.maze, target, this.player.facing)) target = neighbour(target, this.player.facing)
        }
      }
    } else if (samePoint(actor.cell, target)) {
      this.patrol[index]++
      target = targets[this.patrol[index] % targets.length]
    }
    const path = shortestPath(this.maze, actor.cell, target)
    if (path.length > 1) this.move(actor, directionBetween(actor.cell, path[1]))
  }

  step(delta: number) {
    if (this.status !== 'playing' || !Number.isFinite(delta) || delta <= 0) return
    // Fixed-sized substeps prevent tunnelling at low frame rates or after a hitch.
    let remaining = Math.min(delta, 0.1)
    while (remaining > 0 && this.status === 'playing') {
      const dt = Math.min(remaining, 1 / 120)
      remaining -= dt
      this.seconds += dt
      this.immunity = Math.max(0, this.immunity - dt)
      if (!this.player.next) {
        const wanted = this.queued ?? this.held
        if (wanted && canMove(this.maze, this.player.cell, wanted)) {
          this.move(this.player, wanted)
          this.queued = null
          this.continuing = Boolean(this.held)
        } else if (this.held && this.continuing) {
          this.move(this.player, this.player.facing)
          if (!this.player.next) this.continuing = false
        }
      }
      const arrived = this.travel(this.player, 2.8, dt)
      if (arrived) {
        const beacon = this.maze.beacons.findIndex((point) => samePoint(point, this.player.cell))
        if (beacon !== -1) {
          this.answer = beacon
          this.clearInput()
          if (beacon === this.question.correctIndex) this.status = 'won'
          else {
            this.mistakes++
            this.status = 'wrong'
          }
          return
        }
      }
      if (this.immunity > 0) continue
      for (let index = 0; index < this.enemies.length; index++) {
        const enemy = this.enemies[index]
        if (!enemy.next) this.moveEnemy(index)
        this.travel(enemy, this.maze.enemies[index].speed, dt)
        const a = actorPosition(this.player)
        const b = actorPosition(enemy)
        if (Math.hypot(a.x - b.x, a.y - b.y) < 0.43) {
          this.collisions++
          this.lives--
          this.resetActors()
          if (this.lives === 0) this.status = 'lost'
          break
        }
      }
    }
  }
}
