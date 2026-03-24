param(
    [string]$DeviceId = "",
    [string]$AvdName = "",
    [string]$ApkPath = "",
    [switch]$CaptureScreenshot
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$defaultApkPath = Join-Path $repoRoot "frontend\android\app\build\outputs\apk\debug\app-debug.apk"
if (-not $ApkPath) {
    $ApkPath = $defaultApkPath
}

if (-not (Test-Path $ApkPath)) {
    throw "APK not found at $ApkPath. Run build_android_beta.ps1 first."
}

$sdkCandidates = @(@(
    $env:ANDROID_SDK_ROOT,
    $env:ANDROID_HOME,
    "C:\Users\Futol\AppData\Local\Android\Sdk"
) | Where-Object { $_ -and (Test-Path $_) })

if (-not $sdkCandidates) {
    throw "Android SDK not found. Set ANDROID_SDK_ROOT or install the SDK."
}

$sdkDir = $sdkCandidates[0]
$adb = Join-Path $sdkDir "platform-tools\adb.exe"
$emulator = Join-Path $sdkDir "emulator\emulator.exe"

if (-not (Test-Path $adb)) {
    throw "adb.exe not found under $sdkDir"
}

if ($AvdName) {
    if (-not (Test-Path $emulator)) {
        throw "emulator.exe not found under $sdkDir"
    }

    Start-Process -FilePath $emulator -ArgumentList "-avd", $AvdName, "-netdelay", "none", "-netspeed", "full" | Out-Null
}

if (-not $DeviceId) {
    & $adb start-server | Out-Null
    $target = $null

    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        $deviceLines = & $adb devices
        $target = $deviceLines |
            Select-String "device$" |
            Select-Object -First 1

        if ($target) {
            break
        }

        if (-not $AvdName) {
            break
        }

        Start-Sleep -Seconds 2
    }

    if (-not $target) {
        throw "No Android device or emulator detected."
    }

    $DeviceId = ($target.ToString() -split "\s+")[0]
}

& $adb -s $DeviceId wait-for-device | Out-Null
for ($attempt = 0; $attempt -lt 90; $attempt++) {
    $boot = (& $adb -s $DeviceId shell getprop sys.boot_completed 2>$null).Trim()
    if ($boot -eq "1") {
        break
    }
    Start-Sleep -Seconds 2
}

& $adb -s $DeviceId install -r $ApkPath
& $adb -s $DeviceId shell am start -W -n com.plumberpass.app/.MainActivity | Out-Null

if ($CaptureScreenshot) {
    $screenshotPath = Join-Path $repoRoot "tmp\android-beta-launch.png"
    & $adb -s $DeviceId exec-out screencap -p > $screenshotPath
    Write-Output "SCREENSHOT: $screenshotPath"
}

Write-Output "DEVICE: $DeviceId"
Write-Output "APK: $ApkPath"
