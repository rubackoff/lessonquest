import type { GameId } from '@/lib/activity-runtime'

export type CreateAttemptInput = {
  activityId: string
  studentName: string
  durationSeconds: number
  accuracy: number
}

export type SavedAttempt = CreateAttemptInput & {
  id: string
  gameId: GameId
  activityTitle: string
  completedAt: string
}

export function parseCreateAttemptInput(input: unknown): CreateAttemptInput | null {
  if (!isRecord(input)) return null
  if (typeof input.activityId !== 'string' || input.activityId.length < 1 || input.activityId.length > 200) {
    return null
  }
  if (typeof input.studentName !== 'string') return null

  const studentName = input.studentName.trim()
  if (studentName.length < 1 || studentName.length > 80) return null
  if (!isIntegerInRange(input.durationSeconds, 0, 3_600)) return null
  if (!isIntegerInRange(input.accuracy, 0, 100)) return null

  return {
    activityId: input.activityId,
    studentName,
    durationSeconds: input.durationSeconds,
    accuracy: input.accuracy,
  }
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}
