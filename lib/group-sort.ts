import type { LearningImage } from '@/lib/learning-media'

export type GroupSortGroup = {
  id: string
  title: string
}

export type GroupSortItem = {
  id: string
  label: string
  groupId: string
  media?: LearningImage
}

export type GroupPlacement = {
  itemId: string
  groupId: string
}

export type GroupSortLevel = {
  id: number
  title: string
  subject: string
  grade: string
  prompt: string
  groups: GroupSortGroup[]
  items: GroupSortItem[]
  teacherNote: string
}

export type GroupSortResult = {
  total: number
  placed: number
  correct: number
  complete: boolean
  accuracy: number
  status: string
}

export const groupSortLevels: GroupSortLevel[] = [
  {
    id: 1,
    title: 'Sorting by Items',
    subject: 'Mix item',
    grade: '6-7 grade',
    prompt: 'Drag cards into subject collections. The wrong station will gently return the card.',
    groups: [
      { id: 'algebra', title: 'Algebra' },
      { id: 'physics', title: 'Physics' },
      { id: 'language-arts', title: 'Language Arts' },
    ],
    items: [
      { id: 'eq', label: '2x + 4 = 16', groupId: 'algebra' },
      { id: 'force', label: 'F = m · a', groupId: 'physics' },
      { id: 'subject', label: 'subject', groupId: 'language-arts' },
      { id: 'speed', label: 'v = S / t', groupId: 'physics' },
      { id: 'suffix', label: 'suffix', groupId: 'language-arts' },
      { id: 'combine', label: '9m - 2m', groupId: 'algebra' },
    ],
    teacherNote:
      'Classification is needed for quick diagnostics: the child shows how he sees the structure of the topic.',
  },
  {
    id: 2,
    title: 'Types of Expressions',
    subject: 'Algebra',
    grade: 'Grade 7',
    prompt: 'Sort the notes by type: equation, expression or formula.',
    groups: [
      { id: 'equation', title: 'Equations' },
      { id: 'expression', title: 'Expressions' },
      { id: 'formula', title: 'Formulas' },
    ],
    items: [
      { id: 'e1', label: '3(x - 2) = 12', groupId: 'equation' },
      { id: 'x1', label: '7m + 5', groupId: 'expression' },
      { id: 'f1', label: 'S = v · t', groupId: 'formula' },
      { id: 'e2', label: 'x / 2 + 5 = 11', groupId: 'equation' },
      { id: 'x2', label: '2x + 10', groupId: 'expression' },
      { id: 'f2', label: 'F = m · a', groupId: 'formula' },
    ],
    teacherNote:
      'The same mechanics can be filled with material from algebra: the structure of the task does not depend on specific numbers.',
  },
  {
    id: 3,
    title: 'Units of measurement',
    subject: 'Physics',
    grade: 'Grade 7',
    prompt: 'Drag units to values.',
    groups: [
      { id: 'force', title: 'Strength' },
      { id: 'speed', title: 'Speed' },
      { id: 'mass', title: 'Weight' },
    ],
    items: [
      { id: 'n', label: 'N', groupId: 'force' },
      { id: 'kg', label: 'kg', groupId: 'mass' },
      { id: 'ms', label: 'm/s', groupId: 'speed' },
      { id: 'newton', label: 'newton', groupId: 'force' },
      { id: 'kilogram', label: 'kilogram', groupId: 'mass' },
      { id: 'speed-text', label: 'meter per second', groupId: 'speed' },
    ],
    teacherNote:
      'Suitable for PhET-like simulations: before the experiment, the student sorts quantities and units.',
  },
]

export function getGroupSortResult(
  level: GroupSortLevel,
  placements: GroupPlacement[],
): GroupSortResult {
  const placed = placements.length
  const correct = placements.filter((placement) => {
    const item = level.items.find((candidate) => candidate.id === placement.itemId)
    return item?.groupId === placement.groupId
  }).length
  const total = level.items.length
  const complete = placed === total && correct === total
  const accuracy = placed === 0 ? 0 : Math.round((correct / placed) * 100)

  return {
    total,
    placed,
    correct,
    complete,
    accuracy,
    status: complete ? 'all groups are assembled' : placed === 0 ? 'drag the card' : `${correct}/${total} right`,
  }
}
