import { Position } from '@xyflow/react'

export const DND_COMPONENT_MIME = 'application/x-jcircuit-component'

export type CircuitComponentType =
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'vsource_dc'
  | 'vsource_ac'
  | 'ground'
  | 'voltage_probe'
  | 'current_probe'

export interface CircuitComponentHandle {
  id: string
  position: Position
  label?: string
}

export interface CircuitComponentParameter {
  key: string
  label: string
  unit?: string
  defaultValue?: number
  min?: number
}

export interface CircuitComponentDefinition {
  type: CircuitComponentType
  label: string
  prefix: string
  accent: string
  handles: CircuitComponentHandle[]
  parameters: CircuitComponentParameter[]
}

export const circuitComponentLibrary: Record<CircuitComponentType, CircuitComponentDefinition> = {
  resistor: {
    type: 'resistor',
    label: '电阻',
    prefix: 'R',
    accent: '#f97316',
    handles: [
      { id: 'p', position: Position.Left, label: 'p' },
      { id: 'n', position: Position.Right, label: 'n' },
    ],
    parameters: [
      { key: 'value', label: '阻值', unit: 'Ω', defaultValue: 1000, min: 0 },
    ],
  },
  capacitor: {
    type: 'capacitor',
    label: '电容',
    prefix: 'C',
    accent: '#38bdf8',
    handles: [
      { id: 'p', position: Position.Left, label: 'p' },
      { id: 'n', position: Position.Right, label: 'n' },
    ],
    parameters: [
      { key: 'value', label: '电容值', unit: 'F', defaultValue: 1e-6, min: 0 },
    ],
  },
  inductor: {
    type: 'inductor',
    label: '电感',
    prefix: 'L',
    accent: '#a855f7',
    handles: [
      { id: 'p', position: Position.Left, label: 'p' },
      { id: 'n', position: Position.Right, label: 'n' },
    ],
    parameters: [
      { key: 'value', label: '电感值', unit: 'H', defaultValue: 1e-3, min: 0 },
    ],
  },
  vsource_dc: {
    type: 'vsource_dc',
    label: '直流电压源',
    prefix: 'V',
    accent: '#facc15',
    handles: [
      { id: 'pos', position: Position.Top, label: '+' },
      { id: 'neg', position: Position.Bottom, label: '-' },
    ],
    parameters: [
      { key: 'dc', label: '电压', unit: 'V', defaultValue: 5 },
    ],
  },
  vsource_ac: {
    type: 'vsource_ac',
    label: '交流电压源',
    prefix: 'VAC',
    accent: '#fb7185',
    handles: [
      { id: 'pos', position: Position.Top, label: '+' },
      { id: 'neg', position: Position.Bottom, label: '-' },
    ],
    parameters: [
      { key: 'amplitude', label: '幅值', unit: 'V', defaultValue: 5, min: 0 },
      { key: 'frequency', label: '频率', unit: 'Hz', defaultValue: 1000, min: 0 },
    ],
  },
  ground: {
    type: 'ground',
    label: '地',
    prefix: 'G',
    accent: '#94a3b8',
    handles: [{ id: 'gnd', position: Position.Bottom, label: 'GND' }],
    parameters: [],
  },
  voltage_probe: {
    type: 'voltage_probe',
    label: '电压探针',
    prefix: 'VP',
    accent: '#34d399',
    handles: [{ id: 'node', position: Position.Right, label: '节点' }],
    parameters: [],
  },
  current_probe: {
    type: 'current_probe',
    label: '电流探针',
    prefix: 'IP',
    accent: '#f472b6',
    handles: [
      { id: 'p', position: Position.Left, label: 'p' },
      { id: 'n', position: Position.Right, label: 'n' },
    ],
    parameters: [],
  },
}

export const circuitComponentList = Object.values(circuitComponentLibrary)
