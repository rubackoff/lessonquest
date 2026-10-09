import {
  getMatchPairsResult,
  type MatchConnection,
  type MatchPairsLevel,
  type MatchPairsResult,
} from '../match-pairs'

export type MatchPairsSessionState = {
  connections: MatchConnection[]
  attempts: number
}

export type MatchPairsAttemptTransition = {
  state: MatchPairsSessionState
  correct: boolean
  result: MatchPairsResult
}

export function transitionMatchPairsAttempt(
  level: MatchPairsLevel,
  state: MatchPairsSessionState,
  leftIndex: number,
  rightIndex: number,
): MatchPairsAttemptTransition {
  const left = level.pairs[leftIndex]
  const right = level.pairs[rightIndex]
  const correct = Boolean(left && right && left.id === right.id)
  const connections = correct
    ? [
        ...state.connections.filter((connection) => {
          return connection.leftIndex !== leftIndex && connection.rightIndex !== rightIndex
        }),
        { leftIndex, rightIndex },
      ].sort((first, second) => first.leftIndex - second.leftIndex)
    : state.connections
  const attempts = state.attempts + 1

  return {
    state: { connections, attempts },
    correct,
    result: getMatchPairsResult(level, connections, attempts),
  }
}
