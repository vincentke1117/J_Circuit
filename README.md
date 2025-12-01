# J-Circuit

J-Circuit 是一个基于 React 与 Julia 的交互式电路仿真平台。根据 [v1.2 PRD](./task.md) 的要求，本仓库拆分为前端 `web/` 与后端 `server/` 两个子工程，分别负责电路绘制/交互以及仿真求解。

## 核心特性

- **可视化电路绘制**：基于 React Flow 的拖拽式电路编辑器，支持元件旋转、连线重连、端口约束
- **实时参数配置**：属性检查面板支持动态修改元件参数（电阻、电容、电感、电压源等）
- **瞬态仿真**：Julia 后端使用 ModelingToolkit + DifferentialEquations 求解电路微分方程
- **多信号波形展示**：Plotly 交互式图表，支持多探针信号同时显示、缩放、图例切换
- **项目导入导出**：JSON 格式保存/加载电路拓扑与参数，支持版本控制与协作
- **前后端校验**：双层验证机制确保电路合法性（地线检查、端子连接、参数范围等）

## 仓库结构

```text
J_Circuit/
├─ AGENTS.md            # 仓库级开发规范
├─ README.md            # 项目总览（本文）
├─ task.md              # v1.2 交付清单
├─ web/                 # React 18 + TypeScript 前端
│  ├─ src/
│  │  ├─ app/           # 应用入口与主布局
│  │  ├─ canvas/        # 自定义电路节点组件
│  │  ├─ circuit/       # 元件库定义与 SVG 图标
│  │  ├─ palette/       # 元件拖拽面板
│  │  ├─ panels/        # 属性检查面板
│  │  ├─ simulation/    # 仿真控制、API 封装、payload 构建
│  │  ├─ workspace/     # 画布工作区与项目工具栏
│  │  ├─ types/         # TypeScript 类型定义
│  │  └─ utils/         # 工具函数（ID 生成、辅助函数）
│  ├─ package.json      # npm 依赖与脚本
│  └─ vite.config.ts    # Vite 构建配置
└─ server/              # Julia HTTP 仿真后端
   ├─ src/JCircuitServer.jl  # 主模块：路由、仿真、建模
   ├─ test/runtests.jl       # 单元测试
   └─ Project.toml           # Julia 依赖清单
```

## 前端 (`web/`)

### 技术栈

- **React 18** + **TypeScript**：类型安全的组件开发
- **Vite**：快速的开发服务器与构建工具
- **@xyflow/react (React Flow)**：节点图编辑器，提供拖拽、缩放、连线等能力
- **Plotly.js**：高性能交互式波形图表
- **Vitest**：单元测试框架，支持 React Testing Library

### 安装与运行

```bash
cd web
npm install          # 安装依赖
npm run dev          # 启动开发服务器（默认 http://localhost:5173）
npm run build        # 生产构建
npm run lint         # ESLint 静态检查
npm run typecheck    # TypeScript 类型检查
npm run test         # Vitest 单元测试
```

### 功能模块

#### 1. 电路编辑器 (`CircuitWorkspace`)

- **元件拖拽**：从左侧面板拖拽元件（电阻、电容、电感、电源、地、探针）到画布
- **端口连接**：React Flow 自动处理连线，连线必须指定 `sourceHandle` 和 `targetHandle`
- **旋转功能**：在属性面板中设置元件旋转角度（0°/90°/180°/270°），端口位置自动跟随
- **选择与编辑**：点击元件查看/修改参数，支持实时更新
- **连线重连**：拖拽连线端点可重新连接到其他端口

#### 2. 元件库 (`circuitComponentLibrary`)

定义在 `web/src/circuit/components.ts`，包含：

| 元件类型 | 标识 | 端口 | 参数 |
|---------|------|------|------|
| 电阻 (resistor) | R | p, n | 阻值 (Ω) |
| 电容 (capacitor) | C | p, n | 电容值 (F) |
| 电感 (inductor) | L | p, n | 电感值 (H) |
| 直流电压源 (vsource_dc) | V | pos, neg | 电压 (V) |
| 交流电压源 (vsource_ac) | VAC | pos, neg | 幅值 (V), 频率 (Hz) |
| 地 (ground) | G | gnd | 无 |
| 电压探针 (voltage_probe) | VP | node | 无 |
| 电流探针 (current_probe) | IP | p, n | 无 |

#### 3. 仿真控制 (`SimulationControls`)

