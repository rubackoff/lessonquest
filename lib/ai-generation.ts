import type { GameId } from '@/lib/activity-runtime'
import type {
  EditorDraft,
  ForceEditorDraft,
  GroupEditorDraft,
  MatchEditorDraft,
  MistakeEditorDraft,
  QuizEditorDraft,
} from '@/lib/editor-runtime'

export type GenerateDraftInput = {
  gameId: GameId
  prompt: string
}

const gameIds = new Set<GameId>(['force-lab', 'mistake-arena', 'match-pairs', 'group-sort', 'quiz-rush', 'recall-deck'])
const commonDraftFields = ['title', 'subject', 'grade', 'teacherNote']
const rendererDraftFields: Record<GameId, string[]> = {
  'force-lab': [
    'equation',
    'unknown',
    'answer',
    'lesson',
    'targetForce',
    'targetAngle',
    'mass',
    'friction',
    'fieldForce',
  ],
  'mistake-arena': [
    'prompt',
    'tokensText',
    'correctIndex',
    'correctToken',
    'rule',
    'explanation',
  ],
  'match-pairs': ['prompt', 'pairsText'],
  'group-sort': ['prompt', 'groupsText', 'itemsText'],
  'quiz-rush': ['prompt', 'questionsText'],
  'recall-deck': ['prompt', 'cardsText'],
}

export function parseGenerateDraftInput(input: unknown): GenerateDraftInput | null {
  if (!isRecord(input)) return null
  if (typeof input.gameId !== 'string' || !gameIds.has(input.gameId as GameId)) return null
  if (typeof input.prompt !== 'string') return null

  const prompt = input.prompt.trim()
  if (prompt.length < 10 || prompt.length > 2_000) return null

  return { gameId: input.gameId as GameId, prompt }
}

export function getDraftJsonSchema(gameId: GameId): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    title: textSchema(1, 100),
    subject: textSchema(1, 80),
    grade: textSchema(1, 40),
    teacherNote: textSchema(1, 500),
  }

  if (gameId === 'force-lab') {
    Object.assign(properties, {
      equation: textSchema(1, 80),
      unknown: textSchema(1, 12),
      answer: textSchema(1, 30),
      lesson: textSchema(1, 500),
      targetForce: textSchema(1, 10),
      targetAngle: textSchema(1, 10),
      mass: textSchema(1, 10),
      friction: textSchema(1, 10),
      fieldForce: textSchema(1, 10),
    })
  } else if (gameId === 'mistake-arena') {
    Object.assign(properties, {
      prompt: textSchema(1, 500),
      tokensText: textSchema(3, 500),
      correctIndex: textSchema(1, 4),
      correctToken: textSchema(1, 80),
      rule: textSchema(1, 500),
      explanation: textSchema(1, 700),
    })
  } else if (gameId === 'match-pairs') {
    Object.assign(properties, {
      prompt: textSchema(1, 500),
      pairsText: textSchema(5, 1_000),
    })
  } else if (gameId === 'group-sort') {
    Object.assign(properties, {
      prompt: textSchema(1, 500),
      groupsText: textSchema(3, 300),
      itemsText: textSchema(5, 1_000),
    })
  } else if (gameId === 'quiz-rush') {
    Object.assign(properties, {
      prompt: textSchema(1, 500),
      questionsText: textSchema(10, 2_500),
    })
  } else {
    Object.assign(properties, {
      prompt: textSchema(1, 500),
      cardsText: textSchema(10, 3_000),
    })
  }

  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  }
}

export function parseGeneratedDraft(gameId: GameId, input: unknown): EditorDraft | null {
  if (!isRecord(input)) return null
  const common = readStrings(input, commonDraftFields)
  if (!common) return null

  if (gameId === 'force-lab') {
    const fields = readStrings(input, [
      'equation',
      'unknown',
      'answer',
      'lesson',
      'targetForce',
      'targetAngle',
      'mass',
      'friction',
      'fieldForce',
    ])
    if (!fields) return null

    return { ...common, ...fields } as ForceEditorDraft
  }

  if (gameId === 'mistake-arena') {
    const fields = readStrings(input, [
      'prompt',
      'tokensText',
      'correctIndex',
      'correctToken',
      'rule',
      'explanation',
    ])
    if (!fields) return null

    return { ...common, ...fields } as MistakeEditorDraft
  }

  if (gameId === 'match-pairs') {
    const fields = readStrings(input, ['prompt', 'pairsText'])
    if (!fields) return null

    return {
      title: common.title,
      subject: common.subject,
      grade: common.grade,
      teacherNote: common.teacherNote,
      prompt: fields.prompt,
      pairsText: fields.pairsText,
    }
  }

  if (gameId === 'group-sort') {
    const fields = readStrings(input, ['prompt', 'groupsText', 'itemsText'])
    if (!fields) return null

    return {
      title: common.title,
      subject: common.subject,
      grade: common.grade,
      teacherNote: common.teacherNote,
      prompt: fields.prompt,
      groupsText: fields.groupsText,
      itemsText: fields.itemsText,
    }
  }

  if (gameId === 'quiz-rush') {
    const fields = readStrings(input, ['prompt', 'questionsText'])
    if (!fields) return null

    return {
      title: common.title,
      subject: common.subject,
      grade: common.grade,
      teacherNote: common.teacherNote,
      prompt: fields.prompt,
      questionsText: fields.questionsText,
    }
  }

  const fields = readStrings(input, ['prompt', 'cardsText'])
  if (!fields) return null

  return {
    title: common.title,
    subject: common.subject,
    grade: common.grade,
    teacherNote: common.teacherNote,
    prompt: fields.prompt,
    cardsText: fields.cardsText,
  }
}

