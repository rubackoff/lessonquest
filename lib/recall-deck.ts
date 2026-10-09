import type { LearningImage } from '@/lib/learning-media'

export type RecallRating = 'remembered' | 'review'

export type RecallCard = {
  id: string
  front: string
  back: string
  note: string
  frontMedia?: LearningImage
  backMedia?: LearningImage
}

export type RecallDeckLevel = {
  id: number
  title: string
  subject: string
  grade: string
  prompt: string
  cards: RecallCard[]
  teacherNote: string
}

export type RecallDeckResult = {
  total: number
  rated: number
  remembered: number
  review: number
  complete: boolean
  accuracy: number
  status: string
}

export const recallDeckLevels: RecallDeckLevel[] = [
  {
    id: 1,
    title: 'Phrases after a business meeting',
    subject: 'English',
    grade: 'Adult, B1',
    prompt: 'First, remember the meaning of the phrase, then open the answer and evaluate yourself.',
    cards: [
      {
        id: 'follow-up',
        front: 'to follow up',
        back: 'return to the question or contact after the meeting',
        note: 'I will follow up with the updated figures tomorrow.',
      },
      {
        id: 'go-over',
        front: 'to go over the details',
        back: 'review or discuss the details carefully',
        note: 'Let us go over the details before we sign anything.',
      },
      {
        id: 'on-the-same-page',
        front: 'to be on the same page',
        back: 'share the same understanding of a situation or plan',
        note: 'I want to make sure we are on the same page.',
      },
      {
        id: 'get-back-to',
        front: 'to get back to someone',
        back: 'reply to the person later when the information becomes available',
        note: 'I will get back to you by Friday.',
      },
    ],
    teacherNote: 'Ask the student to give their explanation or example first, and only then reveal the other side.',
  },
  {
    id: 2,
    title: 'Cell division',
    subject: 'Biology',
    grade: 'Grade 9',
    prompt: 'Remember the definition of the term and check yourself on the reverse side.',
    cards: [
      {
        id: 'mitosis',
        front: 'Mitosis',
        back: 'Cell division that produces two genetically similar daughter cells.',
        note: 'Supports body growth and tissue renewal.',
      },
      {
        id: 'meiosis',
        front: 'Meiosis',
        back: 'Division, which reduces the number of chromosomes by half and forms sex cells.',
        note: 'Creates genetic diversity in offspring.',
      },
      {
        id: 'chromosome',
        front: 'Chromosome',
        back: 'A structure made of DNA and proteins containing hereditary information.',
        note: 'Before division, the DNA doubles, so the chromosome consists of two chromatids.',
      },
    ],
    teacherNote: 'After self-assessment, ask to compare mitosis and meiosis based on the number of cells and the number of chromosomes.',
  },
]

export function createEmptyRecallRatings(level: RecallDeckLevel) {
  return level.cards.map(() => null as RecallRating | null)
}

export function getRecallDeckResult(
  level: RecallDeckLevel,
  ratings: Array<RecallRating | null>,
): RecallDeckResult {
  const rated = level.cards.filter((_, index) => ratings[index] === 'remembered' || ratings[index] === 'review').length
  const remembered = level.cards.filter((_, index) => ratings[index] === 'remembered').length
  const review = level.cards.filter((_, index) => ratings[index] === 'review').length
  const total = level.cards.length
  const complete = total > 0 && rated === total
  const accuracy = rated === 0 ? 0 : Math.round((remembered / rated) * 100)

  return {
    total,
    rated,
    remembered,
    review,
    complete,
    accuracy,
    status: complete ? `${remembered}/${total} remembered` : `${rated}/${total} appreciated`,
  }
}
