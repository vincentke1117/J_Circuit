import type { CircuitComponentType } from '@/circuit/components'

export interface CircuitNodeData {
  label: string
  type: CircuitComponentType
  parameters: Record<string, number>
}

export interface SimulationSettings {
  tStop: number
  nSamples: number
}

export interface CircuitProjectNode {
  id: string
  type: CircuitComponentType
  position: { x: number; y: number }
  data: CircuitNodeData
}

export interface CircuitProjectEdge {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
}

export interface CircuitProject {
  nodes: CircuitProjectNode[]
  edges: CircuitProjectEdge[]
}

export interface SimulationComponentPayload {
  id: string
  type: CircuitComponentType
  parameters: Record<string, number>
  connections: Record<string, string>
}

export interface SimulationNetPayload {
  name: string
  nodes: [string, string][]
}

export interface SimulationPayload {
  components: SimulationComponentPayload[]
  nets: SimulationNetPayload[]
  sim: {
    t_stop: number
    n_samples: number
  }
}

export interface SimulationSignal {
  id: string
  label: string
  values: number[]
}

export interface SimulationData {
  time: number[]
  signals: SimulationSignal[]
}

export interface SimulationSuccessResponse {
  status: 'ok'
  message: string
  data: SimulationData
}

export interface SimulationErrorResponse {
  status: 'error'
  message: string
  data?: Record<string, unknown>
}

export type SimulationResponse = SimulationSuccessResponse | SimulationErrorResponse
