Set-Location -Path $PSScriptRoot
Write-Host "Building Release APK in $PSScriptRoot..."
Set-Location -Path "$PSScriptRoot\android"
.\gradlew.bat assembleRelease
if ($LASTEXITCODE -ne 0) {
    throw "Release build failed."
}
Set-Location -Path $PSScriptRoot

$apkPath = "$PSScriptRoot\android\app\build\outputs\apk\release\app-arm64-v8a-release.apk"
if (-not (Test-Path $apkPath)) {
    $apkPath = "$PSScriptRoot\android\app\build\outputs\apk\release\app-universal-release.apk"
}
if (-not (Test-Path $apkPath)) {
    $apkPath = "$PSScriptRoot\android\app\build\outputs\apk\release\app-release.apk"
}

if (-not (Test-Path $apkPath)) {
    throw "Release APK not found at $apkPath"
}

Write-Host "Finding connected devices..."
$deviceLines = adb devices -l
$uniqueTransports = @()

foreach ($line in $deviceLines) {
    if ($line -match "(\S+)\s+device\s+.*transport_id:(\d+)") {
        $devId = $Matches[1]
        $tid = $Matches[2]
        $model = "Device"
        if ($line -match "model:(\S+)") {
            $model = $Matches[1]
        }
        $uniqueTransports += [PSCustomObject]@{
            DeviceId = $devId
            Model = $model
            TransportId = $tid
        }
    }
}

if ($uniqueTransports.Count -eq 0) {
    throw "No connected ADB devices found."
}

foreach ($dev in $uniqueTransports) {
    $tid = $dev.TransportId
    $model = $dev.Model
    Write-Host "----------------------------------------"
    Write-Host "Installing Release APK on device $model (transport_id: $tid)..."
    
    adb -t $tid install -r $apkPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully installed on $model. Launching app..."
        adb -t $tid shell am start -n yaro.vc.app/.MainActivity
    } else {
        Write-Host "Failed to install on $model (transport_id: $tid)."
    }
}

Write-Host "----------------------------------------"
Write-Host "Release installation process complete!"
