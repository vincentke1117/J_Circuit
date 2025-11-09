import type { Edge, Node } from '@xyflow/react'

import { circuitComponentLibrary } from '@/circuit/components'
import type {
  CircuitNodeData,
  CircuitProject,
  CircuitProjectEdge,
  CircuitProjectNode,
} from '@/types/circuit'

export function buildProjectSnapshot(
  nodes: Node<CircuitNodeData>[],
  edges: Edge[],
): CircuitProject {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type as CircuitProjectNode['type'],
      position: { ...node.position },
      data: { ...node.data, parameters: { ...node.data.parameters } },
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? '',
      targetHandle: edge.targetHandle ?? '',
    })),
  }
}

interface LoadProjectResult {
  ok: boolean
  nodes?: Node<CircuitNodeData>[]
  edges?: Edge[]
  errors: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validateProjectNode(node: unknown): node is CircuitProjectNode {
  if (!isRecord(node)) return false
  if (typeof node.id !== 'string' || typeof node.type !== 'string') return false
  if (!isRecord(node.position) || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') return false
  if (!isRecord(node.data)) return false
  if (typeof node.data.label !== 'string' || typeof node.data.type !== 'string') return false
  if (!isRecord(node.data.parameters)) return false
  return true
}

function validateProjectEdge(edge: unknown): edge is CircuitProjectEdge {
  if (!isRecord(edge)) return false
  return (
    typeof edge.id === 'string' &&
    typeof edge.source === 'string' &&
    typeof edge.target === 'string' &&
    typeof edge.sourceHandle === 'string' &&
    edge.sourceHandle.length > 0 &&
    typeof edge.targetHandle === 'string' &&
    edge.targetHandle.length > 0
  )
}

export function loadProjectFromObject(project: unknown): LoadProjectResult {
  if (!isRecord(project)) {
    return { ok: false, errors: ['文件格式不正确'] }
  }

  const rawNodes = Array.isArray(project.nodes) ? project.nodes : []
  const rawEdges = Array.isArray(project.edges) ? project.edges : []

  if (rawNodes.length === 0) {
    return { ok: false, errors: ['项目中没有任何节点'] }
  }

  const nodes: Node<CircuitNodeData>[] = []
  const edges: Edge[] = []
  const errors: string[] = []

  for (const rawNode of rawNodes) {
    if (!validateProjectNode(rawNode)) {
      errors.push('存在非法的节点数据')
      continue
    }
    const definition = circuitComponentLibrary[rawNode.type as keyof typeof circuitComponentLibrary]
    if (!definition) {
      errors.push(`节点 ${rawNode.id} 的类型 ${rawNode.type} 未知`)
      continue
    }
    const rawParams = isRecord(rawNode.data.parameters) ? rawNode.data.parameters : {}
    const parameters: Record<string, number> = {}
    for (const parameter of definition.parameters) {
      const value = rawParams[parameter.key]
      const numericValue = typeof value === 'number' ? value : Number(value)
      parameters[parameter.key] = Number.isFinite(numericValue)
        ? numericValue
        : parameter.defaultValue ?? 0
    }

    nodes.push({
      id: rawNode.id,
      type: rawNode.type,
      position: { x: rawNode.position.x, y: rawNode.position.y },
      data: {
        label: typeof rawNode.data.label === 'string' ? rawNode.data.label : rawNode.id,
        type: rawNode.type,
        parameters,
      },
    })
  }

  for (const rawEdge of rawEdges) {
    if (!validateProjectEdge(rawEdge)) {
      errors.push('存在非法的连线数据')
      continue
    }
    edges.push({
      id: rawEdge.id,
      source: rawEdge.source,
      target: rawEdge.target,
      sourceHandle: rawEdge.sourceHandle,
      targetHandle: rawEdge.targetHandle,
    })
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, nodes, edges, errors: [] }
}
