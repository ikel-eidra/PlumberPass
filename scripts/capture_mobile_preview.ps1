param(
    [string]$PreviewHost = "127.0.0.1",
    [int]$Port = 4173,
    [int]$Width = 430,
    [int]$Height = 920,
    [string]$Screen = "dashboard",
    [int]$VirtualTimeBudgetMs = 6000,
    [string]$OutputPath = ""
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $repoRoot "frontend"
$previewUrl = "http://$PreviewHost`:$Port/?screen=$Screen"

if (-not $OutputPath) {
    $OutputPath = Join-Path $repoRoot "tmp\mobile-preview-dashboard.png"
}

$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

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

    for ($attempt = 0; $attempt -lt 15; $attempt++) {
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

if (-not $edgePath) {
    throw "Microsoft Edge was not found for headless screenshot capture."
}

$null = & $edgePath `
    "--headless=new" `
    "--disable-gpu" `
    "--hide-scrollbars" `
    "--window-size=$Width,$Height" `
    "--virtual-time-budget=$VirtualTimeBudgetMs" `
    "--screenshot=$OutputPath" `
    "$previewUrl"

for ($attempt = 0; $attempt -lt 10; $attempt++) {
    if ((Test-Path $OutputPath) -and ((Get-Item $OutputPath).Length -gt 0)) {
        break
    }
    Start-Sleep -Milliseconds 300
}

if (-not (Test-Path $OutputPath) -or (Get-Item $OutputPath).Length -le 0) {
    throw "Screenshot was not created: $OutputPath"
}

Write-Output $OutputPath
