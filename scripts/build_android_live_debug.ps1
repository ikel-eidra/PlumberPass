param(
  [string]$HostIp,
  [int]$FrontendPort = 5173,
  [switch]$UseHttps
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

$scheme = if ($UseHttps) { "https" } else { "http" }
$liveServerUrl = "${scheme}://${HostIp}:${FrontendPort}"

Write-Host "Preparing live-debug Android build for $liveServerUrl"

$env:CAP_SERVER_URL = $liveServerUrl
$env:CAP_ANDROID_CLEAR_TEXT = if ($UseHttps) { "false" } else { "true" }
$env:VITE_API_URL = "${scheme}://${HostIp}:8000"

Push-Location "frontend"
try {
  npm run build | Out-Host
  npx cap sync android | Out-Host
  Push-Location "android"
  try {
    .\gradlew.bat assembleDebug | Out-Host
  } finally {
    Pop-Location
  }
} finally {
  Pop-Location
}

$stamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$apkSource = "frontend\android\app\build\outputs\apk\debug\app-debug.apk"
$apkDest = "tmp\PlumberPass-live-debug-$stamp.apk"
Copy-Item $apkSource $apkDest -Force

$hash = (Get-FileHash $apkDest -Algorithm SHA256).Hash
$item = Get-Item $apkDest

Write-Host ""
Write-Host "Live-debug APK ready:"
Write-Host $item.FullName
Write-Host "SHA-256: $hash"
Write-Host "Server URL: $liveServerUrl"
