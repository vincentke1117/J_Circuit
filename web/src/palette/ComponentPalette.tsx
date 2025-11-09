import { useCallback } from 'react'
import type { DragEvent } from 'react'

import { DND_COMPONENT_MIME, type CircuitComponentDefinition } from '@/circuit/components'

import styles from './ComponentPalette.module.css'

export interface ComponentPaletteProps {
  components: CircuitComponentDefinition[]
}

export function ComponentPalette({ components }: ComponentPaletteProps) {
  const handleDragStart = useCallback((event: DragEvent<HTMLDivElement>, component: CircuitComponentDefinition) => {
    event.dataTransfer.setData(
      DND_COMPONENT_MIME,
      JSON.stringify({ type: component.type }),
    )
    event.dataTransfer.effectAllowed = 'copy'
  }, [])

  return (
    <aside className={styles.palette}>
      <div className={styles.title}>元件库</div>
      <div className={styles.grid}>
        {components.map((component) => (
          <div
            key={component.type}
            className={styles.item}
            data-accent
            style={{ ['--accent-color' as string]: component.accent }}
            draggable
            onDragStart={(event) => handleDragStart(event, component)}
          >
            {component.label}
          </div>
        ))}
      </div>
    </aside>
  )
}
