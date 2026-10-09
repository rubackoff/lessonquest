import { redirect } from 'next/navigation'

export default async function CharacterHeistPage({ searchParams }: { searchParams: Promise<{ mode?: string; lesson?: string }> }) {
  const query = await searchParams, params = new URLSearchParams()
  if (query.mode) params.set('mode', query.mode)
  if (query.lesson) params.set('lesson', ['english-s', 'quiz-1', 'english'].includes(query.lesson) ? 'english-s' : 'seven')
  redirect(`/lab/tower-defense${params.size ? `?${params}` : ''}`)
}
