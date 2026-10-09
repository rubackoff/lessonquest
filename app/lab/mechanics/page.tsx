import type { Metadata } from 'next'
import { MechanicsLab } from '@/components/mechanics-lab/mechanics-lab'

export const metadata: Metadata = { title: 'Mechanics Laboratory – LessonQuest' }
export default function MechanicsPage() { return <MechanicsLab /> }
