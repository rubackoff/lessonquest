import { describe, expect, it } from 'vitest'
import { decodeLearningProgress, mergeHomeworkResults, type LearningProgressStore } from './learning-achievements'
import { learningGameQuestions } from './learning-game-content'

const empty: LearningProgressStore = { version: 1, progress: {} }
const ids = ['q4', 'q5', 'q6']
const earnedAt = '2026-10-07T00:00:00.000Z'
const result = (questionId: string, mastered = true) => ({ questionId, mastered, firstTry: mastered })
const merge = (store: LearningProgressStore, results: ReturnType<typeof result>[], expected = ids) => mergeHomeworkResults(store, 'forest-camp', 'math', 'Mathematics', expected, results, earnedAt)

describe('Achievements for training', () => {
  it('requires mastering each question; time in the game and repetitions do not replace knowledge', () => {
    let store = merge(empty, [result('q4'), result('q5', false), result('q6')])
    expect(store.progress['forest-camp:math'].achievement).toBeUndefined()
    store = merge(store, [result('q4'), result('other')]); expect(store.progress['forest-camp:math'].achievement).toBeUndefined()
    store = merge(store, [result('q5')]); expect(store.progress['forest-camp:math'].achievement?.title).toBe('Knowledge in action')
    expect(store.progress['forest-camp:math'].results.find(item => item.questionId === 'q5')?.firstTry).toBe(false)
  })
  it('issues one achievement for the material and template, saves the date and mastery', () => {
    const store = merge(empty, ids.map(id => result(id)))
    const repeated = mergeHomeworkResults(store, 'forest-camp', 'math', 'Mathematics', ids, [result('q4', false)], 'later')
    expect(repeated.progress['forest-camp:math'].achievement).toEqual(store.progress['forest-camp:math'].achievement)
    expect(repeated.progress['forest-camp:math'].results.every(item => item.mastered)).toBe(true)
  })
  it('does not carry over the results of another package or another game', () => {
    let store = merge(empty, ids.map(id => result(id)))
    store = merge(store, [result('q7')], ['q7', 'q8'])
    expect(store.progress['forest-camp:math'].achievement).toBeUndefined()
    const other = mergeHomeworkResults(store, 'space-maze', 'math', 'Mathematics', ids, [result('q4')], earnedAt)
    expect(other.progress['space-maze:math'].achievement).toBeUndefined()
  })
  it('restores correct JSON, resets damaged record', () => {
    const store = merge(empty, ids.map(id => result(id)))
    expect(decodeLearningProgress(JSON.stringify(store))).toEqual(store)
    expect(decodeLearningProgress('{broken')).toEqual(empty)
    expect(decodeLearningProgress('{"version":1,"progress":{"x":null}}')).toEqual(empty)
  })
  it('separates short start and remote work without repeating starting exercises', () => {
    const questions = ids.concat(['q7', 'q8']).map(id => ({ id, prompt: 'Question', options: ['1', '2', '3'], correctIndex: 0, explanation: 'Explanation' }))
    const lesson = { id: 'math', title: 'Mathematics', questions }
    expect(learningGameQuestions(lesson).map(item => item.id)).toEqual(ids)
    expect(learningGameQuestions(lesson, true).map(item => item.id)).toEqual(['q7', 'q8'])
  })
})
