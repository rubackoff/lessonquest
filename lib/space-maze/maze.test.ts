import { describe, expect, it } from 'vitest'
import { canMove, createMaze, directionBetween, directions, neighbour, samePoint, shortestPath } from './maze'
import { mazeLessons, mazeQuestion } from './content'
import { actorPosition, MazeSession } from './session'

describe('space maze maps', () => {
  for (const level of [...Array.from({ length: 10 }, (_, index) => index + 1), 11, 25]) {
    it(`level ${level}: connected, deterministic, safe spawns`, () => {
      const maze = createMaze(level)
      expect(createMaze(level)).toEqual(maze)
      for (let y = 0; y < maze.rows; y++) {
        for (let x = 0; x < maze.columns; x++) {
          expect(shortestPath(maze, maze.start, { x, y }).length).toBeGreaterThan(0)
          for (const direction of directions) {
            if (!canMove(maze, { x, y }, direction)) continue
            const next = neighbour({ x, y }, direction)
            expect(next.x).toBeGreaterThanOrEqual(0)
            expect(next.x).toBeLessThan(maze.columns)
            expect(next.y).toBeGreaterThanOrEqual(0)
            expect(next.y).toBeLessThan(maze.rows)
          }
        }
      }
      for (const enemy of maze.enemies) {
        expect(shortestPath(maze, maze.start, enemy.spawn).length).toBeGreaterThan(5)
      }
      expect(new Set(maze.enemies.map((enemy) => `${enemy.spawn.x}:${enemy.spawn.y}`)).size).toBe(maze.enemies.length)
      expect(maze.enemies.every((enemy) => enemy.speed < 2.8)).toBe(true)
      for (const target of maze.beacons) {
        const forbidden = maze.beacons.filter((beacon) => beacon !== target).map((beacon) => beacon.y * maze.columns + beacon.x)
        const withoutOtherAnswers = { ...maze, cells: maze.cells.map((cell, index) => forbidden.includes(index) ? 0 : cell) }
        expect(shortestPath(withoutOtherAnswers, maze.start, target).length).toBeGreaterThan(0)
      }
    })
  }
})

const question = mazeLessons[0].questions[0]
function advance(session: MazeSession, seconds: number) {
  for (let frame = 0; frame < seconds * 120; frame++) session.step(1 / 120)
}

