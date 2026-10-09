export type LearningResult = { questionId: string; mastered: boolean; firstTry: boolean }
export type LearningAchievement = { id: string; title: string; lessonTitle: string; templateId: string; earnedAt: string }
export type HomeworkProgress = { expectedIds: string[]; results: LearningResult[]; achievement?: LearningAchievement }
export type LearningProgressStore = { version: 1; progress: Record<string, HomeworkProgress> }
const storageKey = 'corgi-learning-progress-v1'
const changeEvent = 'corgi-learning-progress-change'

export function mergeHomeworkResults(store: LearningProgressStore, templateId: string, lessonId: string,
  lessonTitle: string, expectedIds: string[], results: readonly LearningResult[], earnedAt: string): LearningProgressStore {
  const key = `${templateId}:${lessonId}`, previous = store.progress[key]
  const samePacket = previous && previous.expectedIds.join('\n') === expectedIds.join('\n')
  const merged = new Map((samePacket ? previous.results : []).map(result => [result.questionId, result]))
  for (const result of results) {
    if (!expectedIds.includes(result.questionId)) continue
    const old = merged.get(result.questionId)
    merged.set(result.questionId, { questionId: result.questionId, mastered: Boolean(old?.mastered || result.mastered), firstTry: old?.firstTry ?? result.firstTry })
  }
  const complete = expectedIds.length > 0 && expectedIds.every(id => merged.get(id)?.mastered)
  const achievement = samePacket ? previous.achievement : undefined
  return { version: 1, progress: { ...store.progress, [key]: {
    expectedIds: [...expectedIds], results: [...merged.values()],
    ...(achievement ? { achievement } : complete ? { achievement: { id: key, title: 'Knowledge in action', lessonTitle, templateId, earnedAt } } : {}),
  } } }
}

export function decodeLearningProgress(raw: string): LearningProgressStore {
  try {
    const value = JSON.parse(raw) as LearningProgressStore
    if (value.version === 1 && value.progress && Object.values(value.progress).every(entry =>
      Array.isArray(entry.expectedIds) && entry.expectedIds.every(id => typeof id === 'string') && Array.isArray(entry.results)
      && entry.results.every(result => typeof result.questionId === 'string' && typeof result.mastered === 'boolean' && typeof result.firstTry === 'boolean')
      && (!entry.achievement || typeof entry.achievement.id === 'string' && typeof entry.achievement.title === 'string' && typeof entry.achievement.lessonTitle === 'string'))) return value
  } catch { /* Missing or damaged local progress starts a new record. */ }
  return { version: 1, progress: {} }
}

export function learningProgressSnapshot() {
  try { return window.localStorage.getItem(storageKey) ?? '' } catch { return '' }
}
export function subscribeLearningProgress(onChange: () => void) {
  window.addEventListener('storage', onChange); window.addEventListener(changeEvent, onChange)
  return () => { window.removeEventListener('storage', onChange); window.removeEventListener(changeEvent, onChange) }
}
export function saveHomeworkResults(templateId: string, lessonId: string, lessonTitle: string, expectedIds: string[], results: readonly LearningResult[]) {
  const next = mergeHomeworkResults(decodeLearningProgress(learningProgressSnapshot()), templateId, lessonId, lessonTitle, expectedIds, results, new Date().toISOString())
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(next)); window.dispatchEvent(new Event(changeEvent))
    return true
  } catch { return false }
}
