import { redirect } from 'next/navigation'

export default async function ForestCampPage({ searchParams }: { searchParams: Promise<{ mode?: string; lesson?: string }> }) {
  const query = await searchParams
  const params = new URLSearchParams()
  if (query.mode) params.set('mode', query.mode)
  if (query.lesson) params.set('lesson', query.lesson)
  redirect(`/lab/character-heist${params.size ? `?${params}` : ''}`)
}
