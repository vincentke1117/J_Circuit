# J-Circuit Web 前端

J-Circuit 前端基于 React 18、TypeScript 与 React Flow 构建，用于提供电路绘制、参数管理与仿真可视化界面。本目录由 Vite 驱动，支持快速开发与热更新。

## 快速开始

```bash
npm install
npm run dev
```

- 开发服务器默认运行在 `http://localhost:5173/`；
- 拖拽左侧元件库中的元件即可在画布中生成自定义节点；
- 选中元件后可在右侧属性面板调整参数，底部面板可设置仿真时长与采样点数；
- 若电路中尚未包含地 (Ground)，“运行仿真”按钮会自动禁用，并在运行前进行额外校验；
- 可通过工具栏导入/导出当前工程（`nodes[]` + `edges[]` JSON）。

## 可用脚本

| 命令                | 说明                     |
| ------------------- | ------------------------ |
| `npm run dev`       | 启动开发服务器           |
| `npm run build`     | 产出生产构建             |
| `npm run lint`      | ESLint 代码质量检查      |
| `npm run typecheck` | TypeScript 类型检查      |
| `npm run test`      | 使用 Vitest 运行单元测试 |

## 目录结构

```text
web/
├─ index.html
├─ package.json
├─ src/
│  ├─ app/                # 应用框架与入口
│  ├─ canvas/             # React Flow 自定义节点实现
│  ├─ circuit/            # 元件库与拖拽常量
│  ├─ palette/            # 左侧元件面板
│  ├─ panels/             # 属性面板
│  ├─ simulation/         # 仿真参数、API 与结果面板
│  ├─ types/              # 共享 TypeScript 类型
│  └─ workspace/          # 画布布局、项目导入导出与状态管理
└─ vitest.setup.ts
```

## 已实现功能

- 画布连线规则校验（禁止自连、缺少端子提示、地线检测）；
- 将画布状态转换为统一仿真载荷 JSON，包含组件参数与网络拓扑；
- 集成 `POST /simulate` 调用，支持仿真中/失败时的 UI 提示；
- Plotly.js 多波形可视化，支持同时显示多个探针信号；
- Vitest 单元测试覆盖载荷构建与异常分支。