export function getGeneratedDraftShapeIssues(gameId: GameId, input: unknown) {
  if (!isRecord(input)) return ['The response root must be a JSON object.']

  const invalidFields = [...commonDraftFields, ...rendererDraftFields[gameId]].filter((key) => {
    return typeof input[key] !== 'string' || input[key].trim().length === 0
  })

  if (invalidFields.length === 0) return []
  return [`Required non-empty string fields: ${invalidFields.join(', ')}.`]
}

export function buildGenerationMessages(input: GenerateDraftInput, repairIssues: string[] = []) {
  const repairNote =
    repairIssues.length > 0
      ? `\nThe previous attempt failed verification. Correct: ${repairIssues.join(' ')}`
      : ''

  return [
    {
      role: 'system' as const,
      content: [
        'You create one educational game draft for a tutor.',
        'Follow the subject, age and language from the user\'s request.',
        'Write title, subject, grade, prompt and teacherNote in English. Keep target-language examples in the language being studied.',
        'Factual and substantive correctness is more important than effectiveness.',
        'The wording should be clear to the student, and teacherNote should be useful to the tutor.',
        'Do not publish material or add fields outside the specified JSON schema.',
        getRendererGuide(input.gameId),
        repairNote,
      ]
        .filter(Boolean)
        .join('\n'),
    },
    {
      role: 'user' as const,
      content: input.prompt,
    },
  ]
}

function getRendererGuide(gameId: GameId) {
  if (gameId === 'force-lab') {
    return [
      'Renderer: Force lab for linear equation and vector tuning.',
      'answer contains the exact answer of the equation.',
      'Return the numeric parameters in the following lines: targetForce 1-18, targetAngle 0-55, mass 1-30, friction 0-20, fieldForce 1-30.',
    ].join(' ')
  }

  if (gameId === 'mistake-arena') {
    return [
      'Renderer: The student finds one erroneous fragment.',
      'tokensText contains tokens separated by spaces, minimum 3.',
      'correctIndex contains the number of the incorrect token starting from one, correctToken contains the correct replacement.',
    ].join(' ')
  }

  if (gameId === 'match-pairs') {
    return [
      'Renderer: connecting pairs.',
      'pairsText contains from 2 to 8 lines strictly in the format “left side | right side."',
      'Don\'t repeat the left or right part.',
    ].join(' ')
  }

  if (gameId === 'group-sort') {
    return [
      'Renderer: sorting cards into groups.',
      'groupsText contains 2-3 unique groups, one per line.',
      'itemsText contains 2-6 lines in the format “card | exact name of the group”, at least one card per group.',
    ].join(' ')
  }

  if (gameId === 'quiz-rush') {
    return [
      'Renderer: sequential quiz with explanation after each answer.',
      'questionsText contains 2-6 lines strictly in the format “question | option 1; option 2; option 3 | number of the correct option from one | short explanation."',
      'Each question must have 2-4 non-repeating options and exactly one correct answer.',
    ].join(' ')
  }

  return [
    'Renderer: A deck for active recall and honest self-assessment.',
    'cardsText contains 2-8 lines strictly in the format “front side | reverse side | a short example or context.”',
    'The front side should require recall, and the back side should give a short, precise answer without options.',
    'There are only two ratings in the interface: “Remembered” and “Didn’t remember.” Do not mention other scales or self-assessment options in prompt and teacherNote.',
  ].join(' ')
}

function textSchema(minLength: number, maxLength: number) {
  return { type: 'string', minLength, maxLength }
}

function readStrings(input: Record<string, unknown>, keys: string[]) {
  const result: Record<string, string> = {}

  for (const key of keys) {
    if (typeof input[key] !== 'string' || input[key].trim().length === 0) return null
    result[key] = input[key]
  }

  return result
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}
