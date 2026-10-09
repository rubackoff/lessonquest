import type { GeometryDiagramSpec } from '@/lib/geometry-diagrams'
import type { LearningImage } from '@/lib/learning-media'
import type { VisualThemeId } from '@/lib/visual-themes'

export type MatchPair = {
  id: string
  left: string
  right: string
  visual?: GeometryDiagramSpec
  leftMedia?: LearningImage
  rightMedia?: LearningImage
}

export type MatchConnection = {
  leftIndex: number
  rightIndex: number
}

export type MatchPairsLevel = {
  id: number
  title: string
  subject: string
  grade: string
  prompt: string
  pairs: MatchPair[]
  teacherNote: string
  visualThemeId?: VisualThemeId
}

export type MatchPairsResult = {
  total: number
  connected: number
  correct: number
  attempts: number
  complete: boolean
  accuracy: number
  status: string
}

export const matchPairsLevels: MatchPairsLevel[] = [
  {
    id: 1,
    title: 'Movement formulas',
    subject: 'Physics',
    grade: 'Grade 7',
    prompt: 'Match the quantity with the formula. The erroneous line will immediately be highlighted in red.',
    visualThemeId: 'corgi-classic',
    pairs: [
      { id: 'speed', left: 'Speed', right: 'v = S / t' },
      { id: 'path', left: 'Distance', right: 'S = v · t' },
      { id: 'time', left: 'Time', right: 't = S / v' },
      { id: 'force', left: 'Force', right: 'F = m · a' },
    ],
    teacherNote:
      'Pairs are good for exact sciences: formula, unit of measurement, graph, definition, example.',
  },
  {
    id: 2,
    title: 'Algebraic transformations',
    subject: 'Algebra',
    grade: 'Grade 7',
    prompt: 'Associate the original expression with the result of the transformation.',
    visualThemeId: 'deep-sea',
    pairs: [
      { id: 'distribute', left: '2(x + 5)', right: '2x + 10' },
      { id: 'combine', left: '9m - 2m', right: '7m' },
      { id: 'divide', left: 'x / 2 = 6', right: 'x = 12' },
      { id: 'brackets', left: '3(x - 2)', right: '3x - 6' },
    ],
    teacherNote:
      'This format can be quickly generated from cards: one knowledge base gives pairs, quiz and error.',
  },
  {
    id: 3,
    title: 'Term and meaning',
    subject: 'Language Arts',
    grade: 'Grade 6',
    prompt: 'Match the term with a short explanation.',
    visualThemeId: 'corgi-classic',
    pairs: [
      { id: 'subject', left: 'Subject', right: 'who or what is being talked about' },
      { id: 'predicate', left: 'Predicate', right: 'what does the item do' },
      { id: 'prefix', left: 'Prefix', right: 'part of the word before the root' },
      { id: 'suffix', left: 'Suffix', right: 'part of the word after the root' },
    ],
    teacherNote:
      'One template is suitable for both exact sciences and humanities: only the educational material changes.',
  },
]

export function getMatchPairsResult(
  level: MatchPairsLevel,
  connections: MatchConnection[],
  attempts = connections.length,
): MatchPairsResult {
  const correct = connections.filter((connection) => {
    const left = level.pairs[connection.leftIndex]
    const right = level.pairs[connection.rightIndex]
    return Boolean(left && right && left.id === right.id)
  }).length
  const connected = connections.length
  const total = level.pairs.length
  const complete = connected === total && correct === total
  const accuracy = attempts === 0 ? 0 : Math.round((correct / attempts) * 100)

  return {
    total,
    connected,
    correct,
    attempts,
    complete,
    accuracy,
    status: complete ? 'all pairs are collected' : connected === 0 ? 'reach out' : `${correct}/${total} right`,
  }
}
