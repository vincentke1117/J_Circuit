import type { Edge, Node } from '@xyflow/react'

import { circuitComponentLibrary } from '@/circuit/components'
import type {
  CircuitNodeData,
  SimulationPayload,
  SimulationSettings,
  SimulationNetPayload,
} from '@/types/circuit'

export interface BuildSimulationPayloadResult {
  ok: boolean
  payload?: SimulationPayload
  errors: string[]
}

class DisjointSet<T extends string> {
  private parent = new Map<T, T>()
  private rank = new Map<T, number>()

  add(value: T) {
    if (!this.parent.has(value)) {
      this.parent.set(value, value)
      this.rank.set(value, 0)
    }
  }

  find(value: T): T {
    const parent = this.parent.get(value)
    if (!parent || parent === value) {
      return value
    }
    const root = this.find(parent)
    this.parent.set(value, root)
    return root
  }

  union(a: T, b: T) {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA === rootB) return

    const rankA = this.rank.get(rootA) ?? 0
    const rankB = this.rank.get(rootB) ?? 0

    if (rankA < rankB) {
      this.parent.set(rootA, rootB)
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA)
    } else {
      this.parent.set(rootB, rootA)
      this.rank.set(rootA, rankA + 1)
    }
  }

  groups(): Map<T, T[]> {
    const result = new Map<T, T[]>()
    for (const key of this.parent.keys()) {
      const root = this.find(key)
      const group = result.get(root)
      if (group) {
        group.push(key)
      } else {
        result.set(root, [key])
      }
    }
    return result
  }
}

function handleKey(nodeId: string, handleId: string) {
  return `${nodeId}:${handleId}` as const
}

function ensureFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
}

function buildNets(
  nodes: Node<CircuitNodeData>[],
  edges: Edge[],
): {
  nets: SimulationNetPayload[]
  handleNetMap: Map<string, string>
  errors: string[]
} {
  const errors: string[] = []
  const disjointSet = new DisjointSet<string>()
  for (const edge of edges) {
    if (!edge.sourceHandle || !edge.targetHandle) {
      errors.push(`连线 ${edge.id} 缺少端子信息`)
      continue
    }
    const sourceKey = handleKey(edge.source, edge.sourceHandle)
    const targetKey = handleKey(edge.target, edge.targetHandle)
    disjointSet.add(sourceKey)
    disjointSet.add(targetKey)
    disjointSet.union(sourceKey, targetKey)
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const nets: SimulationNetPayload[] = []
  const handleNetMap = new Map<string, string>()
  let netIndex = 1

  const groups = disjointSet.groups()
  for (const [, groupHandles] of groups) {
    const members: [string, string][] = []
    let hasGround = false

    for (const handleKeyEntry of groupHandles) {
      const [nodeId, handleId] = handleKeyEntry.split(':')
      const node = nodeMap.get(nodeId)
      if (!node) {
        errors.push(`连线引用了不存在的元件 ${nodeId}`)
        continue
      }
      const definition = circuitComponentLibrary[node.type as keyof typeof circuitComponentLibrary]
      if (!definition) {
        errors.push(`连线引用了未知元件类型 ${node.type}`)
        continue
      }
      const handleExists = definition.handles.some((handle) => handle.id === handleId)
      if (!handleExists) {
        const label = node.data.label ?? node.id
        errors.push(`${label} 不存在端子 ${handleId}`)
        continue
      }
      members.push([nodeId, handleId])
      if (node.type === 'ground') {
        hasGround = true
      }
    }

    if (members.length < 2) {
      errors.push(`网络 ${hasGround ? 'gnd' : 'n?'} 只有 ${members.length} 个端子，无法仿真`)
      continue
    }

    const name = hasGround ? 'gnd' : `n${netIndex++}`
    nets.push({ name, nodes: members })
    for (const member of members) {
      handleNetMap.set(handleKey(member[0], member[1]), name)
    }
  }

  return { nets, handleNetMap, errors }
}

export function buildSimulationPayload(
  nodes: Node<CircuitNodeData>[],
  edges: Edge[],
  settings: SimulationSettings,
): BuildSimulationPayloadResult {
  const errors: string[] = []

  if (!(settings.tStop > 0)) {
    errors.push('仿真时长必须大于 0')
  }
  if (!Number.isInteger(settings.nSamples) || settings.nSamples < 2) {
    errors.push('采样点数至少为 2 且必须为整数')
  }

  if (nodes.length === 0) {
    errors.push('请先在画布中放置元件')
  }

  const { nets, handleNetMap, errors: netErrors } = buildNets(nodes, edges)
  errors.push(...netErrors)

  const components: SimulationPayload['components'] = []
  let hasGround = false
  let hasSource = false

  for (const node of nodes) {
    const definition = circuitComponentLibrary[node.type as keyof typeof circuitComponentLibrary]
    if (!definition) {
      errors.push(`未知元件类型：${node.type}`)
      continue
    }

    if (node.type === 'ground') {
      hasGround = true
    }

    if (node.type === 'vsource_dc' || node.type === 'vsource_ac') {
      hasSource = true
    }

    const parameters: Record<string, number> = {}
    for (const parameter of definition.parameters) {
      const value = node.data.parameters[parameter.key]
      if (!ensureFiniteNumber(value) || (parameter.min !== undefined && value < parameter.min)) {
        errors.push(`${node.data.label} 的参数 ${parameter.label} 无效`)
      } else {
        parameters[parameter.key] = value
      }
    }

    const connections: Record<string, string> = {}
    for (const handle of definition.handles) {
      const key = handleKey(node.id, handle.id)
      const netName = handleNetMap.get(key)
      if (!netName) {
        errors.push(`${node.data.label} 的端子 ${handle.id} 未连接`)
      } else {
        connections[handle.id] = netName
      }
    }

    components.push({
      id: node.id,
      type: node.type,
      parameters,
      connections,
    })
  }

  if (!hasGround) {
    errors.push('电路缺少地线')
  }

  if (!hasSource) {
    errors.push('电路必须包含至少一个电压源')
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    errors: [],
    payload: {
      components,
      nets,
      sim: {
        t_stop: settings.tStop,
        n_samples: settings.nSamples,
      },
    },
  }
}
