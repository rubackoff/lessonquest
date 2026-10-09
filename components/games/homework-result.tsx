'use client'

import Link from 'next/link'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { Award } from 'lucide-react'
import { learningGameQuestions, type LearningGameLesson } from '@/lib/learning-game-content'
import { decodeLearningProgress, learningProgressSnapshot, saveHomeworkResults, subscribeLearningProgress, type LearningResult } from '@/lib/learning-achievements'

const serverSnapshot = () => ''

export function HomeworkResult({ templateId, lesson, homework, results }: {
  templateId: 'space-maze' | 'orbital-runner' | 'character-heist'; lesson: LearningGameLesson; homework: boolean; results: readonly LearningResult[]
}) {
  const raw = useSyncExternalStore(subscribeLearningProgress, learningProgressSnapshot, serverSnapshot)
  const progress = useMemo(() => decodeLearningProgress(raw), [raw]).progress[`${templateId}:${lesson.id}`]
  const resultsJson = JSON.stringify(results), expectedJson = JSON.stringify(learningGameQuestions(lesson, true).map(question => question.id))
  useEffect(() => {
    if (homework && JSON.parse(resultsJson).length) saveHomeworkResults(templateId, lesson.id, lesson.title, JSON.parse(expectedJson), JSON.parse(resultsJson))
  }, [homework, templateId, lesson.id, lesson.title, expectedJson, resultsJson])
  if (!homework) return lesson.questions.length > 3 ? <Link href={`/lab/${templateId}?mode=homework&lesson=${encodeURIComponent(lesson.id)}`} style={{ color: '#288264', display: 'inline-flex', alignItems: 'center', minHeight: 44, gap: 7, fontWeight: 650 }}><Award size={21} />Continue at home · {lesson.questions.length - 3} tasks</Link> : null
  if (progress?.achievement) return <p role="status" style={{ color: '#288264', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Award size={24} />Achievement “Knowledge in action” received!</p>
  const remaining = learningGameQuestions(lesson, true).filter(question => !progress?.results.some(result => result.questionId === question.id && result.mastered)).length
  return <p role="status">Before achievement: work some more {remaining} tasks. Repeat the mistakes.</p>
}
