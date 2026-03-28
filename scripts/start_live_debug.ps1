param(
  [string]$HostIp,
  [int]$FrontendPort = 5173,
  [int]$BackendPort = 8000
)

$ErrorActionPreference = "Stop"

if (-not $HostIp) {
  $HostIp = (
    Get-NetIPAddress -AddressFamily IPv4 |
      Where-Object {
        $_.IPAddress -notlike '127.*' -and
        $_.IPAddress -notlike '169.254.*' -and
        $_.PrefixOrigin -ne 'WellKnown'
      } |
      Sort-Object InterfaceMetric, SkipAsSource |
      Select-Object -First 1 -ExpandProperty IPAddress
  )
}

if (-not $HostIp) {
  throw "Could not determine a LAN IPv4 address. Pass -HostIp manually."
}

$frontendDir = Join-Path $PSScriptRoot "..\frontend"
$rootDir = Join-Path $PSScriptRoot ".."
$envFile = Join-Path $frontendDir ".env.local"

Set-Content -Path $envFile -Value @(
  "VITE_API_URL=http://${HostIp}:${BackendPort}"
) -Encoding UTF8

Write-Host "Live debug URLs"
Write-Host "Frontend: http://${HostIp}:${FrontendPort}"
Write-Host "Backend:  http://${HostIp}:${BackendPort}"
Write-Host "Updated:  $envFile"
Write-Host ""
Write-Host "Starting backend with reload..."

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$rootDir'; python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port $BackendPort"
)

Write-Host "Starting frontend with HMR..."

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$frontendDir'; npm run dev -- --host 0.0.0.0 --port $FrontendPort"
)

Write-Host ""
Write-Host "Next:"
Write-Host "1. Run scripts\\build_android_live_debug.ps1 -HostIp $HostIp"
Write-Host "2. Install the generated live-debug APK once"
Write-Host "3. After that, code changes should auto-refresh from the live dev server while your phone stays connected to the same LAN"
