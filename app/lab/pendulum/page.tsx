import type { Metadata } from 'next'
import { PendulumLab } from '@/components/labs/pendulum/pendulum-lab'

export const metadata: Metadata = { title: 'Pendulum laboratory', description: 'Explore the oscillations, energy and period of a pendulum in a three-dimensional laboratory.' }
export default function PendulumPage() { return <PendulumLab /> }
