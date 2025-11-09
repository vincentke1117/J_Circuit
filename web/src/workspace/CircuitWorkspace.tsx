import {
  Background,
  Connection,
  ConnectionMode,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react'

import {
  DND_COMPONENT_MIME,
  circuitComponentLibrary,
  circuitComponentList,
  type CircuitComponentDefinition,
  type CircuitComponentType,
} from '@/circuit/components'
import type { CircuitNodeData, SimulationData, SimulationSettings } from '@/types/circuit'
import { nextComponentId, rebuildCountersFromNodes } from '@/utils/id'
import { ComponentPalette } from '@/palette/ComponentPalette'
import { InspectorPanel } from '@/panels/InspectorPanel'
import { SimulationControls } from '@/simulation/SimulationControls'
import { SimulationResultPanel } from '@/simulation/SimulationResultPanel'
import { circuitNodeTypes } from '@/canvas/nodeTypes'
import { buildSimulationPayload } from '@/simulation/payload'
import { runSimulationRequest } from '@/simulation/api'
import { buildProjectSnapshot, loadProjectFromObject } from './project'
import { ProjectToolbar } from './ProjectToolbar'

import styles from './CircuitWorkspace.module.css'

interface DragPayload {
  type: CircuitComponentType
}

const initialSimulationSettings: SimulationSettings = {
  tStop: 1e-3,
  nSamples: 1000,
}

function createNodeData(definition: CircuitComponentDefinition): CircuitNodeData {
  const parameters = definition.parameters.reduce<Record<string, number>>((acc, parameter) => {
    if (typeof parameter.defaultValue === 'number') {
      acc[parameter.key] = parameter.defaultValue
    }
    return acc
  }, {})

  return {
    label: definition.prefix,
    type: definition.type,
    parameters,
  }
}

function CircuitWorkspaceInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CircuitNodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>(initialSimulationSettings)
  const [simulationResult, setSimulationResult] = useState<SimulationData | null>(null)
  const [simulationError, setSimulationError] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [workspaceMessage, setWorkspaceMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const idCountersRef = useRef<Record<string, number>>({})
  const reactFlow = useReactFlow<CircuitNodeData>()

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const payloadRaw = event.dataTransfer.getData(DND_COMPONENT_MIME)
      if (!payloadRaw) return

      const payload: DragPayload = JSON.parse(payloadRaw)
      const definition = circuitComponentLibrary[payload.type]
      if (!definition) return

      const bounds = event.currentTarget.getBoundingClientRect()
      const projected = reactFlow.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      setNodes((currentNodes) => {
        const { id, nextCounters } = nextComponentId(idCountersRef.current, definition)
        idCountersRef.current = nextCounters

        const node: Node<CircuitNodeData> = {
          id,
          type: definition.type,
          position: projected,
          data: {
            ...createNodeData(definition),
            label: id,
          },
        }

        return currentNodes.concat(node)
      })
    },
    [reactFlow, setNodes],
  )

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      if (connection.source === connection.target) return

      setEdges((eds) => addEdge(connection, eds))
    },
    [setEdges],
  )

  const isValidConnection = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return false
    if (connection.source === connection.target) return false
    return true
  }, [])

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId])
  const selectedDefinition = selectedNode ? circuitComponentLibrary[selectedNode.type] : null

  const handleParameterChange = useCallback(
    (key: string, value: number) => {
      if (!selectedNodeId) return
      setNodes((current) =>
        current.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  parameters: {
                    ...node.data.parameters,
                    [key]: value,
                  },
                },
              }
            : node,
        ),
      )
    },
    [selectedNodeId, setNodes],
  )

  const handleSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node<CircuitNodeData>[] }) => {
    setSelectedNodeId(selectedNodes[0]?.id ?? null)
  }, [])

  const handleSimulationSettingsChange = useCallback((settings: SimulationSettings) => {
    setSimulationSettings(settings)
  }, [])

  const hasGround = useMemo(() => nodes.some((node) => node.type === 'ground'), [nodes])
  const canExport = nodes.length > 0

  const handleExportProject = useCallback(() => {
    const snapshot = buildProjectSnapshot(reactFlow.getNodes(), reactFlow.getEdges())
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `jcircuit-${new Date().toISOString().replace(/[.:]/g, '-')}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setWorkspaceMessage({ tone: 'info', text: '项目已导出' })
  }, [reactFlow])

  const handleImportProject = useCallback(
    async (content: string) => {
      setWorkspaceMessage(null)
      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        setWorkspaceMessage({ tone: 'error', text: '导入失败：JSON 格式错误' })
        return
      }

      const result = loadProjectFromObject(parsed)
      if (!result.ok || !result.nodes || !result.edges) {
        const message = result.errors.join('；') || '导入失败：项目结构无效'
        setWorkspaceMessage({ tone: 'error', text: message })
        return
      }

      setNodes(result.nodes)
      setEdges(result.edges)
      idCountersRef.current = rebuildCountersFromNodes(result.nodes)
      setSelectedNodeId(null)
      setSimulationResult(null)
      setSimulationError(null)
      setWorkspaceMessage({ tone: 'info', text: '项目导入成功' })

      setTimeout(() => {
        try {
          reactFlow.fitView({ padding: 0.2 })
        } catch {
          // ignore viewport fit errors
        }
      }, 50)
    },
    [reactFlow, setEdges, setNodes],
  )

  const handleImportError = useCallback((message: string) => {
    setWorkspaceMessage({ tone: 'error', text: message })
  }, [])

  const handleRunSimulation = useCallback(async () => {
    const currentNodes = reactFlow.getNodes()
    const currentEdges = reactFlow.getEdges()
    const build = buildSimulationPayload(currentNodes, currentEdges, simulationSettings)

    if (!build.ok || !build.payload) {
      setSimulationResult(null)
      setSimulationError(build.errors.join('；'))
      return
    }

    setIsSimulating(true)
    setSimulationError(null)
    try {
      const response = await runSimulationRequest(build.payload)
      if (response.status === 'ok') {
        setSimulationResult(response.data)
        setSimulationError(null)
      } else {
        const detail = response.data ? `（详情：${JSON.stringify(response.data)}）` : ''
        setSimulationResult(null)
        setSimulationError(`${response.message}${detail}`)
      }
    } catch (error) {
      setSimulationResult(null)
      setSimulationError(error instanceof Error ? error.message : '仿真请求失败')
    } finally {
      setIsSimulating(false)
    }
  }, [reactFlow, simulationSettings])

  return (
    <div className={styles.workspace}>
      <ComponentPalette components={circuitComponentList} />
      <div className={styles.canvasArea}>
        <div className={styles.toolbarRow}>
          <ProjectToolbar
            onExport={handleExportProject}
            onImport={handleImportProject}
            onImportError={handleImportError}
            canExport={canExport}
          />
          {workspaceMessage ? (
            <div
              className={`${styles.message} ${workspaceMessage.tone === 'error' ? styles.messageError : styles.messageInfo}`}
            >
              {workspaceMessage.text}
            </div>
          ) : null}
        </div>
        <div className={styles.canvasContainer}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            nodeTypes={circuitNodeTypes}
            connectionMode={ConnectionMode.Strict}
            isValidConnection={isValidConnection}
            onSelectionChange={handleSelectionChange}
            fitView
            minZoom={0.25}
            maxZoom={1.5}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Background gap={16} />
            <Controls position="top-right" />
          </ReactFlow>
        </div>
        <SimulationControls
          settings={simulationSettings}
          onChange={handleSimulationSettingsChange}
          onRun={handleRunSimulation}
          disabled={!hasGround}
          isRunning={isSimulating}
        />
        <div className={styles.resultsSection}>
          <SimulationResultPanel result={simulationResult} error={simulationError} isRunning={isSimulating} />
        </div>
      </div>
      <InspectorPanel
        node={selectedNode?.data ?? null}
        definition={selectedDefinition ?? null}
        onParameterChange={handleParameterChange}
      />
    </div>
  )
}

export function CircuitWorkspace() {
  return (
    <ReactFlowProvider>
      <CircuitWorkspaceInner />
    </ReactFlowProvider>
  )
}
