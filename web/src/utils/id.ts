import type { Node } from '@xyflow/react'

import type { CircuitComponentDefinition } from '@/circuit/components'
import type { CircuitNodeData } from '@/types/circuit'

export function nextComponentId(
  counters: Record<string, number>,
  definition: CircuitComponentDefinition,
): { id: string; nextCounters: Record<string, number> } {
  const current = counters[definition.type] ?? 0
  const next = current + 1
  return {
    id: `${definition.prefix}${next}`,
    nextCounters: {
      ...counters,
      [definition.type]: next,
    },
  }
}

export function rebuildCountersFromNodes(nodes: Node<CircuitNodeData>[]): Record<string, number> {
  const counters: Record<string, number> = {}
  for (const node of nodes) {
    const match = node.id.match(/(\d+)$/)
    if (!match) continue
    const value = Number(match[1])
    if (!Number.isFinite(value)) continue
    const typeKey = node.data.type
    counters[typeKey] = Math.max(counters[typeKey] ?? 0, value)
  }
  return counters
}
