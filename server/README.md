# JCircuitServer

Julia 端将负责接收前端生成的电路 JSON，利用 ModelingToolkit 与 DifferentialEquations 完成瞬态仿真。目前仅搭建了基础包结构与 `bootstrap` 占位函数，后续迭代将补充：

- `POST /simulate` 路由与请求体验证；
- 电气元件与网络的建模、求解逻辑；
- 成功/失败时的统一 JSON 响应；
- 单元测试与契约测试。

运行测试：

```bash
julia --project=server -e 'using Pkg; Pkg.test()'
```
