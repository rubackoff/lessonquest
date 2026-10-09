import 'server-only'

import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { getConnectionString, getDatabase as getNetlifyDatabase, MissingDatabaseConnectionError } from '@netlify/database'
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

const globalDatabase = globalThis as typeof globalThis & {
  activityDatabase?: DatabaseSync
  netlifyActivityDatabase?: ReturnType<typeof getNetlifyDatabase>
}

export async function listPublishedActivities(limit = 20): Promise<SavedEditorActivity[]> {
  const rows = await query<ActivityRow>(
    `SELECT id, game_id, title, saved_at, level_json
     FROM activities
     ORDER BY saved_at DESC
     LIMIT ?`,
    [Math.max(1, Math.min(limit, 100))],
  )

  return rows.map(mapActivityRow).filter((activity): activity is SavedEditorActivity => activity !== null)
}

export async function getPublishedActivity(id: string): Promise<SavedEditorActivity | null> {
  const [row] = await query<ActivityRow>(
    'SELECT id, game_id, title, saved_at, level_json FROM activities WHERE id = ?',
    [id],
  )

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

  await query(
    `INSERT INTO activities (id, game_id, title, saved_at, level_json)
     VALUES (?, ?, ?, ?, ?)`,
    [activity.id, activity.gameId, activity.title, activity.savedAt, JSON.stringify(activity.level)],
  )

  return activity
}

export async function deletePublishedActivity(id: string) {
  const rows = await query('DELETE FROM activities WHERE id = ? RETURNING id', [id])
  return rows.length > 0
}

export async function listActivityAttempts(limit = 30): Promise<SavedAttempt[]> {
  const rows = await query<AttemptRow>(
    `SELECT id, activity_id, game_id, activity_title, student_name,
            completed_at, duration_seconds, accuracy
     FROM attempts
     ORDER BY completed_at DESC
     LIMIT ?`,
    [Math.max(1, Math.min(limit, 100))],
  )

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

  await query(
    `INSERT INTO attempts (
       id, activity_id, game_id, activity_title, student_name,
       completed_at, duration_seconds, accuracy
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      attempt.id,
      attempt.activityId,
      attempt.gameId,
      attempt.activityTitle,
      attempt.studentName,
      attempt.completedAt,
      attempt.durationSeconds,
      attempt.accuracy,
    ],
  )

  return attempt
}

async function query<T = Record<string, unknown>>(statement: string, parameters: Array<string | number> = []): Promise<T[]> {
  let cloudConfigured = false
  try {
    getConnectionString()
    cloudConfigured = true
  } catch (error) {
    if (!(error instanceof MissingDatabaseConnectionError) || process.env.NETLIFY || process.env.SITE_ID) throw error
  }

  if (cloudConfigured) {
    const database = globalDatabase.netlifyActivityDatabase ??= getNetlifyDatabase()
    let index = 0
    const sql = statement.replace(/\?/g, () => `$${++index}`)
    return await database.sql.unsafe(sql, parameters) as T[]
  }

  return getDatabase().prepare(statement).all(...parameters) as T[]
}

function getDatabase() {
  if (globalDatabase.activityDatabase) return globalDatabase.activityDatabase

  const databasePath = process.env.ACTIVITY_DB_PATH?.trim() || join(process.cwd(), 'data', 'mvp.sqlite')
  mkdirSync(dirname(databasePath), { recursive: true })

  const database = new DatabaseSync(databasePath)
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      title TEXT NOT NULL,
      saved_at TEXT NOT NULL,
      level_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS activities_saved_at_idx ON activities(saved_at DESC);
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      game_id TEXT NOT NULL,
      activity_title TEXT NOT NULL,
      student_name TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      accuracy INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS attempts_completed_at_idx ON attempts(completed_at DESC);
    CREATE INDEX IF NOT EXISTS attempts_activity_id_idx ON attempts(activity_id);
  `)

  globalDatabase.activityDatabase = database
  return database
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
