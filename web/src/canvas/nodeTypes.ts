import type { NodeTypes } from '@xyflow/react'

import type { CircuitNodeData } from '@/types/circuit'

import CircuitNode from './CircuitNode'

export const circuitNodeTypes: NodeTypes<CircuitNodeData> = {
  resistor: CircuitNode,
  capacitor: CircuitNode,
  inductor: CircuitNode,
  vsource_dc: CircuitNode,
  vsource_ac: CircuitNode,
  ground: CircuitNode,
  voltage_probe: CircuitNode,
  current_probe: CircuitNode,
}
