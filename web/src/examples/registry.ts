import type { CircuitProject } from '@/types/circuit'

export interface ExampleCircuit {
  id: string
  title: string
  description: string
  thumbnail?: string // URL or component
  data: CircuitProject
}

export async function loadExamples(): Promise<ExampleCircuit[]> {
  const [voltageDividerData, rlcSeriesData, wheatstoneBridgeData] = await Promise.all([
    import('./data/voltage-divider.json'),
    import('./data/rlc-series.json'),
    import('./data/wheatstone-bridge.json'),
  ])
  return [
    {
      id: 'voltage-divider',
      title: 'Voltage Divider',
      description: 'A fundamental circuit that produces an output voltage that is a fraction of its input voltage.',
      data: voltageDividerData.default as unknown as CircuitProject,
    },
    {
      id: 'rlc-series',
      title: 'RLC Series Circuit',
      description: 'An electrical circuit consisting of a resistor, an inductor, and a capacitor connected in series.',
      data: rlcSeriesData.default as unknown as CircuitProject,
    },
    {
      id: 'wheatstone-bridge',
      title: 'Wheatstone Bridge',
      description: 'A bridge circuit used to measure an unknown electrical resistance by balancing two legs of a bridge circuit.',
      data: wheatstoneBridgeData.default as unknown as CircuitProject,
    },
  ]
}
