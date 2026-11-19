# YaroAR independent repair audit — 2026-11-16

This is a pre-change audit. Source availability and APK packaging are different claims.

| Component | Source exists | Included in reference release APK | Runtime working | Required action |
|---|---|---|---|---|
| React Native effects UI / controller | Yes | Older release requires bundle comparison | Not independently verified | Fix premature selection confirmation |
| Android native AR | Yes | Full inclusion not established | Not independently verified | Build and inspect new release |
| MediaPipe model | Yes | **No**: APK verifier fails on `assets/models/face_landmarker.task` | Tracking cannot initialize from this APK asset path | Package model in release |
| Five beauty shaders | GLSL and Metal | Cannot assume current source is packaged | Intensity-zero bug established from source | Blend all processing by intensity |
| Four additional beauty presets | Missing dedicated processing | No evidence | No | Implement dedicated modes |
| 45 decorative effects | Metadata and thumbnails only; referenced GLBs absent | No implementation evidence | No | Author assets and native renderers |
| Native-to-Agora custom frames | Android and iOS adapter source | Not established | Prior isolated API acceptance is not live verification | Test real app local and remote |
| Live Start / host / viewer integration | Yes | Current implementation not established | Not independently verified | Test packaged app |
| Backend AR metadata/admin routes | Yes | Separate server component | Prior tests do not establish deployment | Re-run relevant tests |
| iOS | Native source exists | Not an Android APK component | No Mac/iPhone validation | Build and test on Apple hardware |

Concrete failure causes: the reference release lacks the bundled tracking model; 45 effects have no actual rendering assets; the beauty shader applies smoothing independently of effect intensity; native selection resolves before an effected frame is successfully pushed. These are independent issues, and a UI message change cannot repair them.

At device inventory time, `adb devices -l` returned no attached devices. No actual-camera, microphone, FPS, remote-viewer, or two-physical-device result is claimed. This audit does not label unverified effects as working.

Backup before source edits: `../scratch/ar-audit/pre-repair/source.zip`.
