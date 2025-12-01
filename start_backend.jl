using Pkg
Pkg.activate(joinpath(@__DIR__, "server"))

include("server/src/JCircuitServer.jl")
using .JCircuitServer

# 可通过环境变量 HOST/PORT 覆盖默认地址与端口
host = get(ENV, "HOST", "127.0.0.1")
port = try
    parse(Int, get(ENV, "PORT", "8080"))
catch
    8080
end

println("Starting JCircuitServer on $(host):$(port)...")
result = JCircuitServer.bootstrap(host=host, port=port)
println("Server started on $(result.host):$(result.port)")
println("Press Ctrl+C to stop")

# 保持服务运行
try
    while true
        sleep(1)
    end
catch e
    if isa(e, InterruptException)
        println("\nShutting down server...")
    else
        rethrow(e)
    end
end
