import type { Node } from '@xyflow/react'

import { circuitComponentLibrary } from '@/circuit/components'
import type { CircuitNodeData } from '@/types/circuit'
import { CONTROL_COMPONENT_TYPES, type ControlComponentType, type DiagramMode } from '@/types/control'

const controlComponentTypeSet = new Set<string>(CONTROL_COMPONENT_TYPES)

export function isControlComponentType(type: string): type is ControlComponentType {
  return controlComponentTypeSet.has(type)
}

export function isElectricalComponentType(type: string): boolean {
  return type in circuitComponentLibrary && !isControlComponentType(type)
}

export function detectDiagramMode(nodes: Node<CircuitNodeData>[]): DiagramMode {
  if (nodes.length === 0) return 'empty'

  let hasControl = false
  let hasElectrical = false

  for (const node of nodes) {
    const type = String(node.type ?? '')
    if (isControlComponentType(type)) {
      hasControl = true
      continue
    }
    if (isElectricalComponentType(type)) {
      hasElectrical = true
    }
  }

  if (hasControl && hasElectrical) return 'mixed'
  if (hasControl) return 'control'
  return 'electrical'
}
