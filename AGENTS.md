# J-Circuit Repository Agent Guide

## Scope
These instructions apply to the entire repository unless overridden by nested `AGENTS.md` files.

## General Workflow
- Follow the product requirements defined in `task.md` and the v1.2 PRD when implementing features.
- Keep the project split into a web front end (React 18 with React Flow and Plotly) and a Julia backend (HTTP.jl).
- Favor type-safe, declarative code and avoid silent failure paths. Surface validation errors explicitly in JSON responses as specified by the PRD.
- All electrical validation must occur both in frontend (buildSimulationPayload) and backend (simulate_payload) for defense in depth.

## Code Style

### Frontend (TypeScript)
- Use TypeScript with strict mode enabled; organize source under `web/src/` with feature-based folders:
  - `app/` - 主应用入口
  - `canvas/` - React Flow 自定义节点与可视化
  - `circuit/` - 元件定义库与图标
  - `palette/` - 元件拖拽面板
  - `panels/` - 属性检查面板
  - `simulation/` - 仿真控制、API 调用、payload 构建
  - `workspace/` - 画布工作区与项目导入导出
  - `types/` - TypeScript 类型定义
  - `utils/` - 工具函数（如元件 ID 生成）
- Use React hooks and functional components; avoid class components.
- Leverage `@xyflow/react` for circuit canvas; all nodes must be defined in `circuitNodeTypes`.
- Use CSS modules (`.module.css`) for styling to avoid global namespace pollution.
- Prefer explicit validation and error messages over silent failures.

### Backend (Julia)
- Use Julia modules under `server/src/` with clear separation:
  - Payload structs with `StructTypes.jl` for JSON deserialization
  - Validation functions that throw `ValidationError` with structured error data
  - Component instantiation in `instantiate_component` using ModelingToolkit pattern matching
  - Simulation logic in `simulate_payload` with comprehensive pre-checks
- Keep functions pure where possible; isolate side effects at the HTTP layer (`handle_simulate`).
- Use `@named` macro for all ModelingToolkit components to ensure traceable names.
- Always return standardized JSON: `{status, message, data}` envelope.
- Document exported functions with Julia docstrings.

## Architecture Patterns

### Frontend Data Flow
1. User drags component from palette → `CircuitWorkspace` handles drop → creates node with `nextComponentId`
2. User connects nodes → React Flow validates via `isValidConnection` → edge stored with handles
3. User clicks "Run Simulation" → `buildSimulationPayload` validates topology + parameters → sends to backend
4. Backend response → displayed in `SimulationResultPanel` via Plotly

### Component Rotation
- Rotation values are stored in `CircuitNodeData.rotation` (0/90/180/270 degrees).
- Handle positions are computed dynamically in `CircuitNode.tsx` using `rotatePosition`.
- Edge positions must be synchronized when rotation changes (see `handleRotationChange` in CircuitWorkspace).

### Network Topology
- Use `DisjointSet` data structure in `payload.ts` to merge connected handles into nets.
- Each net must have ≥2 terminals; exactly one net can be named "gnd" (ground reference).
- Backend uses `ModelingToolkit.connect` to equate all terminals in each net.

## Testing & Tooling

### Frontend
- **Linting**: `npm run lint` (ESLint with TypeScript plugin)
- **Type Checking**: `npm run typecheck` (tsc --noEmit)
- **Unit Tests**: `npm run test` (Vitest with @testing-library/react)
  - Test `buildSimulationPayload` with various topologies (see `payload.test.ts`)
  - Test UI interactions with user-event library
- **Dev Server**: `npm run dev` (Vite with HMR)

### Backend
- **Tests**: `julia --project=server -e 'using Pkg; Pkg.test()'`
  - Test `bootstrap` returns valid router configuration
  - Test `run_simulation` with sample RC circuit returns success
  - Test validation failures (missing ground, insufficient nets, etc.)
- **Local Server**: `julia --project=server -e 'using JCircuitServer; bootstrap()'`
  - Listens on `0.0.0.0:8080` by default
  - CORS enabled for development

## PR & Commit Guidance
- Keep commits focused and reference the related checklist items from `task.md`.
- Update documentation (`README.md`, `AGENTS.md`) whenever behavior or commands change.
- Before submitting a PR, run `npm run test` and `julia --project=server -e 'using Pkg; Pkg.test()'` and include status.
- Use descriptive commit messages following conventional commits (e.g., `feat:`, `fix:`, `docs:`).

## UX & Validation Rules

### Canvas Interactions
- All connections must specify both `sourceHandle` and `targetHandle` (enforced at export time).
- Self-connections (source === target) are blocked via `isValidConnection`.
- Ground node is required before simulation can run (enforced via `hasGround` check).
- Dangling terminals (未连接端子) cause validation errors in `buildSimulationPayload`.

### Simulation Constraints
- Must have exactly one ground (`ground` component).
- Must have at least one voltage source (`vsource_dc` or `vsource_ac`).
- All component parameters must be finite numbers ≥ min value (if specified).
- Simulation settings: `tStop > 0`, `nSamples ≥ 2` (integer).

### Error Handling
- Frontend validation errors appear in workspace message bar (red for errors, blue for info).
- Backend validation errors return `{status: "error", message: "...", data: {...}}` with structured details.
- Network errors display user-friendly messages (e.g., "无法连接后端服务：请确认 Julia 服务正在运行").

## Project File Format

### Export Format (JSON)
```json
{
  "nodes": [
    {
      "id": "R1",
      "type": "resistor",
      "position": {"x": 100, "y": 200},
      "data": {
        "label": "R1",
        "type": "resistor",
        "parameters": {"value": 1000},
        "rotation": 0
      }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "V1",
      "target": "R1",
      "sourceHandle": "pos",
      "targetHandle": "p"
    }
  ]
}
```

### Import Validation
- Must have `nodes` and `edges` arrays.
- Each node must have valid `type` matching `circuitComponentLibrary`.
- Component IDs are rebuilt from loaded nodes via `rebuildCountersFromNodes`.

## Component Library

Supported components (defined in `web/src/circuit/components.ts` and `server/src/JCircuitServer.jl`):

| Type | Frontend Label | Handles | Parameters |
|------|---------------|---------|------------|
| `resistor` | 电阻 | p, n | value (Ω) |
| `capacitor` | 电容 | p, n | value (F) |
| `inductor` | 电感 | p, n | value (H) |
| `vsource_dc` | 直流电压源 | pos, neg | dc (V) |
| `vsource_ac` | 交流电压源 | pos, neg | amplitude (V), frequency (Hz) |
| `ground` | 地 | gnd | (none) |
| `voltage_probe` | 电压探针 | node | (none) |
| `current_probe` | 电流探针 | p, n | (none) |

**Note**: Both frontend and backend must stay synchronized on component schemas. Changes to handles or parameters require updates in both codebases.

