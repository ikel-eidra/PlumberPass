param(
    [switch]$RepublishContent,
    [switch]$OpenPreview,
    [switch]$TryDockerBuild
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $repoRoot "frontend"
$backend = Join-Path $repoRoot "backend"

function Invoke-Step {
    param(
        [string]$Label,
        [scriptblock]$Action
    )

    Write-Host ""
    Write-Host "== $Label ==" -ForegroundColor Cyan
    & $Action
}

if ($RepublishContent) {
    Invoke-Step "Republish curated content" {
        Push-Location $repoRoot
        try {
            python scripts/publish_structured_reference_mcqs.py
            python scripts/publish_laws_mcqs.py
            python scripts/publish_conversion_mcqs.py
            python scripts/publish_visual_review_items.py
            python scripts/export_study_bundle.py
        } finally {
            Pop-Location
        }
    }
}

Invoke-Step "Backend tests" {
    Push-Location $repoRoot
    try {
        pytest -q
    } finally {
        Pop-Location
    }
}

Invoke-Step "Frontend typecheck" {
    Push-Location $frontend
    try {
        npx tsc --noEmit
    } finally {
        Pop-Location
    }
}

Invoke-Step "Frontend production build" {
    Push-Location $frontend
    try {
        npm run build
    } finally {
        Pop-Location
    }
}

Invoke-Step "Live content counts" {
    Push-Location $backend
    try {
        @'
from app.storage import load_questions, load_flashcards, load_identification_items, load_visual_review_items
from app.storage import load_mock_exam1_part_a, load_mock_exam1_part_b

print({
    "study_questions": len(load_questions()),
    "flashcards": len(load_flashcards()),
    "identification": len(load_identification_items()),
    "visual_review": len(load_visual_review_items()),
    "mock_questions": len(load_mock_exam1_part_a()) + len(load_mock_exam1_part_b()),
})
'@ | python -
    } finally {
        Pop-Location
    }
}

Invoke-Step "Docker compose config" {
    Push-Location $repoRoot
    try {
        docker compose config | Out-Null
        Write-Host "docker compose config: ok" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

Invoke-Step "Docker runtime status" {
    cmd.exe /c "docker version >nul 2>nul"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker daemon is reachable." -ForegroundColor Green
    } else {
        Write-Warning "Docker daemon is not reachable on this machine. Compose config is valid, but container build/run cannot proceed until Docker Desktop is started."
    }
}

if ($TryDockerBuild) {
    Invoke-Step "Docker build attempt" {
        Push-Location $repoRoot
        try {
            docker compose build backend frontend
        } finally {
            Pop-Location
        }
    }
}

if ($OpenPreview) {
    Invoke-Step "Open mobile preview" {
        & (Join-Path $PSScriptRoot "preview_mobile.ps1")
    }
}

Write-Host ""
Write-Host "Launch smoke completed." -ForegroundColor Green
