import type { QuizQuestion } from './quiz-rush'

export type LearningGameLesson = { id: string; title: string; questions: readonly QuizQuestion[] }

// The same lesson starts with a short guided round and continues with practice at home.
export function learningGameQuestions(lesson: LearningGameLesson, homework = false) {
  return homework ? lesson.questions.slice(lesson.questions.length > 3 ? 3 : 0) : lesson.questions.slice(0, 3)
}

export function validateLearningGameQuestions(questions: readonly QuizQuestion[]) {
  if (!questions.length || new Set(questions.map(question => question.id)).size !== questions.length || questions.some(question =>
    !question.id.trim() || !question.prompt.trim() || question.options.length !== 3 || question.options.some(option => !option.trim())
    || !Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 2)) {
    throw new Error('For an educational game, you need a non-empty set of tasks with unique IDs, three options and the correct index from 0 to 2.')
  }
}
