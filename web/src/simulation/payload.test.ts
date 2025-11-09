import type { Edge, Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'

import type { CircuitNodeData, SimulationSettings } from '@/types/circuit'

import { buildSimulationPayload } from './payload'

const defaultSettings: SimulationSettings = {
  tStop: 1e-3,
  nSamples: 100,
}

describe('buildSimulationPayload', () => {
  it('构建合法电路的仿真载荷', () => {
    const nodes: Node<CircuitNodeData>[] = [
      {
        id: 'V1',
        type: 'vsource_dc',
        position: { x: 0, y: 0 },
        data: { label: 'V1', type: 'vsource_dc', parameters: { dc: 5 } },
      },
      {
        id: 'R1',
        type: 'resistor',
        position: { x: 200, y: 0 },
        data: { label: 'R1', type: 'resistor', parameters: { value: 1000 } },
      },
      {
        id: 'C1',
        type: 'capacitor',
        position: { x: 400, y: 0 },
        data: { label: 'C1', type: 'capacitor', parameters: { value: 1e-6 } },
      },
      {
        id: 'G1',
        type: 'ground',
        position: { x: 200, y: 200 },
        data: { label: 'G1', type: 'ground', parameters: {} },
      },
      {
        id: 'VP1',
        type: 'voltage_probe',
        position: { x: 200, y: -120 },
        data: { label: 'VP1', type: 'voltage_probe', parameters: {} },
      },
    ]

    const edges: Edge[] = [
      { id: 'e1', source: 'V1', target: 'R1', sourceHandle: 'pos', targetHandle: 'p' },
      { id: 'e2', source: 'R1', target: 'C1', sourceHandle: 'n', targetHandle: 'p' },
      { id: 'e3', source: 'C1', target: 'G1', sourceHandle: 'n', targetHandle: 'gnd' },
      { id: 'e4', source: 'V1', target: 'G1', sourceHandle: 'neg', targetHandle: 'gnd' },
      { id: 'e5', source: 'R1', target: 'VP1', sourceHandle: 'p', targetHandle: 'node' },
    ]

    const result = buildSimulationPayload(nodes, edges, defaultSettings)
    expect(result.ok).toBe(true)
    expect(result.payload).toBeDefined()

    const payload = result.payload!
    expect(payload.components).toHaveLength(5)
    const resistor = payload.components.find((component) => component.id === 'R1')
    expect(resistor?.connections.p).toBeDefined()
    expect(resistor?.connections.n).toBeDefined()
    expect(payload.nets.some((net) => net.name === 'gnd')).toBe(true)
    expect(payload.sim.t_stop).toBeCloseTo(defaultSettings.tStop)
    expect(payload.sim.n_samples).toBe(defaultSettings.nSamples)
  })

  it('缺少电压源时报错', () => {
    const nodes: Node<CircuitNodeData>[] = [
      {
        id: 'R1',
        type: 'resistor',
        position: { x: 0, y: 0 },
        data: { label: 'R1', type: 'resistor', parameters: { value: 100 } },
      },
      {
        id: 'G1',
        type: 'ground',
        position: { x: 0, y: 120 },
        data: { label: 'G1', type: 'ground', parameters: {} },
      },
    ]

    const edges: Edge[] = [
      { id: 'e1', source: 'R1', target: 'G1', sourceHandle: 'n', targetHandle: 'gnd' },
    ]

    const result = buildSimulationPayload(nodes, edges, defaultSettings)
    expect(result.ok).toBe(false)
    expect(result.errors.some((error) => error.includes('电路必须包含至少一个电压源'))).toBe(true)
  })
})
