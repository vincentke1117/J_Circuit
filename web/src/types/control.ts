export type ControlComponentType =
  | 'control_step'
  | 'control_constant'
  | 'control_sum'
  | 'control_gain'
  | 'control_integrator'
  | 'control_plant_1st'
  | 'control_pid'
  | 'control_scope'

export type DiagramMode = 'empty' | 'electrical' | 'control' | 'mixed'

export interface ControlBlockPayload {
  id: string
  type: ControlComponentType
  parameters: Record<string, number>
}

export interface ControlEdgePayload {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
}

export interface ControlOutputPayload {
  id: string
  blockId: string
  handle: string
  label: string
}

export interface ControlSimulationPayload {
  kind: 'control'
  blocks: ControlBlockPayload[]
  edges: ControlEdgePayload[]
  outputs: ControlOutputPayload[]
  sim: {
    t_stop: number
    n_samples: number
  }
}

export const CONTROL_COMPONENT_TYPES: readonly ControlComponentType[] = [
  'control_step',
  'control_constant',
  'control_sum',
  'control_gain',
  'control_integrator',
  'control_plant_1st',
  'control_pid',
  'control_scope',
]

export const CONTROL_DYNAMIC_COMPONENT_TYPES = new Set<ControlComponentType>([
  'control_integrator',
  'control_plant_1st',
  'control_pid',
])
