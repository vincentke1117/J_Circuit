# 智能启动后端（Windows）

为提升开发体验，提供一键智能启动脚本：`scripts/start_backend.ps1`。

脚本行为：
- 启动前自动检测指定端口是否被占用；
- 若占用，尝试终止占用进程（先 `Stop-Process`，失败再 `taskkill /F`）；
- 设置 `HOST`/`PORT` 环境变量；
- 启动 `start_backend.jl`（Julia 后端）。

## 使用示例

```powershell
# 默认端口 8080，自动清理占用并启动
./scripts/start_backend.ps1

# 指定端口与主机
./scripts/start_backend.ps1 -Port 8081 -Host 127.0.0.1

# 只检测不杀（调试用）
./scripts/start_backend.ps1 -Port 8080 -NoKill
```

## 注意事项

- 按端口杀进程可能终止与该端口无关的其它应用，请在开发环境谨慎使用。
- 需要拥有足够权限才能结束对应进程；若失败脚本会给出错误信息。
- 当前脚本针对 Windows PowerShell/PowerShell 7；跨平台可在后续迭代提供 Bash 版本。

## 参数说明

- `-Port <int>`：目标监听端口（默认取 `PORT` 环境变量或 `8080`）。
- `-Host <string>`：目标监听地址（默认取 `HOST` 环境变量或 `127.0.0.1`）。
- `-NoKill`：仅检测端口占用，不终止进程。

## 与后端配置的关系

`start_backend.jl` 支持通过环境变量覆盖监听地址与端口：

```powershell
$env:HOST = "127.0.0.1"
$env:PORT = 8081
julia .\start_backend.jl
```

脚本会自动为你设置上述环境变量，然后启动后端。