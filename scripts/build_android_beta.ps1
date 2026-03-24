param(
    [switch]$OpenAndroidStudio
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $repoRoot "frontend"
$androidDir = Join-Path $frontend "android"
$sdkCandidates = @(@(
    $env:ANDROID_SDK_ROOT,
    $env:ANDROID_HOME,
    "C:\Users\Futol\AppData\Local\Android\Sdk"
) | Where-Object { $_ -and (Test-Path $_) })

if (-not $sdkCandidates) {
    throw "Android SDK not found. Set ANDROID_SDK_ROOT or install the SDK."
}

$sdkDir = $sdkCandidates[0]
$localPropertiesPath = Join-Path $androidDir "local.properties"
$normalizedSdk = $sdkDir -replace "\\", "/"
Set-Content -Path $localPropertiesPath -Value "sdk.dir=$normalizedSdk"
$env:ANDROID_SDK_ROOT = $sdkDir
$env:ANDROID_HOME = $sdkDir

$javaCandidates = @(@(
    "C:\Program Files\Android\Android Studio\jbr",
    $env:JAVA_HOME
) | Where-Object { $_ -and (Test-Path $_) })

if (-not $javaCandidates) {
    throw "Java runtime not found. Install Java 21 or Android Studio."
}

$env:JAVA_HOME = $javaCandidates[0]

Push-Location $frontend
try {
    npm run build
    npx cap sync android
} finally {
    Pop-Location
}

$gradleWrapper = Join-Path $androidDir "gradlew.bat"
if (-not (Test-Path $gradleWrapper)) {
    throw "Gradle wrapper not found in $androidDir"
}

Push-Location $androidDir
try {
    & $gradleWrapper assembleDebug
} finally {
    Pop-Location
}

$apkPath = Join-Path $androidDir "app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkPath)) {
    throw "Debug APK was not created at $apkPath"
}

Write-Output "APK: $apkPath"

if ($OpenAndroidStudio) {
    Push-Location $frontend
    try {
        npx cap open android
    } finally {
        Pop-Location
    }
}