- **仿真时长** (`tStop`)：设置仿真终止时间（秒）
- **采样点数** (`nSamples`)：控制输出时间序列的分辨率
- **运行按钮**：触发前端验证 → 构建 payload → 发送 POST 请求到 `/simulate`
- **前端校验**：检查地线存在、电源存在、端子连接、参数有效性等

#### 4. 仿真结果展示 (`SimulationResultPanel`)

- **Plotly 多信号图表**：每个探针对应一条曲线，支持图例切换、缩放、导出 PNG
- **错误提示**：显示后端返回的校验错误或网络错误
- **状态管理**：仿真中、成功、失败三种状态的 UI 反馈

#### 5. 项目导入导出 (`ProjectToolbar`)

- **导出** (`buildProjectSnapshot`)：
  - 验证所有连线包含端口信息（否则提示错误）
  - 生成 JSON 格式文件：`{nodes: [...], edges: [...]}`
  - 自动命名为 `jcircuit-YYYY-MM-DDTHH-MM-SS.json`
- **导入** (`loadProjectFromObject`)：
  - 解析 JSON 并校验结构（nodes/edges 数组、元件类型合法性）
  - 重建元件 ID 计数器，恢复画布状态
  - 自动适配视口 (`reactFlow.fitView`)

### 前端架构要点

- **类型安全**：所有 payload 和响应类型定义在 `types/circuit.ts`
- **纯函数测试**：`buildSimulationPayload` 使用 `DisjointSet` 算法构建网络拓扑，含完整单元测试
- **错误处理**：网络错误、校验错误、后端错误均有用户友好的中文提示
- **组件 ID 管理**：使用 `nextComponentId` 保证同类型元件编号连续（R1, R2, ...）

## 后端 (`server/`)

### 技术栈

- **Julia 1.10+**：高性能科学计算语言
- **HTTP.jl**：轻量级 HTTP 服务器
- **JSON3.jl**：高效 JSON 序列化/反序列化
- **ModelingToolkit.jl**：符号建模与模型转换
- **ModelingToolkitStandardLibrary.jl**：标准电路元件库
- **DifferentialEquations.jl**：微分方程求解器（使用 Rodas5 刚性求解器）

### 安装与运行

```bash
# 安装依赖
julia --project=server -e 'using Pkg; Pkg.instantiate()'

# 运行测试
julia --project=server -e 'using Pkg; Pkg.test()'

# 启动服务（监听 0.0.0.0:8080）
julia --project=server -e 'using JCircuitServer; bootstrap()'

# 仅构建路由不启动（用于测试）
julia --project=server -e 'using JCircuitServer; bootstrap(start=false)'
```

### API 接口

#### POST `/simulate`

**请求格式** (`SimulationPayload`)：

```json
{
  "components": [
    {
      "id": "V1",
      "type": "vsource_dc",
      "parameters": {"dc": 5.0},
      "connections": {"pos": "n1", "neg": "gnd"}
    },
    {
      "id": "R1",
      "type": "resistor",
      "parameters": {"value": 1000.0},
      "connections": {"p": "n1", "n": "gnd"}
    },
    {
      "id": "G1",
      "type": "ground",
      "parameters": {},
      "connections": {"gnd": "gnd"}
    },
    {
      "id": "VP1",
      "type": "voltage_probe",
      "parameters": {},
      "connections": {"node": "n1"}
    }
  ],
  "nets": [
    {"name": "n1", "nodes": [["V1", "pos"], ["R1", "p"], ["VP1", "node"]]},
    {"name": "gnd", "nodes": [["V1", "neg"], ["R1", "n"], ["G1", "gnd"]]}
  ],
  "sim": {
    "t_stop": 0.001,
    "n_samples": 100
  }
}
```

**成功响应** (`status: "ok"`)：

```json
{
  "status": "ok",
  "message": "simulation done",
  "data": {
    "time": [0.0, 1e-5, 2e-5, ..., 0.001],
    "signals": [
      {
        "id": "VP1",
        "label": "Voltage at n1",
        "values": [0.0, 0.5, 1.2, ..., 5.0]
      }
    ]
  }
}
```

**错误响应** (`status: "error"`)：

```json
{
  "status": "error",
  "message": "circuit has no ground",
  "data": {"missing": ["ground"]}
}
```

### 后端核心逻辑

#### 1. Payload 解析与验证 (`simulate_payload`)

- 检查仿真参数：`t_stop > 0`, `n_samples > 1`
- 检查必需元件：必须包含 `ground` 和至少一个电压源
- 检查网络连接：每个网络至少 2 个端子
- 检查组件参数：所有参数必须存在且符合 schema

