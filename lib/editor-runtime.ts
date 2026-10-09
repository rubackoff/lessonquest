import type { GameId } from '@/lib/activity-runtime'
import { isGeometryDiagramSpec, type GeometryDiagramSpec } from '@/lib/geometry-diagrams'
import { isLearningImage, type LearningImage } from '@/lib/learning-media'
import { forceLabLevels, type ForceLabLevel } from '@/lib/force-lab'
import { groupSortLevels, type GroupSortLevel } from '@/lib/group-sort'
import { matchPairsLevels, type MatchPairsLevel } from '@/lib/match-pairs'
import { mistakeArenaLevels, type MistakeArenaLevel } from '@/lib/mistake-arena'
import { quizRushLevels, type QuizQuestion, type QuizRushLevel } from '@/lib/quiz-rush'
import { recallDeckLevels, type RecallCard, type RecallDeckLevel } from '@/lib/recall-deck'

export type CommonEditorDraft = {
  title: string
  subject: string
  grade: string
  teacherNote: string
}

export type ForceEditorDraft = CommonEditorDraft & {
  equation: string
  unknown: string
  answer: string
  lesson: string
  targetForce: string
  targetAngle: string
  mass: string
  friction: string
  fieldForce: string
}

export type MistakeEditorDraft = CommonEditorDraft & {
  prompt: string
  tokensText: string
  correctIndex: string
  correctToken: string
  rule: string
  explanation: string
}

export type MatchEditorDraft = CommonEditorDraft & {
  prompt: string
  pairsText: string
  pairVisuals?: Array<GeometryDiagramSpec | null>
  pairMedia?: Array<{ left?: LearningImage; right?: LearningImage }>
}

export type GroupEditorDraft = CommonEditorDraft & {
  prompt: string
  groupsText: string
  itemsText: string
  itemMedia?: Array<LearningImage | null>
}

export type QuizEditorDraft = CommonEditorDraft & {
  prompt: string
  questionsText: string
  questionMedia?: Array<LearningImage | null>
  optionMedia?: Array<Array<LearningImage | null>>
}

export type RecallEditorDraft = CommonEditorDraft & {
  prompt: string
  cardsText: string
  frontMedia?: Array<LearningImage | null>
  backMedia?: Array<LearningImage | null>
}

export type EditorDraft = ForceEditorDraft | MistakeEditorDraft | MatchEditorDraft | GroupEditorDraft | QuizEditorDraft | RecallEditorDraft

export type EditorDrafts = {
  'force-lab': ForceEditorDraft
  'mistake-arena': MistakeEditorDraft
  'match-pairs': MatchEditorDraft
  'group-sort': GroupEditorDraft
  'quiz-rush': QuizEditorDraft
  'recall-deck': RecallEditorDraft
}

export type EditableLevel = ForceLabLevel | MistakeArenaLevel | MatchPairsLevel | GroupSortLevel | QuizRushLevel | RecallDeckLevel

export type SavedEditorActivity = {
  id: string
  gameId: GameId
  title: string
  savedAt: string
  level: EditableLevel
}