describe('space maze session', () => {
  it('does not move before start or while paused', () => {
    const session = new MazeSession(1, question)
    advance(session, 2)
    expect(session.seconds).toBe(0)
    session.press('right')
    advance(session, 1)
    expect(session.player.cell).toEqual(session.maze.start)
    expect(session.seconds).toBe(0)
    session.start()
    session.press('right')
    advance(session, 0.15)
    expect(actorPosition(session.player).x).toBeGreaterThan(0)
    session.pause()
    const position = { ...actorPosition(session.player) }
    advance(session, 2)
    expect(actorPosition(session.player)).toEqual(position)
    session.resume()
    advance(session, 0.3)
    expect(session.player.cell.x).toBe(1)
    expect(session.player.next).toBe(null)
  })

  it('a quick touch press finishes exactly one cell', () => {
    const session = new MazeSession(1, question)
    session.start()
    session.press('right')
    session.release('right')
    advance(session, 0.8)
    expect(session.player.cell).toEqual({ x: 1, y: session.maze.rows - 1 })
    expect(session.player.next).toBe(null)
  })

  it('cannot walk out through the border', () => {
    const session = new MazeSession(1, question)
    session.start()
    session.press('left')
    advance(session, 1)
    expect(session.player.cell).toEqual(session.maze.start)
  })

  it('reverses immediately without jumping or taking an extra cell after release', () => {
    const session = new MazeSession(1, question)
    session.start()
    session.press('right')
    advance(session, 0.15)
    const position = { ...actorPosition(session.player) }
    session.press('left')
    expect(actorPosition(session.player)).toEqual(position)
    advance(session, 0.05)
    expect(actorPosition(session.player).x).toBeLessThan(position.x)
    session.release('left')
    advance(session, 0.5)
    expect(session.player.cell).toEqual(session.maze.start)
    expect(session.player.next).toBeNull()
  })

  it('grades arrival at a beacon and keeps answer mistakes separate from lives', () => {
    for (const answer of [0, 1, 2]) {
      const session = new MazeSession(1, question)
      const beacon = session.maze.beacons[answer]
      const path = shortestPath(session.maze, session.maze.start, beacon)
      session.start()
      session.player.cell = path[path.length - 2]
      session.player.next = beacon
      session.player.progress = 0.99
      session.step(1 / 60)
      expect(session.status).toBe(answer === question.correctIndex ? 'won' : 'wrong')
      expect(session.lives).toBe(3)
      expect(session.collisions).toBe(0)
      expect(session.mistakes).toBe(answer === question.correctIndex ? 0 : 1)
      if (session.status === 'wrong') {
        session.step(1)
        expect(session.status).toBe('wrong')
        session.retryAnswer()
        expect(session.player.cell).toEqual(session.maze.start)
        expect(session.status).toBe('ready')
        const seconds = session.seconds
        advance(session, 1)
        expect(session.seconds).toBe(seconds)
        expect(session.mistakes).toBe(1)
      }
    }
  })

  it('collision damages once, respawns, and grants immunity', () => {
    const session = new MazeSession(1, question)
    session.start()
    session.immunity = 0
    session.enemies[0].cell = { ...session.player.cell }
    session.step(1 / 120)
    expect(session.lives).toBe(2)
    expect(session.collisions).toBe(1)
    expect(session.immunity).toBeGreaterThan(0)
    session.enemies[0].cell = { ...session.player.cell }
    advance(session, 1)
    expect(session.lives).toBe(2)
  })

  it('third collision loses and cannot keep damaging a finished run', () => {
    const session = new MazeSession(1, question)
    session.start()
    for (let count = 0; count < 3; count++) {
      session.immunity = 0
      session.enemies[0].cell = { ...session.player.cell }
      session.step(1 / 120)
    }
    expect(session.status).toBe('lost')
    advance(session, 3)
    expect(session.lives).toBe(0)
    expect(session.collisions).toBe(3)
  })

  it('separates subject content from mechanics and rejects incompatible options', () => {
    for (const lesson of mazeLessons) expect(new MazeSession(1, lesson.questions[0]).question).toBe(lesson.questions[0])
    expect(() => new MazeSession(1, { ...question, options: ['one'] })).toThrow()
    expect(() => new MazeSession(1, { ...question, correctIndex: 3 })).toThrow()
    for (const level of [0, -1, 1.5, NaN, Infinity]) expect(() => createMaze(level)).toThrow()
  })

  it('uses every supplied question exactly once by its position, without cycling short sets', () => {
    const lesson = { id: 'short', title: 'Two tasks', questions: mazeLessons[0].questions.slice(0, 2) }
    expect(mazeQuestion(lesson, 1)).toBe(lesson.questions[0])
    expect(mazeQuestion(lesson, 2)).toBe(lesson.questions[1])
    expect(() => mazeQuestion(lesson, 3)).toThrow()
  })

  it('can run the same question without aliens while preserving the map and grading', () => {
    const session = new MazeSession(1, question, { enemies: false })
    expect(session.enemies).toHaveLength(0)
    expect(session.maze.enemies).toHaveLength(0)
    expect(session.maze.cells).toEqual(createMaze(1).cells)
    session.start()
    advance(session, 5)
    expect(session.lives).toBe(3)
    expect(session.collisions).toBe(0)
    const beacon = session.maze.beacons[question.correctIndex]
    const path = shortestPath(session.maze, session.maze.start, beacon)
    session.player.cell = path[path.length - 2]
    session.player.next = beacon
    session.player.progress = .99
    session.step(1 / 60)
    expect(session.status).toBe('won')
  })

  it('has ten distinct, valid questions with explanations in every subject', () => {
    const ids = new Set<string>()
    for (const lesson of mazeLessons) {
      expect(lesson.questions).toHaveLength(10)
      expect(new Set(lesson.questions.map((item) => item.prompt)).size).toBe(10)
      for (let level = 1; level <= 10; level++) {
        const item = mazeQuestion(lesson, level)
        expect(() => new MazeSession(level, item)).not.toThrow()
        expect(new Set(item.options).size).toBe(3)
        expect(item.explanation.trim().length).toBeGreaterThan(10)
        expect(ids.has(item.id)).toBe(false)
        ids.add(item.id)
      }
    }
  })

  it('gives comparable movement at 30 and 60 FPS', () => {
    const positions = [30, 60].map((fps) => {
      const session = new MazeSession(1, question)
      session.start()
      session.press('right')
      for (let i = 0; i < fps * 0.2; i++) session.step(1 / fps)
      return actorPosition(session.player).x
    })
    expect(Math.abs(positions[0] - positions[1])).toBeLessThan(0.03)
  })

  it('completes ten levels through real movement without walking through wrong answers', () => {
    for (let level = 1; level <= 10; level++) {
      const session = new MazeSession(level, mazeQuestion(mazeLessons[0], level))
      const target = session.maze.beacons[session.question.correctIndex]
      const forbidden = session.maze.beacons.filter((beacon) => !samePoint(beacon, target))
        .map((beacon) => beacon.y * session.maze.columns + beacon.x)
      const map = { ...session.maze, cells: session.maze.cells.map((cell, index) => forbidden.includes(index) ? 0 : cell) }
      const path = shortestPath(map, session.maze.start, target)
      // Isolate the answer/movement contract; enemy damage has separate tests.
      session.immunity = 100
      session.start()
      for (let i = 1; i < path.length; i++) {
        const direction = directionBetween(path[i - 1], path[i])
        session.press(direction)
        session.release(direction)
        advance(session, 0.4)
        expect(session.player.cell).toEqual(path[i])
      }
      expect(session.status).toBe('won')
      expect(session.mistakes).toBe(0)
      expect(session.seconds).toBeGreaterThan(0)
    }
  })
})