#### 2. 组件实例化 (`instantiate_component`)

使用 pattern matching 根据 `component.type` 创建 ModelingToolkit 组件：

- **被动元件**：`Electrical.Resistor`, `Electrical.Capacitor`, `Electrical.Inductor`
- **电压源**：`Electrical.Voltage` + `Blocks.Constant` (DC) 或 `Blocks.Sine` (AC)
- **地**：`Electrical.Ground`
- **探针**：`Electrical.PotentialSensor` (电压) 或 `Electrical.CurrentSensor` (电流)

每个组件返回：
- `system`：主系统对象
- `handles`：端口映射表（用于连接）
- `extra_systems`：辅助系统（如驱动器）
- `extra_equations`：额外约束方程
- `measurement`：探针测量表达式

#### 3. 网络连接 (`ModelingToolkit.connect`)

遍历 `nets` 数组，将同一网络中的所有端口使用 `connect` 函数连接（生成电位相等的约束方程）。

#### 4. 符号简化与求解

```julia
@named circuit = ODESystem(connections, t, [], []; systems = systems)
simplified = structural_simplify(circuit)  # 索引降低、代数消元
prob = ODEProblem(simplified, u0, tspan, p)
sol = solve(prob, Rodas5(); saveat)  # 刚性求解器
```

#### 5. 结果提取

从 `sol` 对象中提取时间序列和探针信号值，返回标准化的 JSON 响应。

### 错误处理

- **ValidationError**：自定义异常类型，包含 `message` 和结构化 `data`
- **内部错误**：捕获所有未预期异常，记录日志并返回 `"internal error"`
- **CORS 支持**：响应头包含 `Access-Control-Allow-Origin: *`，支持跨域开发

## 开发工作流

### 1. 本地开发

```bash
# 终端 1：启动 Julia 后端
cd server
julia --project=. -e 'using JCircuitServer; bootstrap()'

# 终端 2：启动 Vite 前端
cd web
npm run dev
```

前端默认监听 `http://localhost:5173`，通过 `VITE_API_BASE_URL` 环境变量可指定后端地址（默认 `http://localhost:8080`）。

### 2. 运行测试

```bash
# 前端测试
cd web
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run test       # Vitest 单元测试

# 后端测试
cd server
julia --project=. -e 'using Pkg; Pkg.test()'
```

### 3. 添加新元件

需要同步修改前后端：

**前端**（`web/src/circuit/components.ts`）：
```typescript
export const circuitComponentLibrary = {
  // ...
  my_component: {
    type: 'my_component',
    label: '我的元件',
    prefix: 'MC',
    accent: '#ff5733',
    handles: [
      { id: 'in', position: Position.Left, label: '输入' },
      { id: 'out', position: Position.Right, label: '输出' },
    ],
    parameters: [
      { key: 'gain', label: '增益', defaultValue: 1.0, min: 0 },
    ],
  },
}
```

**前端图标**（`web/src/circuit/icons.tsx`）：
```typescript
export function ComponentIcon({ type, size }: ComponentIconProps) {
  // ...
  if (type === 'my_component') return <MyComponentSVG size={size} />
}
```

**后端 schema**（`server/src/JCircuitServer.jl`）：
```julia
const COMPONENT_SCHEMAS = Dict(
    # ...
    "my_component" => (; handles = ["in", "out"], params = ["gain"]),
)
```

**后端实例化**（`server/src/JCircuitServer.jl`）：
```julia
function instantiate_component(component::ComponentPayload)
    # ...
    if component.type == "my_component"
        gain = require_parameter(component, "gain")
        # 使用 ModelingToolkit 组件库或自定义
        MyComponent(; name, gain)
    end
end
```

## 开发须知

- **详细开发规范**：参见 [`AGENTS.md`](./AGENTS.md)（包含代码风格、架构模式、测试要求）
- **任务清单**：参见 [`task.md`](./task.md)（v1.2 版本交付项与完成状态）
- **贡献指南**：提交 PR 前请运行所有测试并更新相关文档

## 已知限制

- 仅支持瞬态仿真（transient analysis），暂不支持 AC 分析或 DC 工作点
- 旋转功能仅支持 90° 步进（0°/90°/180°/270°）
- 探针数量无硬性限制，但过多信号可能影响图表性能
- 后端求解器固定为 Rodas5，暂不支持用户选择算法

## 许可证

本项目为教学/原型项目，尚未明确开源许可证。如需商用或二次开发，请联系项目作者。

---

欢迎根据 PRD 持续迭代，实现完整的电路绘制、仿真与波形展示体验！
