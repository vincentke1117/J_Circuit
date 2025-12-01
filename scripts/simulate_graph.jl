#!/usr/bin/env julia
# Convert front-end nodes/edges graph JSON to SimulationPayload and POST to backend

using Pkg
Pkg.activate(joinpath(@__DIR__, "..", "server"))
using JSON3
using HTTP

function convert_graph_to_payload(graph)
    # Map component id -> type, parameters
    id2type = Dict{String, String}()
    id2params = Dict{String, Dict{String, Float64}}()

    nodes = graph["nodes"]
    for node in nodes
        id = String(node["id"])
        typ = String(node["type"])
        id2type[id] = typ
        params_in =
            (haskey(node, "data") && haskey(node["data"], "parameters")) ?
            node["data"]["parameters"] : Dict{String, Any}()
        params = Dict{String, Float64}()
        for (k, v) in params_in
            # robust float conversion
            try
                params[String(k)] = Float64(v)
            catch
                params[String(k)] = parse(Float64, string(v))
            end
        end
        id2params[id] = params
    end

    # Build adjacency among terminal handles
    adj = Dict{String, Vector{String}}()
    function add_edge(a::String, b::String)
        push!(get!(adj, a, String[]), b)
        push!(get!(adj, b, String[]), a)
    end

    edges = graph["edges"]
    for edge in edges
        s = String(edge["source"]) ; sh = String(edge["sourceHandle"])
        t = String(edge["target"]) ; th = String(edge["targetHandle"])
        k1 = string(s, ":", sh)
        k2 = string(t, ":", th)
        add_edge(k1, k2)
    end

    # Connected components -> nets
    visited = Set{String}()
    handle_to_net = Dict{String, String}()
    nets = Vector{Dict}()
    net_index = 0

    function dfs(start::String)
        stack = [start]
        comp = String[]
        while !isempty(stack)
            u = pop!(stack)
            if u in visited
                continue
            end
            push!(visited, u)
            push!(comp, u)
            for v in get(adj, u, String[])
                if !(v in visited)
                    push!(stack, v)
                end
            end
        end
        return comp
    end

    for k in keys(adj)
        if !(k in visited)
            cc = dfs(k)
            # ground net detection: any handle from a ground component with 'gnd'
            is_ground = any(begin
                parts = split(h, ":")
                length(parts) == 2 && get(id2type, parts[1], "") == "ground" && parts[2] == "gnd"
            end for h in cc)

            net_name = is_ground ? "gnd" : begin
                net_index += 1
                "n" * string(net_index)
            end

            for h in cc
                handle_to_net[h] = net_name
            end

            nodes_list = Vector{Vector{String}}()
            for h in cc
                parts = split(h, ":")
                push!(nodes_list, [parts[1], parts[2]])
            end
            push!(nets, Dict("name" => net_name, "nodes" => nodes_list))
        end
    end

    # Build components array with connections
    function handles_for(typ::String)
        if typ == "resistor" || typ == "capacitor" || typ == "inductor"
            ["p", "n"]
        elseif typ == "vsource_dc" || typ == "vsource_ac" || typ == "isource_dc" || typ == "isource_ac"
            ["pos", "neg"]
        elseif typ == "vccs" || typ == "vcvs" || typ == "cccs" || typ == "ccvs"
            ["pos", "neg", "ctrl_p", "ctrl_n"]
        elseif typ == "ground"
            ["gnd"]
        elseif typ == "voltage_probe"
            ["node"]
        elseif typ == "current_probe"
            ["p", "n"]
        else
            String[]
        end
    end

    components = Vector{Dict}()
    for (id, typ) in id2type
        conns = Dict{String, String}()
        for h in handles_for(typ)
            key = string(id, ":", h)
            if haskey(handle_to_net, key)
                conns[h] = handle_to_net[key]
            end
        end
        push!(components, Dict(
            "id" => id,
            "type" => typ,
            "parameters" => id2params[id],
            "connections" => conns,
        ))
    end

    payload = Dict(
        "components" => components,
        "nets" => nets,
        "sim" => Dict("t_stop" => 0.01, "n_samples" => 100),
        "method" => "node_voltage",
        "thevenin_port" => nothing,
        "teaching_mode" => nothing,
    )
    return payload
end

function main(args)
    if length(args) < 1
        println("Usage: simulate_graph.jl <graph_json_path> [<url>]")
        return
    end
    path = args[1]
    url = length(args) >= 2 ? args[2] : "http://127.0.0.1:8080/simulate"
    graph = JSON3.read(read(path, String))
    payload = convert_graph_to_payload(graph)
    body = JSON3.write(payload)
    resp = HTTP.post(url; headers = Dict("Content-Type" => "application/json"), body = body)
    println(String(resp.body))
end

main(ARGS)
