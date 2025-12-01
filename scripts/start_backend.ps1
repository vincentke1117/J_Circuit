<#
Smart start backend for JCircuit (Windows PowerShell)

Usage examples:
  1) Default host/port, auto-clean if occupied:
     .\scripts\start_backend.ps1

  2) Specify port/host:
     .\scripts\start_backend.ps1 -Port 8081 -Host 127.0.0.1

Notes:
  - This script checks if the target TCP port is occupied.
  - If occupied, it will attempt to terminate the owning processes (Stop-Process, fallback taskkill).
  - Then it sets HOST/PORT env vars and starts Julia backend with start_backend.jl.
  - Killing processes by port may terminate unrelated apps using that port; use with care.
#>

param(
  [int]$Port = $(if ($env:PORT) { [int]$env:PORT } else { 8080 }),
  [string]$ListenHost = $(if ($env:HOST) { $env:HOST } else { "127.0.0.1" }),
  [switch]$NoKill
)

function Get-ListeningPIDsByPort {
  param([int]$Port)
  $pids = @()
  try {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
    foreach ($c in $conns) {
      if ($c.OwningProcess) { $pids += $c.OwningProcess }
    }
  } catch {
    # Fallback parsing netstat output
    $lines = netstat -ano | Select-String ":$Port\s"
    foreach ($l in $lines) {
      $parts = ($l.ToString() -replace '\s{2,}', ' ').Split(' ')
      if ($parts.Length -ge 5) { $pids += [int]$parts[-1] }
    }
  }
  $pids | Sort-Object -Unique
}

Write-Host "[SmartStart] host=$ListenHost port=$Port" -ForegroundColor Cyan

$pids = Get-ListeningPIDsByPort -Port $Port

if ($pids.Count -gt 0 -and -not $NoKill) {
  Write-Host "[SmartStart] Port $Port occupied by PIDs: $($pids -join ', ')" -ForegroundColor Yellow
  foreach ($procId in $pids) {
    try {
      $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
      $name = if ($proc) { $proc.ProcessName } else { "PID $procId" }
      Write-Host "[SmartStart] Killing $name ($procId)..." -ForegroundColor Yellow
      Stop-Process -Id $procId -Force -ErrorAction Stop
      Write-Host "[SmartStart] Killed $name ($procId)" -ForegroundColor Green
    } catch {
      Write-Host "[SmartStart] Stop-Process failed for ${procId}. Trying taskkill..." -ForegroundColor Yellow
      try {
        cmd /c "taskkill /PID $procId /F" | Out-Null
        Write-Host "[SmartStart] taskkill succeeded for ${procId}" -ForegroundColor Green
      } catch {
        Write-Host "[SmartStart] Failed to kill PID ${procId}: $($_.Exception.Message)" -ForegroundColor Red
      }
    }
  }
} elseif ($pids.Count -gt 0) {
  Write-Host "[SmartStart] Port $Port occupied; -NoKill set, skipping termination." -ForegroundColor Yellow
} else {
  Write-Host "[SmartStart] Port $Port is free." -ForegroundColor Green
}

$env:PORT = "$Port"
$env:HOST = "$ListenHost"

$scriptPath = Join-Path $PSScriptRoot "..\start_backend.jl"
Write-Host "[SmartStart] Starting backend: $scriptPath" -ForegroundColor Cyan
& julia $scriptPath