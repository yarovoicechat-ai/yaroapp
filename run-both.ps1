Write-Host "Building and installing app..."
npm run android
if ($LASTEXITCODE -ne 0) { throw "Android build/install failed." }

$connectedDevices = adb devices |
  Select-Object -Skip 1 |
  Where-Object { $_ -match "`tdevice$" } |
  ForEach-Object { ($_ -split "`t")[0] }

if (-not $connectedDevices) {
  throw "No connected Android device found."
}

foreach ($device in $connectedDevices) {
  Write-Host "Connecting Metro and local API on $device..."
  adb -s $device reverse tcp:8081 tcp:8081
  adb -s $device reverse tcp:3001 tcp:3001

  Write-Host "Launching app on $device..."
  adb -s $device shell am start -n yaro.vc.app/.MainActivity
}

Write-Host "Done!"