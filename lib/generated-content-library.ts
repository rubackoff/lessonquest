import type { ContentLibraryItem } from '@/lib/content-library'
import { contentFactBanks, type ContentFact, type ContentFactBank } from '@/lib/content-fact-banks'
import type { MatchEditorDraft, QuizEditorDraft, RecallEditorDraft } from '@/lib/editor-runtime'
import { generatedGroupContentLibrary, generatedGroupMaterialsCount } from '@/lib/generated-group-content'
import {
  generatedMistakeLibrary,
  generatedMistakeMaterialsCount,
  generatedParametricQuizLibrary,
  generatedParametricQuizMaterialsCount,
} from '@/lib/generated-parametric-content'

export const generatedVariantsPerBank = 24
export const generatedGamesPerVariant = 3
export const generatedFactMaterialsCount = contentFactBanks.length * generatedVariantsPerBank * generatedGamesPerVariant
export const generatedMaterialsCount =
  generatedFactMaterialsCount +
  generatedGroupMaterialsCount +
  generatedParametricQuizMaterialsCount +
  generatedMistakeMaterialsCount

const source = 'LessonQuest Generator' as const

const generatedFactContentLibrary: ContentLibraryItem[] = contentFactBanks.flatMap((bank, bankIndex) => {
  const combinations = choose(bank.facts, 4)

  return Array.from({ length: generatedVariantsPerBank }, (_, variantIndex) => {
    const combinationIndex = (variantIndex * 17 + bankIndex * 13) % combinations.length
    const selectedFacts = combinations[combinationIndex]

    return [
      makeMatchMaterial(bank, selectedFacts, variantIndex),
      makeQuizMaterial(bank, selectedFacts, variantIndex),
      makeRecallMaterial(bank, selectedFacts, variantIndex),
    ]
  }).flat()
})

export const generatedContentLibrary: ContentLibraryItem[] = [
  ...generatedFactContentLibrary,
  ...generatedGroupContentLibrary,
  ...generatedParametricQuizLibrary,
  ...generatedMistakeLibrary,
]

if (generatedContentLibrary.length !== generatedMaterialsCount) {
  throw new Error(`Expected ${generatedMaterialsCount} generated materials, received ${generatedContentLibrary.length}.`)
}

function makeMatchMaterial(bank: ContentFactBank, facts: ContentFact[], variantIndex: number): ContentLibraryItem {
  const number = variantNumber(variantIndex)
  const title = `${bank.title}: couples ${number}`
  const draft: MatchEditorDraft = {
    title,
    subject: bank.subject,
    grade: bank.grade,
    teacherNote: 'The set is assembled by a deterministic generator from the editorial subject bank and is fully editable.',
    prompt: 'Connect elements that relate to each other.',
    pairsText: facts.map((item) => `${item.left} | ${item.right}`).join('\n'),
  }

  return {
    id: generatedId(bank.id, 'match', variantIndex),
    gameId: 'match-pairs',
    title,
    subject: bank.subject,
    grade: bank.grade,
    summary: `Four matches on the topic "${bank.title}».`,
    tags: [...bank.tags, 'generated set', 'couples'],
    draft,
    source,
  }
}

function makeQuizMaterial(bank: ContentFactBank, facts: ContentFact[], variantIndex: number): ContentLibraryItem {
  const number = variantNumber(variantIndex)
  const title = `${bank.title}: quiz ${number}`
  const questions = facts.slice(0, 3).map((item, questionIndex) => {
    const distractors = selectDistractors(facts, item, variantIndex + questionIndex)
    const correctIndex = ((variantIndex + questionIndex) % 3) + 1
    const options = [...distractors]
    options.splice(correctIndex - 1, 0, item.right)
    return `What corresponds to "${item.left}»? | ${options.join(' ; ')} | ${correctIndex} | ${item.explanation}`
  })
  const draft: QuizEditorDraft = {
    title,
    subject: bank.subject,
    grade: bank.grade,
    teacherNote: 'The answer options are collected only from verified elements of one subject bank.',
    prompt: 'Select an exact match and parse the explanation.',
    questionsText: questions.join('\n'),
  }

  return {
    id: generatedId(bank.id, 'quiz', variantIndex),
    gameId: 'quiz-rush',
    title,
    subject: bank.subject,
    grade: bank.grade,
    summary: `Three questions with explanations on the topic "${bank.title}».`,
    tags: [...bank.tags, 'generated set', 'quiz'],
    draft,
    source,
  }
}

function makeRecallMaterial(bank: ContentFactBank, facts: ContentFact[], variantIndex: number): ContentLibraryItem {
  const number = variantNumber(variantIndex)
  const title = `${bank.title}: repetition ${number}`
  const draft: RecallEditorDraft = {
    title,
    subject: bank.subject,
    grade: bank.grade,
    teacherNote: 'The cards use active recall: answer first, then check and explain.',
    prompt: 'Formulate your answer, turn the card over and rate yourself.',
    cardsText: facts.map((item) => `${item.left} | ${item.right} | ${item.explanation}`).join('\n'),
  }

  return {
    id: generatedId(bank.id, 'recall', variantIndex),
    gameId: 'recall-deck',
    title,
    subject: bank.subject,
    grade: bank.grade,
    summary: `Four cards with explanations on the topic "${bank.title}».`,
    tags: [...bank.tags, 'generated set', 'repetition'],
    draft,
    source,
  }
}

function choose<T>(items: T[], size: number): T[][] {
  const combinations: T[][] = []

  function visit(startIndex: number, current: T[]) {
    if (current.length === size) {
      combinations.push([...current])
      return
    }

    for (let index = startIndex; index <= items.length - (size - current.length); index += 1) {
      current.push(items[index])
      visit(index + 1, current)
      current.pop()
    }
  }

  visit(0, [])
  return combinations
}

function selectDistractors(facts: ContentFact[], correct: ContentFact, offset: number) {
  const candidates = facts.filter((item) => item !== correct).map((item) => item.right)
  const firstIndex = offset % candidates.length
  const secondIndex = (firstIndex + 1) % candidates.length
  return [candidates[firstIndex], candidates[secondIndex]]
}

function generatedId(bankId: string, game: 'match' | 'quiz' | 'recall', variantIndex: number) {
  return `generated-${bankId}-${game}-${variantNumber(variantIndex)}`
}

function variantNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}
