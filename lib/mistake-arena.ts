export type MistakeArenaLevel = {
  id: number
  title: string
  subject: string
  grade: string
  prompt: string
  tokens: string[]
  correctIndex: number
  correctToken: string
  rule: string
  explanation: string
  teacherNote: string
}

export type MistakeArenaResult = {
  hasSelection: boolean
  correct: boolean
  selectedToken: string
  accuracy: number
  status: string
}

export const mistakeArenaLevels: MistakeArenaLevel[] = [
  {
    id: 1,
    title: 'Expanding parentheses',
    subject: 'Algebra',
    grade: 'Grade 7',
    prompt: 'Find the fragment where the student violated the distribution rule.',
    tokens: ['2', '(', 'x', '+', '5', ')', '=', '2x', '+', '5'],
    correctIndex: 9,
    correctToken: '10',
    rule: 'The factor in front of the parentheses refers to each term.',
    explanation: 'It should be 2(x + 5) = 2x + 10. The student did not multiply 5 by 2.',
    teacherNote:
      'A good format for diagnostics: the student does not simply select an answer, but indicates the exact location of the error.',
  },
  {
    id: 2,
    title: 'Speed formula',
    subject: 'Physics',
    grade: 'Grade 7',
    prompt: 'Find the sign of the operation that made the formula incorrect.',
    tokens: ['v', '=', 'S', '·', 't'],
    correctIndex: 3,
    correctToken: '/',
    rule: 'Speed ​​equals distance divided by time.',
    explanation: 'The correct formula is: v = S / t. Multiplication here changes the meaning of the relationship.',
    teacherNote:
      'Suitable for exact sciences: the error may not be a number, but a sign, a unit of measurement, or a relationship of quantities.',
  },
  {
    id: 3,
    title: 'Subject-verb agreement', subject: 'Language Arts', grade: 'Grade 6',
    prompt: 'Find the verb that does not agree with the subject.',
    tokens: ['She', 'walk', 'to', 'school', 'every', 'day'],
    correctIndex: 1, correctToken: 'walks',
    rule: 'In the present simple, a third-person singular subject usually takes a verb ending in -s.',
    explanation: 'She walks to school every day. The singular subject she requires walks.',
    teacherNote: 'Ask the student to identify the subject before changing the verb.',
  },
]

export function getMistakeArenaResult(
  level: MistakeArenaLevel,
  selectedIndex: number | null,
): MistakeArenaResult {
  const hasSelection = selectedIndex !== null
  const correct = selectedIndex === level.correctIndex
  const selectedToken = hasSelection ? level.tokens[selectedIndex] : ''
  const distance = hasSelection ? Math.abs(selectedIndex - level.correctIndex) : level.tokens.length
  const accuracy = hasSelection ? Math.max(20, 100 - distance * 18) : 0

  return {
    hasSelection,
    correct,
    selectedToken,
    accuracy,
    status: correct ? 'error found' : hasSelection ? 'need another zone' : 'select a fragment',
  }
}
