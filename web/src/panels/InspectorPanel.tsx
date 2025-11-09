import { useMemo } from 'react'

import type { CircuitComponentDefinition } from '@/circuit/components'
import type { CircuitNodeData } from '@/types/circuit'

import styles from './InspectorPanel.module.css'

export interface InspectorPanelProps {
  node: CircuitNodeData | null
  definition: CircuitComponentDefinition | null
  onParameterChange: (key: string, value: number) => void
}

export function InspectorPanel({ node, definition, onParameterChange }: InspectorPanelProps) {
  const hasParameters = useMemo(() => Boolean(definition?.parameters.length), [definition])

  return (
    <aside className={styles.panel}>
      <div className={styles.title}>属性</div>
      {!node || !definition ? (
        <div className={styles.empty}>选择一个元件以编辑参数</div>
      ) : !hasParameters ? (
        <div className={styles.caption}>当前元件暂无可配置参数。</div>
      ) : (
        <div className={styles.fieldGroup}>
          {definition.parameters.map((parameter) => {
            const value = node.parameters[parameter.key] ?? parameter.defaultValue ?? 0
            return (
              <label key={parameter.key} className={styles.field}>
                <span>
                  {parameter.label}
                  {parameter.unit ? <span className={styles.unitHint}>（{parameter.unit}）</span> : null}
                </span>
                <input
                  className={styles.input}
                  type="number"
                  min={parameter.min}
                  value={value}
                  onChange={(event) => onParameterChange(parameter.key, Number(event.target.value))}
                />
              </label>
            )
          })}
        </div>
      )}
    </aside>
  )
}
