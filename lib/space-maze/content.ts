import type { QuizQuestion } from '../quiz-rush'
import type { LearningGameLesson } from '../learning-game-content'
import { subjectLessons } from './subject-content'

export type MazeLesson = LearningGameLesson

const mathematics: QuizQuestion[] = [
  { id: 'multiply-7-8', prompt: 'How much is 7 × 8?', options: ['54', '56', '64'], correctIndex: 1, explanation: '7 × 8 = 56. You can calculate it like this: 7 × (10 − 2) = 70 − 14.' },
  { id: 'square', prompt: 'A square has a side of 6 cm. What is the perimeter?', options: ['24 cm', '12 cm', '36 cm'], correctIndex: 0, explanation: 'A square has four equal sides: 6 × 4 = 24 cm.' },
  { id: 'division', prompt: 'What is 72 ÷ 9?', options: ['7', '9', '8'], correctIndex: 2, explanation: '9 × 8 = 72, so 72 ÷ 9 = 8.' },
  { id: 'fraction', prompt: 'What fraction is equal to one half?', options: ['2/3', '3/6', '1/4'], correctIndex: 1, explanation: 'If the numerator and denominator of the fraction 3/6 are divided by 3, the result is 1/2.' },
  { id: 'angle', prompt: 'How many degrees are in a right angle?', options: ['90°', '45°', '180°'], correctIndex: 0, explanation: 'A right angle is 90°. The rotated angle is 180°.' },
  { id: 'area', prompt: 'The length of the rectangle is 5 cm, width is 3 cm. Find the area.', options: ['16 cm²', '8 cm²', '15 cm²'], correctIndex: 2, explanation: 'Area of a rectangle: length × width. 5 × 3 = 15 cm².' },
  { id: 'equation', prompt: 'Find x: x + 17 = 42.', options: ['25', '59', '35'], correctIndex: 0, explanation: 'Subtract 17 from both sides: x = 42 − 17 = 25.' },
  { id: 'percent', prompt: 'What is 25% of 80 equal to?', options: ['40', '20', '25'], correctIndex: 1, explanation: '25% is a quarter of the number. 80 ÷ 4 = 20.' },
  { id: 'order', prompt: 'What is 6 + 4 × 3?', options: ['30', '24', '18'], correctIndex: 2, explanation: 'First multiplication: 4 × 3 = 12. Then addition: 6 + 12 = 18.' },
  { id: 'triangle', prompt: 'Two angles of a triangle are 50° and 60°. Find the third one.', options: ['70°', '80°', '90°'], correctIndex: 0, explanation: 'The sum of the angles of a triangle is 180°. 180° − 50° − 60° = 70°.' },
]

export const mazeLessons: MazeLesson[] = [
  { id: 'math', title: 'Mathematics', questions: mathematics },
  ...subjectLessons,
]

export function mazeQuestion(lesson: MazeLesson, level: number) {
  const question = lesson.questions[level - 1]
  if (!question) throw new Error('There is no task with this number in the set')
  return question
}