export function createEditorDrafts(): EditorDrafts {
  const force = forceLabLevels[0]
  const mistake = mistakeArenaLevels[0]
  const match = matchPairsLevels[0]
  const group = groupSortLevels[0]
  const quiz = quizRushLevels[0]
  const recall = recallDeckLevels[0]

  return {
    'force-lab': {
      title: force.title,
      subject: force.subject,
      grade: force.grade,
      teacherNote: force.teacherNote,
      equation: force.equation,
      unknown: force.unknown,
      answer: force.answer,
      lesson: force.lesson,
      targetForce: String(force.targetForce),
      targetAngle: String(force.targetAngle),
      mass: String(force.mass),
      friction: String(force.friction),
      fieldForce: String(force.fieldForce),
    },
    'mistake-arena': {
      title: mistake.title,
      subject: mistake.subject,
      grade: mistake.grade,
      teacherNote: mistake.teacherNote,
      prompt: mistake.prompt,
      tokensText: mistake.tokens.join(' '),
      correctIndex: String(mistake.correctIndex + 1),
      correctToken: mistake.correctToken,
      rule: mistake.rule,
      explanation: mistake.explanation,
    },
    'match-pairs': {
      title: match.title,
      subject: match.subject,
      grade: match.grade,
      teacherNote: match.teacherNote,
      prompt: match.prompt,
      pairsText: match.pairs.map((pair) => `${pair.left} | ${pair.right}`).join('\n'),
      pairVisuals: match.pairs.map((pair) => pair.visual ?? null),
      pairMedia: match.pairs.map((pair) => ({ left: pair.leftMedia, right: pair.rightMedia })),
    },
    'group-sort': {
      title: group.title,
      subject: group.subject,
      grade: group.grade,
      teacherNote: group.teacherNote,
      prompt: group.prompt,
      groupsText: group.groups.map((item) => item.title).join('\n'),
      itemsText: group.items
        .map((item) => {
          const target = group.groups.find((candidate) => candidate.id === item.groupId)
          return `${item.label} | ${target?.title ?? group.groups[0].title}`
        })
        .join('\n'),
      itemMedia: group.items.map((item) => item.media ?? null),
    },
    'quiz-rush': {
      title: quiz.title,
      subject: quiz.subject,
      grade: quiz.grade,
      teacherNote: quiz.teacherNote,
      prompt: quiz.prompt,
      questionsText: quiz.questions
        .map((question) => {
          return `${question.prompt} | ${question.options.join(' ; ')} | ${question.correctIndex + 1} | ${question.explanation}`
        })
        .join('\n'),
      questionMedia: quiz.questions.map((question) => question.media ?? null),
      optionMedia: quiz.questions.map((question) => question.optionMedia ?? []),
    },
    'recall-deck': {
      title: recall.title,
      subject: recall.subject,
      grade: recall.grade,
      teacherNote: recall.teacherNote,
      prompt: recall.prompt,
      cardsText: recall.cards.map((card) => `${card.front} | ${card.back} | ${card.note}`).join('\n'),
      frontMedia: recall.cards.map((card) => card.frontMedia ?? null),
      backMedia: recall.cards.map((card) => card.backMedia ?? null),
    },
  }
}

export function mergeEditorDrafts(input: unknown): EditorDrafts {
  const defaults = createEditorDrafts()
  if (!input || typeof input !== 'object') return defaults

  const record = input as Partial<Record<GameId, Partial<EditorDraft>>>

  return {
    'force-lab': { ...defaults['force-lab'], ...record['force-lab'] },
    'mistake-arena': { ...defaults['mistake-arena'], ...record['mistake-arena'] },
    'match-pairs': { ...defaults['match-pairs'], ...record['match-pairs'] },
    'group-sort': { ...defaults['group-sort'], ...record['group-sort'] },
    'quiz-rush': { ...defaults['quiz-rush'], ...record['quiz-rush'] },
    'recall-deck': { ...defaults['recall-deck'], ...record['recall-deck'] },
  }
}

export function buildEditableLevel(gameId: 'force-lab', draft: ForceEditorDraft): ForceLabLevel
export function buildEditableLevel(gameId: 'mistake-arena', draft: MistakeEditorDraft): MistakeArenaLevel
export function buildEditableLevel(gameId: 'match-pairs', draft: MatchEditorDraft): MatchPairsLevel
export function buildEditableLevel(gameId: 'group-sort', draft: GroupEditorDraft): GroupSortLevel
export function buildEditableLevel(gameId: 'quiz-rush', draft: QuizEditorDraft): QuizRushLevel
export function buildEditableLevel(gameId: 'recall-deck', draft: RecallEditorDraft): RecallDeckLevel
export function buildEditableLevel(gameId: GameId, draft: EditorDraft): EditableLevel
export function buildEditableLevel(gameId: GameId, draft: EditorDraft): EditableLevel {
  if (gameId === 'force-lab') return buildForceLevel(draft as ForceEditorDraft)
  if (gameId === 'mistake-arena') return buildMistakeLevel(draft as MistakeEditorDraft)
  if (gameId === 'match-pairs') return buildMatchLevel(draft as MatchEditorDraft)
  if (gameId === 'group-sort') return buildGroupLevel(draft as GroupEditorDraft)
  if (gameId === 'quiz-rush') return buildQuizLevel(draft as QuizEditorDraft)
  return buildRecallLevel(draft as RecallEditorDraft)
}

