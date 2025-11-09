module JCircuitServer

using HTTP
using JSON3
using StructTypes
using ModelingToolkit
using ModelingToolkitStandardLibrary.Electrical
using ModelingToolkitStandardLibrary.Blocks
using DifferentialEquations

export bootstrap, run_simulation, SimulationPayload

struct SimulationSettings
    t_stop::Float64
    n_samples::Int
end
StructTypes.StructType(::Type{SimulationSettings}) = StructTypes.Struct()

struct ComponentPayload
    id::String
    type::String
    parameters::Dict{String, Float64}
    connections::Dict{String, String}
end
StructTypes.StructType(::Type{ComponentPayload}) = StructTypes.Struct()

struct NetPayload
    name::String
    nodes::Vector{Vector{String}}
end
StructTypes.StructType(::Type{NetPayload}) = StructTypes.Struct()

struct SimulationPayload
    components::Vector{ComponentPayload}
    nets::Vector{NetPayload}
    sim::SimulationSettings
end
StructTypes.StructType(::Type{SimulationPayload}) = StructTypes.Struct()

struct ValidationError <: Exception
    message::String
    data::Dict{String, Any}
end
Base.showerror(io::IO, err::ValidationError) = print(io, err.message)

const COMPONENT_SCHEMAS = Dict(
    "resistor" => (; handles = ["p", "n"], params = ["value"]),
    "capacitor" => (; handles = ["p", "n"], params = ["value"]),
    "inductor" => (; handles = ["p", "n"], params = ["value"]),
    "vsource_dc" => (; handles = ["pos", "neg"], params = ["dc"]),
    "vsource_ac" => (; handles = ["pos", "neg"], params = ["amplitude", "frequency"]),
    "ground" => (; handles = ["gnd"], params = String[]),
    "voltage_probe" => (; handles = ["node"], params = String[]),
    "current_probe" => (; handles = ["p", "n"], params = String[]),
)

const RESPONSE_HEADERS = Dict(
    "Content-Type" => "application/json",
    "Access-Control-Allow-Origin" => "*",
    "Access-Control-Allow-Headers" => "Content-Type",
    "Access-Control-Allow-Methods" => "POST, OPTIONS",
)

function require_parameter(component::ComponentPayload, key::String)
    haskey(component.parameters, key) ||
        throw(ValidationError("缺少元件参数 $(key)", Dict("component" => component.id, "parameter" => key)))
    return Float64(component.parameters[key])
end

function require_connections(component::ComponentPayload, handles::Vector{String})
    for handle in handles
        haskey(component.connections, handle) ||
            throw(ValidationError("端子未连接", Dict("component" => component.id, "handle" => handle)))
    end
end

function parse_net_nodes(net::NetPayload)
    nodes = Tuple{String, String}[]
    for pair in net.nodes
        length(pair) == 2 ||
            throw(ValidationError("网络节点必须包含元件与端子", Dict("net" => net.name)))
        push!(nodes, (pair[1], pair[2]))
    end
    return nodes
end

function instantiate_component(component::ComponentPayload)
    name = Symbol(component.id)
    handles = Dict{String, Any}()
    extra_systems = ODESystem[]
    extra_equations = Equation[]
    measurement = nothing

    schema = get(COMPONENT_SCHEMAS, component.type, nothing)
    schema === nothing &&
        throw(ValidationError("暂不支持的元件类型", Dict("component" => component.id, "type" => component.type)))

    require_connections(component, schema.handles)

    system = begin
        if component.type == "resistor"
            R = require_parameter(component, "value")
            Electrical.Resistor(; name, R = R)
        elseif component.type == "capacitor"
            C = require_parameter(component, "value")
            Electrical.Capacitor(; name, C = C)
        elseif component.type == "inductor"
            L = require_parameter(component, "value")
            Electrical.Inductor(; name, L = L)
        elseif component.type == "vsource_dc"
            dc = require_parameter(component, "dc")
            voltage = Electrical.Voltage(; name)
            driver = Blocks.Constant(; name = Symbol(component.id * "_drv"), k = dc)
            push!(extra_systems, driver)
            append!(extra_equations, ModelingToolkit.connect(driver.output, voltage.V))
            voltage
        elseif component.type == "vsource_ac"
            amplitude = require_parameter(component, "amplitude")
            frequency = require_parameter(component, "frequency")
            voltage = Electrical.Voltage(; name)
            driver = Blocks.Sine(; name = Symbol(component.id * "_drv"), amplitude = amplitude, frequency = frequency)
            push!(extra_systems, driver)
            append!(extra_equations, ModelingToolkit.connect(driver.output, voltage.V))
            voltage
        elseif component.type == "ground"
            Electrical.Ground(; name)
        elseif component.type == "voltage_probe"
            sensor = Electrical.PotentialSensor(; name)
            net = component.connections["node"]
            measurement = (id = component.id, label = "Voltage at $(net)", expr = sensor.phi)
            sensor
        elseif component.type == "current_probe"
            sensor = Electrical.CurrentSensor(; name)
            measurement = (id = component.id, label = "Current through $(component.id)", expr = sensor.i)
            sensor
        else
            throw(ValidationError("暂不支持的元件类型", Dict("component" => component.id, "type" => component.type)))
        end
    end

    if component.type == "ground"
        handles["gnd"] = system.g
    elseif component.type == "voltage_probe"
        handles["node"] = system.p
    elseif component.type == "current_probe"
        handles["p"] = system.p
        handles["n"] = system.n
    else
        handles["p"] = getproperty(system, :p)
        handles["n"] = getproperty(system, :n)
        if component.type in ("vsource_dc", "vsource_ac")
            handles["pos"] = getproperty(system, :p)
            handles["neg"] = getproperty(system, :n)
        end
    end

    return (; system, handles, extra_systems, extra_equations, measurement)
