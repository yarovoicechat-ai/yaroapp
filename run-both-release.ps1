Write-Host "Building Release APK..."
Set-Location -Path android
.\gradlew.bat assembleRelease
if ($LASTEXITCODE -ne 0) {
    throw "Release build failed."
}
Set-Location -Path ..

$apkPath = "android\app\build\outputs\apk\release\app-release.apk"

if (-not (Test-Path $apkPath)) {
    throw "Release APK not found at $apkPath"
}

Write-Host "Finding connected devices..."
$deviceLines = adb devices -l
$uniqueTransports = @()
$seenModels = @{}

foreach ($line in $deviceLines) {
    if ($line -match "model:(\S+).*transport_id:(\d+)") {
        $model = $Matches[1]
        $tid = $Matches[2]
        if (-not $seenModels.ContainsKey($model)) {
            $seenModels[$model] = $tid
            $uniqueTransports += [PSCustomObject]@{
                Model = $model
                TransportId = $tid
            }
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