export function validateEditorDraft(gameId: GameId, draft: EditorDraft) {
  const errors = validateCommonDraft(draft)

  if (gameId === 'force-lab') {
    const forceDraft = draft as ForceEditorDraft
    errors.push(...validateNumberRange('Power of purpose', forceDraft.targetForce, 1, 18))
    errors.push(...validateNumberRange('Target angle', forceDraft.targetAngle, 0, 55))
    errors.push(...validateNumberRange('Weight', forceDraft.mass, 1, 30))
    errors.push(...validateNumberRange('Friction', forceDraft.friction, 0, 20))
    errors.push(...validateNumberRange('Field F1', forceDraft.fieldForce, 1, 30))
    if (!forceDraft.equation.trim()) errors.push('Add an equation.')
    if (!forceDraft.answer.trim()) errors.push('Add the correct answer.')
  }

  if (gameId === 'mistake-arena') {
    const mistakeDraft = draft as MistakeEditorDraft
    const tokens = parseTokens(mistakeDraft.tokensText)
    const correctIndex = Number(mistakeDraft.correctIndex)
    if (tokens.length < 3) errors.push('To find an error you need at least 3 tokens.')
    if (!Number.isInteger(correctIndex) || correctIndex < 1 || correctIndex > tokens.length) {
      errors.push('The erroneous token number must be included in the record.')
    }
    if (!mistakeDraft.rule.trim()) errors.push('Add a validation rule.')
    if (!mistakeDraft.explanation.trim()) errors.push('Add an explanation for the error.')
  }

  if (gameId === 'match-pairs') {
    const matchDraft = draft as MatchEditorDraft
    const pairs = parsePairs(matchDraft.pairsText)
    if (pairs.length < 2) errors.push('For pairs, you need a minimum of 2 lines in the "left | right" format.')
    if (pairs.length > 8) errors.push('One set can contain a maximum of 8 pairs.')
    if (matchDraft.pairVisuals?.some((visual) => visual !== null && !isGeometryDiagramSpec(visual))) {
      errors.push('One of the geometric diagrams is not in the correct format.')
    }
    pairs.forEach((pair, index) => {
      const media = matchDraft.pairMedia?.[index]
      const visual = matchDraft.pairVisuals?.[index]
      if (!pair.left && !media?.left && !visual) errors.push(`Couple ${index + 1}: Fill the left side with text or an image.`)
      if (!pair.right && !media?.right) errors.push(`Couple ${index + 1}: Fill the right side with text or an image.`)
      if (media?.left && !isLearningImage(media.left)) errors.push(`Couple ${index + 1}: Incorrect image on the left.`)
      if (media?.right && !isLearningImage(media.right)) errors.push(`Couple ${index + 1}: Incorrect image on the right.`)
      if (pair.left.length > 160) errors.push(`Couple ${index + 1}: Reduce the text on the left to 160 characters.`)
      if (pair.right.length > 160) errors.push(`Couple ${index + 1}: Reduce the text on the right to 160 characters.`)
    })
    if (hasDuplicatePairs(pairs)) errors.push('Identical pairs should not be repeated.')
  }

  if (gameId === 'group-sort') {
    const groupDraft = draft as GroupEditorDraft
    const groups = parseLines(groupDraft.groupsText)
    const items = parseGroupItems(groupDraft.itemsText, groups)
    if (groups.length < 2) errors.push('Add at least 2 groups.')
    if (groups.length > 3) errors.push('In this template, you can currently create a maximum of 3 groups.')
    if (items.length < groups.length) errors.push('Add at least one card per set of groups.')
    if (items.length > 6) errors.push('You can currently create a maximum of 6 cards in this template.')
    groupDraft.itemMedia?.forEach((media, index) => {
      if (media !== null && !isLearningImage(media)) errors.push(`Card ${index + 1}: Invalid image.`)
    })
  }

  if (gameId === 'quiz-rush') {
    const quizDraft = draft as QuizEditorDraft
    const questions = parseQuizQuestions(quizDraft.questionsText)
    if (questions.length < 2) errors.push('For the Blitz Quiz you need at least 2 questions in the specified format.')
    if (questions.length > 6) errors.push('You can create a maximum of 6 questions in one level.')
    quizDraft.questionMedia?.forEach((media, index) => {
      if (media !== null && !isLearningImage(media)) errors.push(`Question ${index + 1}: Invalid image.`)
    })
    quizDraft.optionMedia?.forEach((mediaRow, questionIndex) => {
      if (!Array.isArray(mediaRow)) {
        errors.push(`Question ${questionIndex + 1}: Invalid set of response images.`)
        return
      }
      mediaRow.forEach((media, optionIndex) => {
        if (media !== null && !isLearningImage(media)) {
          errors.push(`Question ${questionIndex + 1}, answer ${optionIndex + 1}: Invalid image.`)
        }
      })
    })
  }

  if (gameId === 'recall-deck') {
    const recallDraft = draft as RecallEditorDraft
    const cards = parseRecallCards(recallDraft.cardsText)
    if (cards.length < 2) errors.push('The Memory Deck requires a minimum of 2 cards in the specified format.')
    if (cards.length > 8) errors.push('You can create a maximum of 8 cards in one level.')
    recallDraft.frontMedia?.forEach((media, index) => {
      if (media !== null && !isLearningImage(media)) errors.push(`Card ${index + 1}: Front side image is incorrect.`)
    })
    recallDraft.backMedia?.forEach((media, index) => {
      if (media !== null && !isLearningImage(media)) errors.push(`Card ${index + 1}: Back side image is incorrect.`)
    })
  }

  return errors
}

