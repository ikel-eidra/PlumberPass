param(
    [string]$PreviewHost = "127.0.0.1",
    [int]$Port = 4173,
    [int]$Width = 430,
    [int]$Height = 920,
    [int]$VirtualTimeBudgetMs = 6000
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$screens = @(
    "dashboard",
    "review",
    "active",
    "visual",
    "report",
    "mistakes"
)
$outputDir = Join-Path $repoRoot "tmp\mobile-gallery"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

foreach ($screen in $screens) {
    $outputPath = Join-Path $outputDir "$screen.png"
    & (Join-Path $PSScriptRoot "capture_mobile_preview.ps1") `
        -PreviewHost $PreviewHost `
        -Port $Port `
        -Width $Width `
        -Height $Height `
        -Screen $screen `
        -VirtualTimeBudgetMs $VirtualTimeBudgetMs `
        -OutputPath $outputPath | Out-Null

    Write-Output $outputPath
}
