import { NextResponse } from 'next/server'
import {
  deletePublishedActivity,
  getPublishedActivity,
} from '@/lib/server/activity-repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ActivityRouteContext = {
  params: Promise<{
    activityId: string
  }>
}

export async function GET(_request: Request, context: ActivityRouteContext) {
  const { activityId } = await context.params
  const activity = await getPublishedActivity(activityId)

  if (!activity) {
    return NextResponse.json({ error: 'Activity not found.' }, { status: 404 })
  }

  return NextResponse.json({ activity })
}

export async function DELETE(_request: Request, context: ActivityRouteContext) {
  const { activityId } = await context.params

  if (!(await deletePublishedActivity(activityId))) {
    return NextResponse.json({ error: 'Activity not found.' }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
