import type { Metadata } from 'next'
import { OrbitalRunnerGame } from '@/components/games/orbital-runner/orbital-runner-game'
import { mazeLessons } from '@/lib/space-maze/content'

export const metadata: Metadata = {
  title: 'Orbital Runner – LessonQuest',
  description: 'Educational 3D runner: change paths, overcome obstacles and answer questions.',
}

export default async function OrbitalRunnerPage({ searchParams }: { searchParams: Promise<{ mode?: string; lesson?: string }> }) {
  const query = await searchParams
  const lessons = [...mazeLessons].sort((a, b) => Number(b.id === query.lesson) - Number(a.id === query.lesson))
  return <OrbitalRunnerGame key={`${lessons[0].id}-${query.mode === 'homework'}`} lessons={lessons} homework={query.mode === 'homework'} />
}
