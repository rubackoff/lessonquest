import type { Metadata } from 'next'
import { MissionLab } from '@/components/mechanics-lab/mission-lab'

export const metadata: Metadata = { title: 'Scenario Games – LessonQuest' }
export default function MissionsPage() { return <MissionLab /> }
