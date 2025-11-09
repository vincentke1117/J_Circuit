# J-Circuit

J-Circuit 是一个基于 React 与 Julia 的交互式电路仿真平台。根据 [v1.2 PRD](./task.md) 的要求，本仓库拆分为前端 `web/` 与后端 `server/` 两个子工程，分别负责电路绘制/交互以及仿真求解。

## 仓库结构

```text
J_Circuit/
├─ AGENTS.md            # 仓库级开发规范
├─ README.md            # 项目总览（本文）
├─ task.md              # v1.2 交付清单
├─ web/                 # React 18 + TypeScript 前端
└─ server/              # Julia HTTP 仿真后端
```

## 前端 (`web/`)

前端使用 Vite + React 18 + TypeScript，并内置 React Flow 与 Plotly。主要脚本如下：

```bash
cd web
npm install
npm run dev        # 启动本地开发服务器
npm run build      # 产出生产构建
npm run lint       # ESLint 静态检查
npm run typecheck  # TypeScript 类型检查
npm run test       # Vitest 单元测试
```

当前实现提供：

- 元件库拖拽与带端子的自定义节点，满足 PRD 规定的连接约束；
- 项目导入/导出（`nodes[]` + `edges[]` JSON），并自动维护元件编号；
- 仿真参数面板 + `POST /simulate` 请求封装，含前端校验与错误提示；
- Plotly 多波形展示面板，支持仿真中状态提示与错误回显；
- `buildSimulationPayload` 等纯函数单元测试，覆盖典型拓扑与异常场景。

## 后端 (`server/`)

后端基于 HTTP.jl + ModelingToolkitStandardLibrary + DifferentialEquations 实现瞬态仿真：

- `POST /simulate` 路由解析组件/网络 JSON，执行参数校验与建模；
- 支持 RLC、直流/正弦电压源、地、以及电压/电流探针；
- 统一返回格式：`status`/`message`/`data{time, signals[]}`；
- 测试覆盖成功仿真与常见校验错误，可通过 `Pkg.test()` 运行。

安装依赖并执行测试：

```bash
julia --project=server -e 'using Pkg; Pkg.instantiate(); Pkg.test()'
```

本地启动服务：

```bash
julia --project=server -e 'using JCircuitServer; bootstrap()'
```

默认监听 `0.0.0.0:8080`，如需仅构建路由可调用 `bootstrap(start=false)`。

## 开发须知

- 详细的开发规范、风格与交付要求请参见 [`AGENTS.md`](./AGENTS.md)。
- 具体迭代步骤与验收项列于 [`task.md`](./task.md)，实现功能时请同步更新状态。

欢迎根据 PRD 持续迭代，实现完整的电路绘制、仿真与波形展示体验。
