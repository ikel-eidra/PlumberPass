param(
    [string]$PreviewHost = "127.0.0.1",
    [int]$Port = 4173,
    [int]$Width = 430,
    [int]$Height = 920,
    [int]$Left = 80,
    [int]$Top = 40
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $repoRoot "frontend"
$previewUrl = "http://$PreviewHost`:$Port"

function Test-PreviewReady {
    param([string]$Url)
    try {
        $null = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
        return $true
    } catch {
        return $false
    }
}

if (-not (Test-PreviewReady -Url $previewUrl)) {
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", "start", "", "/min", "npm.cmd", "run", "preview", "--", "--host", $PreviewHost, "--port", $Port `
        -WorkingDirectory $frontend | Out-Null

    for ($attempt = 0; $attempt -lt 10; $attempt++) {
        Start-Sleep -Seconds 1
        if (Test-PreviewReady -Url $previewUrl) {
            break
        }
    }
}

$edgePaths = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)
$edgePath = $edgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($edgePath) {
    Start-Process -FilePath $edgePath -ArgumentList @(
        "--app=$previewUrl",
        "--window-size=$Width,$Height",
        "--window-position=$Left,$Top",
        "--force-device-scale-factor=1"
    ) | Out-Null
} else {
    Start-Process $previewUrl | Out-Null
}

Write-Output "Opened mobile preview at $previewUrl"
