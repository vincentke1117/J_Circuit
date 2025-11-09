import { Handle } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { memo, useMemo } from 'react'

import type { CircuitComponentDefinition } from '@/circuit/components'
import { circuitComponentLibrary } from '@/circuit/components'
import type { CircuitNodeData } from '@/types/circuit'

import styles from './CircuitNode.module.css'

function formatParameter(definition: CircuitComponentDefinition, data: CircuitNodeData) {
  if (!definition.parameters.length) {
    return ''
  }

  const firstParam = definition.parameters[0]
  const value = data.parameters[firstParam.key]
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}${firstParam.unit ?? ''}`
  }
  return ''
}

const CircuitNode = memo(({ type, data }: NodeProps<CircuitNodeData>) => {
  const definition = useMemo(() => circuitComponentLibrary[type as keyof typeof circuitComponentLibrary], [type])

  if (!definition) {
    return null
  }

  return (
    <div className={styles.node} style={{ ['--node-accent' as string]: definition.accent }}>
      <div className={styles.title}>
        <span>{data.label}</span>
        <span>{formatParameter(definition, data)}</span>
      </div>
      {definition.parameters.length > 1 ? (
        <div className={styles.parameters}>
          {definition.parameters.map((parameter) => {
            const value = data.parameters[parameter.key]
            return (
              <div key={parameter.key} className={styles.parameterRow}>
                <span>{parameter.label}</span>
                <span>
                  {typeof value === 'number' && Number.isFinite(value) ? value : '—'}
                  {parameter.unit ? <span className={styles.parameterUnit}> {parameter.unit}</span> : null}
                </span>
              </div>
            )
          })}
        </div>
      ) : null}
      {definition.handles.map((handle) => (
        <div key={handle.id} className={styles.handleWrapper}>
          <Handle
            id={handle.id}
            type="source"
            position={handle.position}
            isConnectableStart
            isConnectableEnd
            style={{ background: definition.accent }}
          />
          {handle.label ? <span className={styles.handleLabel}>{handle.label}</span> : null}
        </div>
      ))}
    </div>
  )
})

CircuitNode.displayName = 'CircuitNode'

export default CircuitNode