end

function simulate_payload(payload::SimulationPayload)
    payload.sim.t_stop > 0 ||
        throw(ValidationError("仿真时长必须大于 0", Dict()))
    payload.sim.n_samples > 1 ||
        throw(ValidationError("采样点数至少为 2", Dict()))
    !isempty(payload.components) ||
        throw(ValidationError("电路为空", Dict()))

    has_ground = any(component.type == "ground" for component in payload.components)
    has_source = any(component.type in ("vsource_dc", "vsource_ac") for component in payload.components)
    has_ground || throw(ValidationError("circuit has no ground", Dict("missing" => ["ground"])))
    has_source || throw(ValidationError("circuit has no source", Dict("missing" => ["source"])))

    systems = ODESystem[]
    connections = Equation[]
    handle_lookup = Dict{Tuple{String, String}, Any}()
    measurements = Vector{NamedTuple{(:id, :label, :expr), Tuple{String, String, Any}}}()

    for component in payload.components
        instance = instantiate_component(component)
        push!(systems, instance.system)
        append!(systems, instance.extra_systems)
        append!(connections, instance.extra_equations)
        for (handle, connector) in instance.handles
            handle_lookup[(component.id, handle)] = connector
        end
        if instance.measurement !== nothing
            push!(measurements, instance.measurement)
        end
    end

    isempty(payload.nets) && throw(ValidationError("未提供任何网络连接", Dict()))

    for net in payload.nets
        nodes = parse_net_nodes(net)
        length(nodes) >= 2 ||
            throw(ValidationError("网络端子数量不足", Dict("net" => net.name)))
        first_node = nodes[1]
        base = get(handle_lookup, first_node, nothing)
        base === nothing &&
            throw(ValidationError("找不到端子", Dict("component" => first_node[1], "handle" => first_node[2])))
        for idx in 2:length(nodes)
            node = nodes[idx]
            connector = get(handle_lookup, node, nothing)
            connector === nothing &&
                throw(ValidationError("找不到端子", Dict("component" => node[1], "handle" => node[2])))
            append!(connections, ModelingToolkit.connect(base, connector))
        end
    end

    isempty(connections) && throw(ValidationError("电路没有任何有效连接", Dict()))

    @variables t
    @named circuit = ODESystem(connections, t, [], []; systems = systems)
    simplified = structural_simplify(circuit)

    u0 = ModelingToolkit.default_u0(simplified)
    p = ModelingToolkit.default_p(simplified)
    tspan = (0.0, payload.sim.t_stop)
    saveat = range(tspan[1], tspan[2], length = payload.sim.n_samples)

    prob = ODEProblem(simplified, u0, tspan, p)
    sol = solve(prob, Rodas5(); saveat)

    sol.retcode == :Success ||
        throw(ValidationError("仿真求解失败", Dict("retcode" => String(sol.retcode))))

    time = collect(sol.t)
    signals = Vector{Dict{String, Any}}()
    for measurement in measurements
        values = collect(sol[measurement.expr])
        push!(signals, Dict("id" => measurement.id, "label" => measurement.label, "values" => values))
    end

    return Dict("time" => time, "signals" => signals)
end

function run_simulation(payload::SimulationPayload)
    try
        data = simulate_payload(payload)
        return Dict("status" => "ok", "message" => "simulation done", "data" => data)
    catch err
        if err isa ValidationError
            return Dict("status" => "error", "message" => err.message, "data" => err.data)
        else
            @error "simulation failed" exception = (err, catch_backtrace())
            return Dict("status" => "error", "message" => "internal error", "data" => Dict())
        end
    end
end

function handle_simulate(req::HTTP.Request)
    payload = JSON3.read(String(req.body), SimulationPayload)
    response = run_simulation(payload)
    return HTTP.Response(200, JSON3.write(response); headers = RESPONSE_HEADERS)
end

function bootstrap(; host::AbstractString = "0.0.0.0", port::Integer = 8080, start::Bool = true)
    router = HTTP.Router()
    HTTP.register!(router, "POST", "/simulate") do req
        try
            handle_simulate(req)
        catch err
            @error "请求处理失败" exception = (err, catch_backtrace())
            body = JSON3.write(Dict("status" => "error", "message" => "invalid request", "data" => Dict()))
            HTTP.Response(400, body; headers = RESPONSE_HEADERS)
        end
    end
    HTTP.register!(router, "OPTIONS", "/simulate") do _
        HTTP.Response(200; headers = RESPONSE_HEADERS)
    end
    server = nothing
    if start
        server = HTTP.serve!(router, host, port; verbose = false)
        @info "JCircuitServer started" host port
    end
    return (; host, port, router, server)
end

end # module
