import type { LearningImage } from '@/lib/learning-media'

export type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
  media?: LearningImage
  optionMedia?: Array<LearningImage | null>
}

export type QuizRushLevel = {
  id: number
  title: string
  subject: string
  grade: string
  prompt: string
  questions: QuizQuestion[]
  teacherNote: string
}

export type QuizRushResult = {
  total: number
  answered: number
  correct: number
  complete: boolean
  accuracy: number
  status: string
}

export const quizRushLevels: QuizRushLevel[] = [
  {
    id: 1,
    title: 'English at the airport',
    subject: 'English',
    grade: 'Adult, A2-B1',
    prompt: 'Choose a natural response for each situation.',
    questions: [
      {
        id: 'check-in',
        prompt: 'The employee asks to show your passport. What to answer?',
        options: ['Here you are.', 'Never mind.', 'It is up to you.'],
        correctIndex: 0,
        explanation: 'Here you are is used when an object or document is handed over to a person.',
      },
      {
        id: 'delay',
        prompt: 'How to ask about the reason for a flight delay?',
        options: ['Where is my chair?', 'Why has the flight been delayed?', 'Can I close the gate?'],
        correctIndex: 1,
        explanation: 'The Present Perfect emphasizes the current result: the flight is currently delayed.',
      },
      {
        id: 'baggage',
        prompt: 'What does carry-on luggage mean?',
        options: ['Hand luggage', 'Luggage strap', 'Boarding pass'],
        correctIndex: 0,
        explanation: 'Carry-on luggage is taken with you into the aircraft cabin.',
      },
    ],
    teacherNote: 'Suitable for adult students: After answering, ask them to act out a short dialogue in the same situation.',
  },
  {
    id: 2,
    title: 'Cell and its functions',
    subject: 'Biology',
    grade: 'Grade 6',
    prompt: 'Take a short quiz on cell structure.',
    questions: [
      {
        id: 'nucleus',
        prompt: 'Which structure stores the basic hereditary information of a cell?',
        options: ['Core', 'Vacuole', 'Cell wall'],
        correctIndex: 0,
        explanation: 'The nucleus of a eukaryotic cell contains most of the DNA.',
      },
      {
        id: 'chloroplast',
        prompt: 'Where does photosynthesis occur in plants?',
        options: ['In ribosomes', 'In chloroplasts', 'In the core'],
        correctIndex: 1,
        explanation: 'Chlorophyll and the main reactions of photosynthesis are associated with chloroplasts.',
      },
      {
        id: 'membrane',
        prompt: 'What regulates the metabolism between the cell and the environment?',
        options: ['Cell membrane', 'Chromosome', 'Nucleolus'],
        correctIndex: 0,
        explanation: 'The membrane selectively allows substances to pass in and out of the cell.',
      },
    ],
    teacherNote: 'An explanation after each choice turns the quiz into learning, and not just control.',
  },
]

export function createEmptyQuizAnswers(level: QuizRushLevel) {
  return level.questions.map(() => null as number | null)
}

export function getQuizRushResult(level: QuizRushLevel, answers: Array<number | null>): QuizRushResult {
  const answered = level.questions.filter((_, index) => Number.isInteger(answers[index])).length
  const correct = level.questions.filter((question, index) => answers[index] === question.correctIndex).length
  const total = level.questions.length
  const complete = total > 0 && answered === total
  const accuracy = answered === 0 ? 0 : Math.round((correct / answered) * 100)

  return {
    total,
    answered,
    correct,
    complete,
    accuracy,
    status: complete ? `${accuracy}% total` : `${answered}/${total} answered`,
  }
}
