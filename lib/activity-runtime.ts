export type GameId = 'force-lab' | 'mistake-arena' | 'match-pairs' | 'group-sort' | 'quiz-rush' | 'recall-deck'

export type ActivityDefinition = {
  id: GameId
  label: string
  description: string
  renderer: string
  baseScore: number
  activeFeedback: string
  primaryActionLabel: string
  nextLevelLabel: string
}

export type CompletionState = Record<GameId, number[]>

const activityById: Record<GameId, ActivityDefinition> = {
  'force-lab': {
    id: 'force-lab',
    label: 'Forces laboratory',
    description: 'equation + physics',
    renderer: 'Template 01',
    baseScore: 120,
    activeFeedback: 'The Force Lab is active. Align F2 with the magnetic target and check the equation.',
    primaryActionLabel: 'Check',
    nextLevelLabel: 'next level',
  },
  'mistake-arena': {
    id: 'mistake-arena',
    label: 'Find the Mistake',
    description: 'tokens + diagnostics',
    renderer: 'Template 02',
    baseScore: 90,
    activeFeedback: 'The bug arena is active. Click on the wrong token right inside the game window.',
    primaryActionLabel: 'Next',
    nextLevelLabel: 'next error',
  },
  'match-pairs': {
    id: 'match-pairs',
    label: 'Couples',
    description: 'connections + drag and drop',
    renderer: 'Template 03',
    baseScore: 140,
    activeFeedback: 'Couples are active. Draw a line from the left card to the correct right card.',
    primaryActionLabel: 'Next',
    nextLevelLabel: 'next set',
  },
  'group-sort': {
    id: 'group-sort',
    label: 'Groups',
    description: 'sorting + zones',
    renderer: 'Template 04',
    baseScore: 150,
    activeFeedback: 'Collections are active. Drag the cards to the appropriate stations.',
    primaryActionLabel: 'Next',
    nextLevelLabel: 'next group',
  },
  'quiz-rush': {
    id: 'quiz-rush',
    label: 'Blitz quiz',
    description: 'choice + explanation',
    renderer: 'Template 05',
    baseScore: 130,
    activeFeedback: 'Blitz quiz is active. Select an answer and read a short explanation.',
    primaryActionLabel: 'Next',
    nextLevelLabel: 'next quiz',
  },
  'recall-deck': {
    id: 'recall-deck',
    label: 'Memory deck',
    description: 'remember + evaluate',
    renderer: 'Template 06',
    baseScore: 110,
    activeFeedback: 'The memory deck is active. First remember the answer, then open the card and rate yourself.',
    primaryActionLabel: 'Open',
    nextLevelLabel: 'next deck',
  },
}

export const activities: ActivityDefinition[] = [
  activityById['force-lab'],
  activityById['mistake-arena'],
  activityById['match-pairs'],
  activityById['group-sort'],
  activityById['quiz-rush'],
  activityById['recall-deck'],
]

export const createEmptyCompletionState = (): CompletionState => ({
  'force-lab': [],
  'mistake-arena': [],
  'match-pairs': [],
  'group-sort': [],
  'quiz-rush': [],
  'recall-deck': [],
})

export const getActivityDefinition = (id: GameId) => activityById[id]

export const hasCompleted = (completed: CompletionState, activityId: GameId, levelId: number) => {
  return completed[activityId].includes(levelId)
}

export const completeOnce = (completed: CompletionState, activityId: GameId, levelId: number) => {
  if (hasCompleted(completed, activityId, levelId)) {
    return completed
  }

  return {
    ...completed,
    [activityId]: [...completed[activityId], levelId],
  }
}

export const awardScore = (baseScore: number, secondsLeft: number) => baseScore + secondsLeft
