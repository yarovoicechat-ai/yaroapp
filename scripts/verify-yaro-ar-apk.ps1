param([string]$ApkPath = "$PSScriptRoot/../android/app/build/outputs/apk/debug/app-debug.apk")
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$arArchive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ApkPath))
try {
  foreach ($arRequired in @('assets/models/face_landmarker.task', 'assets/shaders/beauty.frag', 'assets/licenses/MediaPipe-LICENSE.txt')) {
    if (-not $arArchive.GetEntry($arRequired)) { throw "Missing AR APK asset: $arRequired" }
  }
  foreach ($arRelative in @('models/face_landmarker.task', 'shaders/beauty.frag')) {
    $arAssetStream = $arArchive.GetEntry("assets/$arRelative").Open()
    $arSha = [Security.Cryptography.SHA256]::Create()
    try {
      $arPackagedHash = ([BitConverter]::ToString($arSha.ComputeHash($arAssetStream))).Replace('-', '')
      $arExpectedHash = (Get-FileHash -LiteralPath "$PSScriptRoot/../shared/ar-assets/$arRelative" -Algorithm SHA256).Hash
      if ($arPackagedHash -ne $arExpectedHash) { throw "APK contains a stale or changed AR asset: $arRelative" }
    } finally { $arAssetStream.Dispose(); $arSha.Dispose() }
  }
  $arInventory = Get-Content -LiteralPath "$PSScriptRoot/../shared/ar-assets/models/original-models.json" -Raw | ConvertFrom-Json
  if ($arInventory.effects.Count -ne 45) { throw 'Expected 45 original scene models' }
  foreach ($arEffect in $arInventory.effects) {
    $arRelative = "models/$($arEffect.id).glb"
    $arEntry = $arArchive.GetEntry("assets/$arRelative")
    if (-not $arEntry) { throw "Missing original scene in APK: $arRelative" }
    $arStream = $arEntry.Open()
    $arSha = [Security.Cryptography.SHA256]::Create()
    try {
      $arActual = ([BitConverter]::ToString($arSha.ComputeHash($arStream))).Replace('-', '')
      $arExpected = (Get-FileHash -LiteralPath "$PSScriptRoot/../shared/ar-assets/$arRelative" -Algorithm SHA256).Hash
      if ($arActual -ne $arExpected) { throw "APK contains a stale scene: $arRelative" }
    } finally { $arStream.Dispose(); $arSha.Dispose() }
  }
  foreach ($arManifest in Get-ChildItem -LiteralPath "$PSScriptRoot/../shared/ar-assets/manifests" -Filter '*.json') {
    if (-not $arArchive.GetEntry("assets/manifests/$($arManifest.Name)")) { throw "Missing manifest: $($arManifest.Name)" }
  }
  Write-Output 'All 45 scene models match source SHA-256 and all 50 manifests are packaged.'
  $arNativeClassFound = $false
  foreach ($arDexEntry in @($arArchive.Entries | Where-Object { $_.FullName -match '^classes\d*\.dex$' })) {
    $arDexStream = $arDexEntry.Open()
    $arDexMemory = New-Object IO.MemoryStream
    try {
      $arDexStream.CopyTo($arDexMemory)
      if ([Text.Encoding]::UTF8.GetString($arDexMemory.ToArray()).Contains('Lyaro/vc/app/ar/YaroARModule;')) { $arNativeClassFound = $true; break }
    } finally { $arDexStream.Dispose(); $arDexMemory.Dispose() }
  }
  if (-not $arNativeClassFound) { throw 'Native YaroAR module class missing from debug APK' }
  $arLibraries = @($arArchive.Entries | Where-Object { $_.FullName -match '^lib/arm64-v8a/.*(mediapipe|image_processing).*\.so$' })
  if (-not $arLibraries.Count) { throw 'MediaPipe arm64 libraries were not packaged' }
  foreach ($arLibrary in $arLibraries) {
    $arStream = $arLibrary.Open()
    try {
      $arHeader = New-Object byte[] 16384
      $arRead = 0
      while ($arRead -lt $arHeader.Length) {
        $arChunk = $arStream.Read($arHeader, $arRead, $arHeader.Length - $arRead)
        if ($arChunk -eq 0) { break }
        $arRead += $arChunk
      }
      if ($arHeader[0] -ne 127 -or $arHeader[1] -ne 69 -or $arHeader[4] -ne 2 -or $arHeader[5] -ne 1) { throw 'Expected little-endian ELF64 library' }
      $arOffset = [BitConverter]::ToUInt64($arHeader,32)
      $arSize = [BitConverter]::ToUInt16($arHeader,54)
      $arCount = [BitConverter]::ToUInt16($arHeader,56)
      $arLoadSegments = 0
      for ($arIndex = 0; $arIndex -lt $arCount; $arIndex++) {
        $arPosition = [int]($arOffset + $arIndex * $arSize)
        if ($arPosition + 56 -gt $arRead) { throw 'ELF program header exceeds validation buffer' }
        if ([BitConverter]::ToUInt32($arHeader,$arPosition) -eq 1) {
          $arAlignment = [BitConverter]::ToUInt64($arHeader,$arPosition+48)
          if ($arAlignment -lt 16384) { throw "Unaligned native library: $($arLibrary.FullName), p_align=$arAlignment" }
          $arLoadSegments++
        }
      }
      if ($arLoadSegments -eq 0) { throw 'ELF library has no load segments' }
      Write-Output "$($arLibrary.FullName): ELF load segments support 16 KB alignment"
    } finally { $arStream.Dispose() }
  }
  Write-Output 'Required AR model, shader and license are packaged.'
} finally { $arArchive.Dispose() }
