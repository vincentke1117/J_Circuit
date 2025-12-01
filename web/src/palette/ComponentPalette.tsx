import { useCallback } from 'react'
import type { DragEvent } from 'react'
import { Search, Grid, List } from 'lucide-react'

import { DND_COMPONENT_MIME, type CircuitComponentDefinition } from '@/circuit/components'
import { ComponentIcon } from '@/circuit/icons'

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

  // Group components by category (if we had categories, for now just a flat list)
  // We can infer categories from type prefix or definition
  
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
          <Grid className="w-4 h-4 text-blue-500" />
          Components
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search parts..." 
            className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        <div className="text-xs font-medium text-slate-500 px-2 py-2 uppercase tracking-wider">Basic</div>
        <div className="grid grid-cols-2 gap-2">
          {components.map((component) => (
            <div
              key={component.type}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:bg-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-grab active:cursor-grabbing group"
              draggable
              onDragStart={(event) => handleDragStart(event, component)}
            >
              <div 
                className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center mb-2 text-slate-400 group-hover:text-blue-400 transition-colors"
                style={{ color: component.accent }}
              >
                <ComponentIcon type={component.type} />
              </div>
              <span className="text-xs text-slate-400 font-medium group-hover:text-slate-200 transition-colors text-center">
                {component.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