function buildForceLevel(draft: ForceEditorDraft): ForceLabLevel {
  return {
    id: 9001,
    title: clean(draft.title, 'New level of power'),
    subject: clean(draft.subject, 'Item'),
    grade: clean(draft.grade, 'class'),
    equation: clean(draft.equation, '2x + 4 = 16'),
    unknown: clean(draft.unknown, 'x'),
    answer: clean(draft.answer, '6'),
    targetForce: parseNumber(draft.targetForce, 8, 1, 18),
    targetAngle: parseNumber(draft.targetAngle, 24, 0, 55),
    mass: parseNumber(draft.mass, 6, 1, 30),
    friction: parseNumber(draft.friction, 2, 0, 20),
    fieldForce: parseNumber(draft.fieldForce, 10, 1, 30),
    lesson: clean(draft.lesson, 'Solve the problem and set up the physical scene.'),
    teacherNote: clean(draft.teacherNote, 'The methodological note has not yet been completed.'),
    mistake: forceLabLevels[0].mistake,
  }
}

function buildMistakeLevel(draft: MistakeEditorDraft): MistakeArenaLevel {
  const tokens = parseTokens(draft.tokensText)
  const safeTokens = tokens.length > 0 ? tokens : ['2', '(', 'x', '+', '5', ')', '=', '2x', '+', '5']
  const correctIndex = parseNumber(draft.correctIndex, 1, 1, safeTokens.length) - 1

  return {
    id: 9002,
    title: clean(draft.title, 'New error'),
    subject: clean(draft.subject, 'Item'),
    grade: clean(draft.grade, 'class'),
    prompt: clean(draft.prompt, 'Find the erroneous fragment.'),
    tokens: safeTokens,
    correctIndex,
    correctToken: clean(draft.correctToken, safeTokens[correctIndex]),
    rule: clean(draft.rule, 'The rule has not yet been completed.'),
    explanation: clean(draft.explanation, 'The explanation has not yet been completed.'),
    teacherNote: clean(draft.teacherNote, 'The methodological note has not yet been completed.'),
  }
}

