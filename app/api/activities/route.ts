import { NextResponse } from 'next/server'
import { parseCreateActivityInput } from '@/lib/activity-api'
import {
  createPublishedActivity,
  listPublishedActivities,
} from '@/lib/server/activity-repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ activities: await listPublishedActivities() })
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const input = parseCreateActivityInput(body)
  if (!input) {
    return NextResponse.json({ error: 'Invalid activity data.' }, { status: 400 })
  }

  return NextResponse.json({ activity: await createPublishedActivity(input) }, { status: 201 })
}
