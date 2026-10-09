export type Point = { x: number; y: number }
export type Direction = 'up' | 'right' | 'down' | 'left'
export type EnemyKind = 'scout' | 'hunter' | 'interceptor'
export type Maze = {
  columns: number
  rows: number
  cells: number[]
  start: Point
  beacons: Point[]
  enemies: Array<{ kind: EnemyKind; spawn: Point; speed: number }>
}

export const directions: Direction[] = ['up', 'right', 'down', 'left']
export const vectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 }, right: { x: 1, y: 0 },
  down: { x: 0, y: 1 }, left: { x: -1, y: 0 },
}
const bits: Record<Direction, number> = { up: 1, right: 2, down: 4, left: 8 }
const reverse: Record<Direction, Direction> = { up: 'down', right: 'left', down: 'up', left: 'right' }
export const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y

export function neighbour(point: Point, direction: Direction): Point {
  return { x: point.x + vectors[direction].x, y: point.y + vectors[direction].y }
}

export function canMove(maze: Maze, point: Point, direction: Direction) {
  return Boolean(maze.cells[point.y * maze.columns + point.x] & bits[direction])
}

export function shortestPath(maze: Maze, from: Point, to: Point): Point[] {
  const index = (point: Point) => point.y * maze.columns + point.x
  const previous = new Map<number, Point | null>([[index(from), null]])
  const queue = [from]
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const point = queue[cursor]
    if (samePoint(point, to)) {
      const path: Point[] = []
      let current: Point | null = point
      while (current) {
        path.unshift(current)
        current = previous.get(index(current)) ?? null
      }
      return path
    }
    for (const direction of directions) {
      if (!canMove(maze, point, direction)) continue
      const next = neighbour(point, direction)
      if (previous.has(index(next))) continue
      previous.set(index(next), point)
      queue.push(next)
    }
  }
  return []
}

export function directionBetween(from: Point, to: Point): Direction {
  if (to.x > from.x) return 'right'
  if (to.x < from.x) return 'left'
  return to.y > from.y ? 'down' : 'up'
}

export function createMaze(level: number): Maze {
  if (!Number.isInteger(level) || level < 1) throw new Error('The level number must be a positive integer')
  const difficulty = Math.min(level, 10)
  const columns = level <= 2 ? 7 : level <= 6 ? 8 : 9
  const rows = level <= 4 ? 6 : level <= 8 ? 7 : 8
  const maze: Maze = {
    columns, rows, cells: Array(columns * rows).fill(0),
    start: { x: 0, y: rows - 1 },
    beacons: [{ x: 0, y: 0 }, { x: columns - 1, y: 0 }, { x: columns - 1, y: rows - 1 }],
    enemies: [],
  }
  let seed = level * 7919 + 104729
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const valid = (p: Point) => p.x >= 0 && p.x < columns && p.y >= 0 && p.y < rows
  const open = (p: Point, direction: Direction) => {
    const next = neighbour(p, direction)
    maze.cells[p.y * columns + p.x] |= bits[direction]
    maze.cells[next.y * columns + next.x] |= bits[reverse[direction]]
  }
  const visited = new Set([maze.start.y * columns + maze.start.x])
  const stack = [maze.start]
  while (stack.length) {
    const point = stack[stack.length - 1]
    const options = directions.filter((direction) => {
      const next = neighbour(point, direction)
      return valid(next) && !visited.has(next.y * columns + next.x)
    })
    if (!options.length) { stack.pop(); continue }
    const direction = options[Math.floor(random() * options.length)]
    const next = neighbour(point, direction)
    open(point, direction)
    visited.add(next.y * columns + next.x)
    stack.push(next)
  }
  // Loops offer escape routes; a perfect tree maze would let enemies trap learners.
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      for (const direction of ['right', 'down'] as const) {
        if (valid(neighbour({ x, y }, direction)) && random() < 0.18) open({ x, y }, direction)
      }
    }
  }
  // The first move is predictable on all maps, including touch devices.
  open(maze.start, 'right')
  open(maze.start, 'up')
  // An answer must never be a mandatory transit tile on the way to another answer.
  open({ x: 1, y: 0 }, 'down')
  open({ x: 0, y: 1 }, 'right')
  open({ x: columns - 2, y: 0 }, 'down')
  open({ x: columns - 2, y: 1 }, 'right')
  open({ x: columns - 2, y: rows - 1 }, 'up')
  open({ x: columns - 2, y: rows - 2 }, 'right')
  const kinds: EnemyKind[] = level < 3 ? ['scout'] : level < 7 ? ['scout', 'hunter'] : ['scout', 'hunter', 'interceptor']
  const candidates: Point[] = []
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < columns - 1; x++) candidates.push({ x, y })
  }
  candidates.sort((a, b) => shortestPath(maze, maze.start, b).length - shortestPath(maze, maze.start, a).length)
  kinds.forEach((kind, index) => {
    const spawn = candidates.find((point) => maze.enemies.every((enemy) =>
      Math.abs(enemy.spawn.x - point.x) + Math.abs(enemy.spawn.y - point.y) >= 3))!
    maze.enemies.push({ kind, spawn, speed: 0.65 + difficulty * 0.045 + index * 0.16 })
  })
  return maze
}