function buildMatchLevel(draft: MatchEditorDraft): MatchPairsLevel {
  const pairs = parsePairs(draft.pairsText)
    .slice(0, 8)
    .map((pair, index) => {
      const visual = draft.pairVisuals?.[index]
      const media = draft.pairMedia?.[index]
      return {
        ...pair,
        ...(visual && isGeometryDiagramSpec(visual) ? { visual } : {}),
        ...(media?.left && isLearningImage(media.left) ? { leftMedia: media.left } : {}),
        ...(media?.right && isLearningImage(media.right) ? { rightMedia: media.right } : {}),
      }
    })
  const safePairs =
    pairs.length >= 2
      ? pairs
      : [
          { id: 'pair-1', left: 'Speed', right: 'v = S / t' },
          { id: 'pair-2', left: 'Strength', right: 'F = m · a' },
        ]

  return {
    id: 9003,
    title: clean(draft.title, 'New couples'),
    subject: clean(draft.subject, 'Item'),
    grade: clean(draft.grade, 'class'),
    prompt: clean(draft.prompt, 'Connect the elements.'),
    pairs: safePairs,
    teacherNote: clean(draft.teacherNote, 'The methodological note has not yet been completed.'),
  }
}

function buildGroupLevel(draft: GroupEditorDraft): GroupSortLevel {
  const groupNames = parseLines(draft.groupsText).slice(0, 3)
  const safeNames = groupNames.length >= 2 ? groupNames : ['Algebra', 'Physics']
  const groups = safeNames.map((title, index) => ({ id: `group-${index + 1}`, title }))
  const items = parseGroupItems(
    draft.itemsText,
    groups.map((group) => group.title),
  ).slice(0, 6)
  const safeItems =
    items.length > 0
      ? items.map((item, index) => {
          const media = draft.itemMedia?.[index]
          return {
            id: `item-${index + 1}`,
            label: item.label,
            groupId: groups[item.groupIndex]?.id ?? groups[0].id,
            ...(media && isLearningImage(media) ? { media } : {}),
          }
        })
      : [
          { id: 'item-1', label: '2x + 4 = 16', groupId: groups[0].id },
          { id: 'item-2', label: 'F = m · a', groupId: groups[1].id },
        ]

  return {
    id: 9004,
    title: clean(draft.title, 'New sorting'),
    subject: clean(draft.subject, 'Item'),
    grade: clean(draft.grade, 'class'),
    prompt: clean(draft.prompt, 'Arrange the cards into groups.'),
    groups,
    items: safeItems,
    teacherNote: clean(draft.teacherNote, 'The methodological note has not yet been completed.'),
  }
}

function buildQuizLevel(draft: QuizEditorDraft): QuizRushLevel {
  const questions = parseQuizQuestions(draft.questionsText).slice(0, 6).map((question, questionIndex) => {
    const media = draft.questionMedia?.[questionIndex]
    const optionMedia = draft.optionMedia?.[questionIndex]?.slice(0, question.options.length).map((option) => {
      return option && isLearningImage(option) ? option : null
    })
    return {
      ...question,
      ...(media && isLearningImage(media) ? { media } : {}),
      ...(optionMedia?.some(Boolean) ? { optionMedia } : {}),
    }
  })

  return {
    id: 9005,
    title: clean(draft.title, 'New quiz'),
    subject: clean(draft.subject, 'Item'),
    grade: clean(draft.grade, 'level'),
    prompt: clean(draft.prompt, 'Choose the correct answer.'),
    questions: questions.length >= 2 ? questions : quizRushLevels[0].questions,
    teacherNote: clean(draft.teacherNote, 'The methodological note has not yet been completed.'),
  }
}

