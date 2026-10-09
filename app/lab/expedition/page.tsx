import type { Metadata } from 'next'
import { ExpeditionGame } from '@/components/games/expedition/expedition-game'
import { expeditionTopics } from '@/lib/expedition/content'

export const metadata: Metadata = { title: 'Expedition – LessonQuest', description: 'Build crossings and platforms, checking lengths, area and scale. Guide your character and pets through the gorge.' }
export default async function ExpeditionPage({ searchParams }: { searchParams: Promise<{ topic?: string; mode?: string; chapter?: string }> }) {
  const query = await searchParams, topic = expeditionTopics.find(t => t.id === query.topic)?.id ?? 'triangle'
  const chapter = ['1', '2', '3'].includes(query.chapter ?? '') ? Number(query.chapter) : 1
  return <ExpeditionGame key={`${topic}:${query.mode}:${chapter}`} topic={topic} homework={query.mode === 'homework'} chapter={chapter} />
}
