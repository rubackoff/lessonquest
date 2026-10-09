import type { Metadata } from 'next'
import { TowerDefenseGame } from '@/components/games/tower-defense/tower-defense-game'
import { defenseLessons } from '@/lib/tower-defense/content'
import { defenseMissions } from '@/lib/tower-defense/session'

export const metadata: Metadata = {
  title: 'Base Defense - LessonQuest',
  description: 'Place and charge towers with knowledge. Protect the hero and pets from three short waves of bubbles.',
}
export default async function TowerDefensePage({ searchParams }: { searchParams: Promise<{ mode?: string; lesson?: string; mission?: string; chapter?: string }> }) {
  const query = await searchParams
  const lessonId = defenseLessons.find(item => item.id === query.lesson)?.id ?? 'seven'
  const mission = defenseMissions.find(item => item.id === query.mission)?.id ?? 'watch'
  const chapter = ['1', '2', '3'].includes(query.chapter ?? '') ? Number(query.chapter) : 1
  return <TowerDefenseGame key={`${lessonId}-${mission}-${query.mode}-${chapter}`} lessonId={lessonId} homework={query.mode === 'homework'} mission={mission} chapter={chapter} />
}