function buildRecallLevel(draft: RecallEditorDraft): RecallDeckLevel {
  const cards = parseRecallCards(draft.cardsText).slice(0, 8).map((card, index) => ({
    ...card,
    ...(draft.frontMedia?.[index] ? { frontMedia: draft.frontMedia[index] ?? undefined } : {}),
    ...(draft.backMedia?.[index] ? { backMedia: draft.backMedia[index] ?? undefined } : {}),
  }))

  return {
    id: 9006,
    title: clean(draft.title, 'New deck'),
    subject: clean(draft.subject, 'Item'),
    grade: clean(draft.grade, 'level'),
    prompt: clean(draft.prompt, 'Remember the answer and check yourself.'),
    cards: cards.length >= 2 ? cards : recallDeckLevels[0].cards,
    teacherNote: clean(draft.teacherNote, 'The methodological note has not yet been completed.'),
  }
}

function validateCommonDraft(draft: CommonEditorDraft) {
  const errors: string[] = []
  if (!draft.title.trim()) errors.push('Add a name for the level.')
  if (!draft.subject.trim()) errors.push('Add an item.')
  if (!draft.grade.trim()) errors.push('Add a class or level.')
  return errors
}

function validateNumberRange(label: string, value: string, min: number, max: number) {
  const parsed = Number(value.replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return [`${label}: number from ${min} up to ${max}.`]
  }
  return []
}

function parseNumber(value: string, fallback: number, min: number, max: number) {
  const parsed = Number(value.replace(',', '.'))
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function parsePairs(value: string) {
  return parseLines(value)
    .map((line, index) => {
      const separatorIndex = line.indexOf('|')
      if (separatorIndex === -1) return null
      const left = line.slice(0, separatorIndex).trim()
      const right = line.slice(separatorIndex + 1).trim()
      return { id: `pair-${index + 1}`, left, right }
    })
    .filter((pair): pair is { id: string; left: string; right: string } => Boolean(pair))
}

function hasDuplicatePairs(pairs: Array<{ left: string; right: string }>) {
  const normalized = pairs.map((pair) => `${normalizePairValue(pair.left)}\u0000${normalizePairValue(pair.right)}`)
  return new Set(normalized).size !== normalized.length
}

function normalizePairValue(value: string) {
  return value.trim().toLocaleLowerCase('ru').replace(/\s+/g, ' ')
}

function parseGroupItems(value: string, groups: string[]) {
  const normalizedGroups = groups.map((group) => group.trim().toLowerCase())

  return parseLines(value)
    .map((line) => {
      const separatorIndex = line.indexOf('|')
      if (separatorIndex === -1) return null
      const label = line.slice(0, separatorIndex).trim()
      const groupName = line.slice(separatorIndex + 1).trim().toLowerCase()
      const groupIndex = normalizedGroups.indexOf(groupName)
      if (!label || groupIndex === -1) return null
      return { label, groupIndex }
    })
    .filter((item): item is { label: string; groupIndex: number } => Boolean(item))
}

function parseQuizQuestions(value: string): QuizQuestion[] {
  return parseLines(value)
    .map((line, index) => {
      const parts = line.split('|').map((part) => part.trim())
      if (parts.length !== 4) return null

      const [prompt, optionsText, correctIndexText, explanation] = parts
      const options = optionsText.split(';').map((option) => option.trim()).filter(Boolean)
      const correctIndex = Number(correctIndexText) - 1
      if (!prompt || !explanation || options.length < 2 || options.length > 4) return null
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) return null

      return { id: `question-${index + 1}`, prompt, options, correctIndex, explanation }
    })
    .filter((question): question is QuizQuestion => Boolean(question))
}

function parseRecallCards(value: string): RecallCard[] {
  return parseLines(value)
    .map((line, index) => {
      const parts = line.split('|').map((part) => part.trim())
      if (parts.length !== 3) return null

      const [front, back, note] = parts
      if (!front || !back || !note) return null

      return { id: `card-${index + 1}`, front, back, note }
    })
    .filter((card): card is RecallCard => Boolean(card))
}

function parseTokens(value: string) {
  return value.trim().split(/\s+/).filter(Boolean)
}

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function clean(value: string, fallback: string) {
  return value.trim() || fallback
}
