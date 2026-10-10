import type { Metadata } from 'next'
import { CircuitLab } from '@/components/labs/circuit/circuit-lab'

export const metadata: Metadata = { title: 'Electric Circuit — Night Depot', description: 'Close the circuit, light the bulb and explore how voltage and resistance change current.' }
export default function CircuitPage() { return <CircuitLab /> }
