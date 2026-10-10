import type { Metadata } from 'next'
import { RefractionLab } from '@/components/labs/refraction/refraction-lab'

export const metadata: Metadata = { title: 'Refraction — Lighthouse Terrace', description: 'Explore refraction and total internal reflection on a coastal optical bench.' }
export default function RefractionPage() { return <RefractionLab /> }
