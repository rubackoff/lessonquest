import type { GameId } from './activity-runtime'
import type { EditableLevel, SavedEditorActivity } from './editor-runtime'
import { isGeometryDiagramSpec } from './geometry-diagrams'
import { isLearningImage } from './learning-media'

export type CreateActivityInput = {
  gameId: GameId
  title: string
  level: EditableLevel
}

const gameIds = new Set<GameId>(['force-lab', 'mistake-arena', 'match-pairs', 'group-sort', 'quiz-rush', 'recall-deck'])

export function parseCreateActivityInput(input: unknown): CreateActivityInput | null {
  if (!isRecord(input)) return null
  if (typeof input.gameId !== 'string' || !gameIds.has(input.gameId as GameId)) return null
  if (typeof input.title !== 'string' || input.title.trim().length === 0 || input.title.length > 160) {
    return null
  }
  if (!isLevelForGame(input.gameId as GameId, input.level)) return null

  return {
    gameId: input.gameId as GameId,
    title: input.title.trim(),
    level: input.level,
  }
}

export function isSavedEditorActivity(input: unknown): input is SavedEditorActivity {
  if (!isRecord(input)) return false
  if (typeof input.id !== 'string' || input.id.length === 0) return false
  if (typeof input.savedAt !== 'string' || Number.isNaN(Date.parse(input.savedAt))) return false

  return parseCreateActivityInput(input) !== null
}

function isLevelForGame(gameId: GameId, level: unknown): level is EditableLevel {
  if (!hasCommonLevelFields(level)) return false

  if (gameId === 'force-lab') {
    return (
      hasStrings(level, ['equation', 'unknown', 'answer', 'lesson', 'teacherNote']) &&
      hasFiniteNumbers(level, ['targetForce', 'targetAngle', 'mass', 'friction', 'fieldForce'])
    )
  }

  if (gameId === 'mistake-arena') {
    return (
      hasStrings(level, ['prompt', 'correctToken', 'rule', 'explanation', 'teacherNote']) &&
      typeof level.correctIndex === 'number' &&
      Number.isInteger(level.correctIndex) &&
      Array.isArray(level.tokens) &&
      level.tokens.length >= 3 &&
      level.tokens.every((token) => typeof token === 'string')
    )
  }

  if (gameId === 'match-pairs') {
    if (!hasStrings(level, ['prompt', 'teacherNote']) || !Array.isArray(level.pairs)) return false
    if (level.pairs.length < 2 || level.pairs.length > 8) return false

    const pairIds = new Set<string>()
    return level.pairs.every((pair) => {
      if (
        !isRecord(pair)
        || typeof pair.id !== 'string'
        || typeof pair.left !== 'string'
        || typeof pair.right !== 'string'
      ) return false
      const id = pair.id.trim()
      const left = pair.left.trim()
      const right = pair.right.trim()
      if (!id || id.length > 100 || pairIds.has(id)) return false
      if (pair.left.length > 160 || pair.right.length > 160) return false
      if (pair.visual !== undefined && !isGeometryDiagramSpec(pair.visual)) return false
      if (pair.leftMedia !== undefined && !isLearningImage(pair.leftMedia)) return false
      if (pair.rightMedia !== undefined && !isLearningImage(pair.rightMedia)) return false
      if (!left && !pair.visual && !pair.leftMedia) return false
      if (!right && !pair.rightMedia) return false

      pairIds.add(id)
      return true
    })
  }

  if (gameId === 'group-sort') {
    return (
      hasStrings(level, ['prompt', 'teacherNote']) &&
      Array.isArray(level.groups) &&
      level.groups.length >= 2 &&
      level.groups.every((group) => isRecord(group) && hasStrings(group, ['id', 'title'])) &&
      Array.isArray(level.items) &&
      level.items.length >= 2 &&
      level.items.every((item) => {
        if (!isRecord(item) || !hasStrings(item, ['id', 'label', 'groupId'])) return false
        return item.media === undefined || isLearningImage(item.media)
      })
    )
  }

  if (gameId === 'quiz-rush') {
    return (
    hasStrings(level, ['prompt', 'teacherNote']) &&
    Array.isArray(level.questions) &&
    level.questions.length >= 2 &&
    level.questions.length <= 6 &&
    level.questions.every((question) => {
      if (!isRecord(question) || !hasStrings(question, ['id', 'prompt', 'explanation'])) return false
      if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 4) return false
      if (!question.options.every((option) => typeof option === 'string' && option.trim().length > 0)) return false
      if (question.media !== undefined && !isLearningImage(question.media)) return false
      if (question.optionMedia !== undefined) {
        if (!Array.isArray(question.optionMedia) || question.optionMedia.length > question.options.length) return false
        if (!question.optionMedia.every((media) => media === null || isLearningImage(media))) return false
      }
      return (
        typeof question.correctIndex === 'number' &&
        Number.isInteger(question.correctIndex) &&
        question.correctIndex >= 0 &&
        question.correctIndex < question.options.length
      )
    })
    )
  }

  return (
    hasStrings(level, ['prompt', 'teacherNote']) &&
    Array.isArray(level.cards) &&
    level.cards.length >= 2 &&
    level.cards.length <= 8 &&
    level.cards.every((card) => isRecord(card) && hasStrings(card, ['id', 'front', 'back', 'note']))
  )
}

function hasCommonLevelFields(input: unknown): input is Record<string, unknown> {
  return isRecord(input) && typeof input.id === 'number' && hasStrings(input, ['title', 'subject', 'grade'])
}

function hasStrings(input: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => typeof input[key] === 'string')
}

function hasFiniteNumbers(input: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => typeof input[key] === 'number' && Number.isFinite(input[key]))
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}
