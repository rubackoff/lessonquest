export type ForceVector = {
  force: number
  angle: number
}

export type MistakeChallenge = {
  statement: string
  options: string[]
  correctIndex: number
  explanation: string
}

export type ForceLabLevel = {
  id: number
  title: string
  subject: string
  grade: string
  equation: string
  unknown: string
  answer: string
  targetForce: number
  targetAngle: number
  mass: number
  friction: number
  fieldForce: number
  lesson: string
  teacherNote: string
  mistake: MistakeChallenge
}

export type BalanceResult = {
  answerCorrect: boolean
  vectorAligned: boolean
  gateOpen: boolean
  forceGap: number
  angleGap: number
  netForce: number
  efficiency: number
}

export const forceLabLevels: ForceLabLevel[] = [
  {
    id: 1,
    title: 'Linear equation and resultant',
    subject: 'Algebra + physics',
    grade: 'Grade 7',
    equation: '2x + 4 = 16',
    unknown: 'x',
    answer: '6',
    targetForce: 8,
    targetAngle: 24,
    mass: 6,
    friction: 2,
    fieldForce: 10,
    lesson:
      'First solve the equation, then set F2 so that the cart passes through the gate without overload.',
    teacherNote:
      'Goal of the level: to connect the transfer of terms with the idea of ​​force compensation. The child sees that the correct answer by itself does not open the gate without adjusting the vector.',
    mistake: {
      statement: '2(x + 5) = 2x + 5',
      options: ['wrong sign', 'didn\'t multiply 5', 'extra coefficient x'],
      correctIndex: 1,
      explanation: 'When opening the parentheses, we multiply both terms: 2x + 10.',
    },
  },
  {
    id: 2,
    title: 'Brackets, mass and force reserve',
    subject: 'Algebra + mechanics',
    grade: 'Grade 7',
    equation: '3(x - 2) = 12',
    unknown: 'x',
    answer: '6',
    targetForce: 11,
    targetAngle: 32,
    mass: 8,
    friction: 3,
    fieldForce: 13,
    lesson:
      'Open the brackets and select a vector. The higher the mass and friction, the smaller the margin for force error.',
    teacherNote:
      'The level complicates the mechanics: the force must be greater, and the angle is more important to open the gate.',
    mistake: {
      statement: '3(x - 2) = 3x - 2',
      options: ['lost multiplier 3', 'changed the sign', 'x was written incorrectly'],
      correctIndex: 0,
      explanation: 'The factor 3 applies to both x and -2: we get 3x - 6.',
    },
  },
  {
    id: 3,
    title: 'Fractional coefficient and precise calibration',
    subject: 'Algebra + experiment',
    grade: 'Grade 7',
    equation: 'x / 2 + 5 = 11',
    unknown: 'x',
    answer: '12',
    targetForce: 13,
    targetAngle: 18,
    mass: 9,
    friction: 4,
    fieldForce: 15,
    lesson:
      'First remove the free term, then multiply both sides by 2. The scene requires a precise, almost horizontal impulse.',
    teacherNote:
      'Suitable as a control level: The answer is simple, but the physical part requires careful management.',
    mistake: {
      statement: 'x / 2 + 5 = 11, so x = 3',
      options: ['division instead of multiplication', 'lost sign', 'extra five'],
      correctIndex: 0,
      explanation: 'After x / 2 = 6, you need to multiply both sides by 2, so x = 12.',
    },
  },
]

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeAnswer(value: string) {
  return value.trim().replace(',', '.').replace(/\s+/g, '').toLowerCase()
}

export function getBalanceResult(
  level: ForceLabLevel,
  vector: ForceVector,
  answer: string,
): BalanceResult {
  const forceGap = Math.abs(vector.force - level.targetForce)
  const angleGap = Math.abs(vector.angle - level.targetAngle)
  const answerCorrect = normalizeAnswer(answer) === normalizeAnswer(level.answer)
  const vectorAligned = forceGap <= 0.75 && angleGap <= 3
  const netForce = Math.hypot(forceGap, angleGap / 3)
  const efficiency = Math.round(clamp(100 - forceGap * 9 - angleGap * 2.2, 0, 100))

  return {
    answerCorrect,
    vectorAligned,
    gateOpen: answerCorrect && vectorAligned,
    forceGap,
    angleGap,
    netForce,
    efficiency,
  }
}

export function formatGap(value: number) {
  return value < 0.05 ? '0.0' : value.toFixed(1)
}

