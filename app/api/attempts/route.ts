import { NextResponse } from 'next/server'
import { parseCreateAttemptInput } from '@/lib/attempt-api'
import { createActivityAttempt, listActivityAttempts } from '@/lib/server/activity-repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ attempts: await listActivityAttempts() })
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const input = parseCreateAttemptInput(body)
  if (!input) {
    return NextResponse.json({ error: 'Invalid attempt data.' }, { status: 400 })
  }

  const attempt = await createActivityAttempt(input)
  if (!attempt) {
    return NextResponse.json({ error: 'Activity not found.' }, { status: 404 })
  }

  return NextResponse.json({ attempt }, { status: 201 })
}
