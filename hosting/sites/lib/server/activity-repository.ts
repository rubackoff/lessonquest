import 'server-only'

import { randomUUID } from 'node:crypto'
import { env } from 'cloudflare:workers'
import type { CreateActivityInput } from '@/lib/activity-api'
import { isSavedEditorActivity } from '@/lib/activity-api'
import type { CreateAttemptInput, SavedAttempt } from '@/lib/attempt-api'
import type { SavedEditorActivity } from '@/lib/editor-runtime'

type ActivityRow = {
  id: string
  game_id: string
  title: string
  saved_at: string
  level_json: string
}

type AttemptRow = {
  id: string
  activity_id: string
  game_id: string
  activity_title: string
  student_name: string
  completed_at: string
  duration_seconds: number
  accuracy: number
}

export async function listPublishedActivities(limit = 20): Promise<SavedEditorActivity[]> {
  const { results: rows } = await getDatabase()
    .prepare(
      `SELECT id, game_id, title, saved_at, level_json
       FROM activities
       ORDER BY saved_at DESC
       LIMIT ?`,
    )
    .bind(Math.max(1, Math.min(limit, 100)))
    .all<ActivityRow>()

  return rows.map(mapActivityRow).filter((activity): activity is SavedEditorActivity => activity !== null)
}

export async function getPublishedActivity(id: string): Promise<SavedEditorActivity | null> {
  const row = await getDatabase()
    .prepare('SELECT id, game_id, title, saved_at, level_json FROM activities WHERE id = ?')
    .bind(id)
    .first<ActivityRow>()

  return row ? mapActivityRow(row) : null
}

export async function createPublishedActivity(input: CreateActivityInput): Promise<SavedEditorActivity> {
  const activity: SavedEditorActivity = {
    id: `${input.gameId}-${randomUUID()}`,
    gameId: input.gameId,
    title: input.title,
    savedAt: new Date().toISOString(),
    level: input.level,
  }

  await getDatabase()
    .prepare(
      `INSERT INTO activities (id, game_id, title, saved_at, level_json)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(activity.id, activity.gameId, activity.title, activity.savedAt, JSON.stringify(activity.level))
    .run()

  return activity
}

export async function deletePublishedActivity(id: string) {
  const result = await getDatabase().prepare('DELETE FROM activities WHERE id = ?').bind(id).run()
  return result.meta.changes > 0
}

export async function listActivityAttempts(limit = 30): Promise<SavedAttempt[]> {
  const { results: rows } = await getDatabase()
    .prepare(
      `SELECT id, activity_id, game_id, activity_title, student_name,
              completed_at, duration_seconds, accuracy
       FROM attempts
       ORDER BY completed_at DESC
       LIMIT ?`,
    )
    .bind(Math.max(1, Math.min(limit, 100)))
    .all<AttemptRow>()

  return rows.map(mapAttemptRow)
}

export async function createActivityAttempt(input: CreateAttemptInput): Promise<SavedAttempt | null> {
  const activity = await getPublishedActivity(input.activityId)
  if (!activity) return null

  const attempt: SavedAttempt = {
    id: randomUUID(),
    activityId: activity.id,
    gameId: activity.gameId,
    activityTitle: activity.title,
    studentName: input.studentName,
    completedAt: new Date().toISOString(),
    durationSeconds: input.durationSeconds,
    accuracy: input.accuracy,
  }

  await getDatabase()
    .prepare(
      `INSERT INTO attempts (
         id, activity_id, game_id, activity_title, student_name,
         completed_at, duration_seconds, accuracy
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      attempt.id,
      attempt.activityId,
      attempt.gameId,
      attempt.activityTitle,
      attempt.studentName,
      attempt.completedAt,
      attempt.durationSeconds,
      attempt.accuracy,
    )
    .run()

  return attempt
}

function getDatabase() {
  if (!env.DB) throw new Error('Activity database is unavailable')
  return env.DB
}

function mapAttemptRow(row: AttemptRow): SavedAttempt {
  return {
    id: row.id,
    activityId: row.activity_id,
    gameId: row.game_id as SavedAttempt['gameId'],
    activityTitle: row.activity_title,
    studentName: row.student_name,
    completedAt: row.completed_at,
    durationSeconds: row.duration_seconds,
    accuracy: row.accuracy,
  }
}

function mapActivityRow(row: ActivityRow): SavedEditorActivity | null {
  try {
    const activity = {
      id: row.id,
      gameId: row.game_id,
      title: row.title,
      savedAt: row.saved_at,
      level: JSON.parse(row.level_json),
    }

    return isSavedEditorActivity(activity) ? activity : null
  } catch {
    return null
  }
}
