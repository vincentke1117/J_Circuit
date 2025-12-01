import type { NodeTypes } from '@xyflow/react'

import CircuitNode from './CircuitNode'

export const circuitNodeTypes: NodeTypes = {
  resistor: CircuitNode,
  capacitor: CircuitNode,
  inductor: CircuitNode,
  vsource_dc: CircuitNode,
  vsource_ac: CircuitNode,
  isource_dc: CircuitNode,
  isource_ac: CircuitNode,
  vcvs: CircuitNode,
  ccvs: CircuitNode,
  vccs: CircuitNode,
  cccs: CircuitNode,
  ground: CircuitNode,
  voltage_probe: CircuitNode,
  current_probe: CircuitNode,
  switch: CircuitNode,
}
