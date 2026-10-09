import type { Metadata } from 'next'
import { SpaceMazeGame } from '@/components/games/space-maze/space-maze-game'
import { mazeLessons } from '@/lib/space-maze/content'

export const metadata: Metadata = {
  title: 'Space Labyrinth – LessonQuest',
  description: 'Educational 3D maze: find the correct answer and elude the aliens.',
}

export default async function SpaceMazePage({ searchParams }: { searchParams: Promise<{ mode?: string; lesson?: string }> }) {
  const query = await searchParams
  const lessons = [...mazeLessons].sort((a, b) => Number(b.id === query.lesson) - Number(a.id === query.lesson))
  return <SpaceMazeGame key={`${lessons[0].id}-${query.mode === 'homework'}`} lessons={lessons} homework={query.mode === 'homework'} />
}
