# YaroAR and live repair verification report

## Current continuation status (2026-11-17)

Source repairs and automated checks are recorded below. Physical-camera acceptance, remote Agora video acceptance and iOS acceptance remain pending. The earlier report is preserved at the end as a historical record. Its counts and pending-asset statements describe the earlier implementation stage.

The current registry contains 50 experimental catalog effects and four additional beauty presets. Native session source exposes nine beauty modes and 45 original GLB scenes. All 50 catalog effects remain experimental, with zero effects marked verified.

## Physical-device findings (2026-11-17)

Both physical phones accepted the candidate release update. I2011 runs Android 13 and RMX3940 runs Android 16. Candidate SHA-256 is `21B884D2D51C9385B679B4FDADCCE96EB7CA84A87CBD31692E7BEA0113C87776`. Black Live Start previews were observed. Android camera diagnostics showed active Yaro capture and frames produced, and Agora local-view setup returned zero. A later RMX3940 live screenshot showed ordinary camera video. Android views now use TextureView, and capture failures produce readable callbacks. These changes are being rebuilt. Compact tabs and the restored live menu were visible on the installed candidate. Remote processed video, actual audio, all-effect rendering and gift/entry delivery still require acceptance.

Iris diagnostics confirmed that dynamic custom track creation succeeded, then `startPreview(VideoSourceCustom = 4)` returned `-2`. The controller now starts native capture without that rejected preview operation. A registered Android `YaroARPreview` view displays the same processed RGBA buffer submitted to Agora. Its native queue retains at most one pending frame and reuses two bitmaps. Controller and preview regression checks pass. Physical acceptance of this fix remains pending the new APK.

The next release APK was installed on both phones. Its physical filter selection exposed an additional release-only failure, `Field platform_ for s5.u not found`. The release instrumentation run confirmed the same protobuf reflection error in MediaPipe tracking and GPU fixture tests. Agora native custom-frame submission passed. R8 keep rules now preserve MediaPipe and protobuf classes and members. The corrected release and matching instrumentation APK are being rebuilt. Evidence from the failed release is `../scratch/ar-continuation/RMX-native-instrumentation.log`.

An actual 50-coin Bear gift reached both live clients, updated the broadcast total and displayed receipts on each device. Ordinary remote camera video also rendered on the viewer phone. The GIF remained loading during the short playback window. The gift player now starts its display duration after media readiness, with a bounded loading timeout. GIF, video, SVG and SVGA readiness events are connected. Eleven gift/media retry regressions passed. Gift notices now display the media thumbnail and gift name.

The phones briefly disconnected and later reconnected. Duplicate RMX3940 wireless transports represent one physical phone. The user approved production backend deployment. The ten scoped source files and their ten compiled counterparts were deployed with SHA-256 verification. PM2 `yaro-backend` ID 45 is online, and local/public `/healthz` checks passed after restart. The remote backup is `/root/yaro-backups/livefix-20261117-0745/before.tgz`. Deployment evidence is `../scratch/ar-continuation/backend-production-verify.log`.

## Actual audit results and root causes

| Component | Source exists | Reference APK 0.2.1/code 21 | Runtime evidence in this continuation | Required action or repair |
|---|---|---|---|---|
| Beauty/effects UI and registry | Yes | Older build | Automated UI/controller checks passed | Preserve truthful available/loading/active/failed states |
| YaroAR native Android module and renderer | Yes | Native AR classes absent from inspected DEX | Android compilation passed in an earlier build | Install final APK and test native registration through the application |
| MediaPipe model and native libraries | Yes | Absent | Bundled-model SHA-256 and release packaging checks passed | Test camera tracking on connected devices |
| Beauty shader and 45 GLB scenes | Yes | Absent | Source and asset validation passed | Test every rendered effect on physical camera frames |
| Android camera sampling | Yes | Current shader absent | Crop uniform and source aspect are connected in current renderer source | Verify front/rear orientation and crop on physical devices |
| GLB scene pipeline | Loader, scene assets and render pass exist | Absent | Current session source loads scenes and calls the render pass | Execute the 45-scene native GPU test and physical preview checks |
| Custom-source local preview | Yes | Current implementation absent | Dynamic-track `startPreview(4)` failed with `-2` on the candidate | Rejected call removed and native processed-frame preview added, awaiting device acceptance |
| Live video view mounting | Yes | Older screen | Regression checks passed | View now mounts after engine initialization, and viewer view mounts before first remote frame |
| Live menu | Sheet existed, opening button was disconnected | Older screen | Menu-opening regression passed | Bottom menu action now opens existing tools |
| Live gifts | REST and socket paths existed | Older screen | REST payload and client playback regressions passed | Include real media metadata, play fullscreen media and deduplicate REST/socket delivery |
| Room/live entry effects | Existing room engine and backend asset resolver | Live screen lacked player/subscription | Entry queue and broadcast regressions passed | Subscribe live screen to the shared entry event and use fullscreen custom media |
| Room emoji lifecycle | Context retained the last reaction | Older screen | Freshness and room-scope regressions passed | Clear reactions on join, minimize and leave, and reject expired/cross-room reactions |
| Multi-live layout | Existing mode and guest list | Older screen | Four-box preview and capacity checks passed | Persist selected seat count and display rectangular video boxes |
| Co-host controls | Partial controls existed | Older screen | Permission-boundary regressions passed | Guests control their own microphone/camera, host moderation exposes mute |
| Separate video calling | Earlier source-wide audit found no dedicated caller/receiver video engine | Not established | No separate call verification | Existing video-call implementation remains a dependency |
| iOS architecture | AVFoundation, MediaPipe, Metal and Agora adapter source exists | Not applicable | Build/device execution unavailable on Windows | Resolve pods, build on a Mac and test an iPhone |

The inspected reference APK is `../scratch/ar-audit/pre-repair/app-release-reference.apk`, application ID `yaro.vc.app`, version 0.2.1/code 21, minimum SDK 24 and target SDK 36. It contains camera, microphone and internet permissions and 42 Agora native libraries. The inspected DEX/assets/native library entries contain no YaroAR module classes, Face Landmarker model, beauty shader, GLB scenes or MediaPipe libraries. That artifact cannot initialize the current native AR implementation. Inspection evidence is saved in `../scratch/ar-continuation/reference-apk.json`.

Current-source investigation also found incomplete renderer/session wiring during the interrupted implementation stage. The current source connects the GLB render pass, additional beauty modes, camera crop uniform and custom local preview. Native selection resolves after a processed frame has rendered and been submitted to Agora. These source changes still require physical-device acceptance.

## Current source repairs

- Live Start opens Beauty, Effects, Background, Adjust and More from compact tabs. Its effects panel starts collapsed and expands above the tabs. The existing camera engine is reused. Multi-live previews the selected rectangular video-box count.
- The live screen mounts video after the engine is ready, attaches socket listeners when the socket becomes available and opens its existing tools from the bottom menu.
- Live gift events include animation URL, image, type, duration, quantity, recipient and transaction ID. The REST sender receives the same event payload. The client deduplicates transaction IDs and sends events through the shared animation queue.
- Gift media fills the room/live overlay. Animation completion advances the queue, stale completion callbacks cannot skip the next gift and unmount cancels queue timers.
- Custom entry/entrance media uses the full viewport with the existing arrival identity banner. Entry events reach both voice-room and live-room channels. Standard arrivals use the configured identity banner.
- Voice-room reactions clear at room-session boundaries. Display uses a 2.5-second lifetime and canonical room IDs. Disconnected sockets do not queue new outgoing reactions for a later rejoin.
- Four, six and nine-box multi-live layouts include the host. A four-box selection stores three guest places. Guests control their own mic/camera state, and host moderation sends a mute action for accepted guests.
- The AR lifecycle retains its resume request across an inactive ? background ? active transition.

Review fixes include user-based guest roster reconciliation, explicit entrance cancellation, single-view mirroring, adaptive multi-preview layout, atomic guest capacity reservation, contributor increments and LiveBroadcast eligibility in the versioned gift economy. The existing ledger allocation and idempotency path are retained. Thirty-six backend regressions passed, including live gift settlement and replay checks.

## Files changed or integrated

Paths below are relative to each project. Existing unrelated working-tree edits were present before this continuation.

| Project and paths | Purpose |
|---|---|
| YaroApp `src/screens/user/CreateLiveScreen.js`, `src/screens/user/LiveStreamScreen.js`, `src/components/live/LiveVideoGrid.js` | Camera view lifecycle, compact effects navigation, menu wiring, video-box layouts, guest controls and live media playback |
| YaroApp `src/components/live/LiveBottomControls.js`, `src/components/live/LiveToolsBottomSheet.js` | Menu access and host/co-host tool actions |
| YaroApp `src/components/gift/GiftAnimationEngine.js`, `src/components/gift/hooks/useGiftQueue.js`, `src/components/gift/hooks/useGiftSocket.js` | Fullscreen media, queue completion/cleanup, room scope and exact listener removal |
| YaroApp `src/components/room/RoomEntryEffectEngine.js` | Fullscreen custom entry/entrance media with existing queue and fallback behavior |
| YaroApp `src/context/VoiceRoomContext.js`, `src/screens/user/VoiceRoom.js`, `src/utils/roomEvents.js` | Reaction lifecycle/freshness and voice-room gift queue cleanup |
| YaroApp `src/features/YaroAR/hooks/useARSession.ts`, `src/features/YaroAR/components/ARFilterPanel.tsx` | Background resume and compact/collapsible panel integration |
| YaroApp `src/features/YaroAR/`, `android/app/src/main/java/yaro/vc/app/ar/`, `ios/YaroAR/`, `shared/ar-assets/` | Existing and interrupted native AR implementation, tracking, beauty modes, GLB assets and platform renderers |
| YaroApp `scripts/verify-yaro-ar-apk.ps1` | Model/shader packaging, all 45 GLB SHA-256 hashes, 50 manifests and MediaPipe ELF alignment |
| YaroApp `src/__tests__/createLive.test.js`, `src/__tests__/giftDelivery.test.js`, `src/__tests__/roomEvents.test.js`, `src/__tests__/yaroARLifecycle.test.js`, `src/__tests__/liveStream.test.js`, `src/__tests__/roomEntrance.test.js`, `src/__tests__/roomEmoji.test.js` | New and extended regression coverage |
| YaroServer `src/routes/liveBroadcastRoutes.ts`, `src/sockets/liveBroadcastSocket.ts`, `src/models/liveBroadcast.model.ts` | Gift metadata delivery, selected layout capacity and guest media/moderation events |
| YaroServer `src/services/entryEffect.service.ts`, `src/gift/gift.socket.ts`, `src/sockets/voiceRoomSocket.ts` | Live entry broadcast channel and room-scoped media/reaction events |
| YaroServer `src/tests/liveBroadcast.test.cjs`, `src/tests/liveMediaSocket.test.cjs`, `src/tests/roomEntrance.test.ts` | Live gift payload, layout, permission and entry-channel regression checks |

Backups are `../scratch/ar-continuation/before-integration.zip` and `../scratch/ar-continuation/before-live-repairs.zip`. The earlier source checkpoint is `../scratch/ar-audit/pre-repair/source.zip`.

## Effect-by-effect verification

?Passed? in the asset column means bundled source/manifest references and structural asset checks passed. Preview and remote columns require physical-device observation. Native source supports five catalog beauty modes plus four additional beauty presets. All 45 GLB files have distinct scene geometry, with 59,596 triangles in total and 25 scenes declaring animation.

| # | Effect | ID | Category | Source asset/renderer | Asset validation | Physical preview | Remote viewer |
|---|---|---|---|---|---|---|---|
| 1 | Yaro Beauty | yaro-beauty | Beauty | Beauty shader | Passed | Pending | Pending |
| 2 | Pink Glow | pink-glow | Beauty | Beauty shader | Passed | Pending | Pending |
| 3 | Rosy Cheeks | rosy-cheeks | Beauty | Beauty shader | Passed | Pending | Pending |
| 4 | Soft Makeup | soft-makeup | Beauty | Beauty shader | Passed | Pending | Pending |
| 5 | Golden Shine | golden-shine | Beauty | Beauty shader | Passed | Pending | Pending |
| 6 | Puppy | puppy | Animals | Original GLB scene | Passed | Pending | Pending |
| 7 | Bunny | bunny | Animals | Original GLB scene | Passed | Pending | Pending |
| 8 | Kitty | kitty | Animals | Original GLB scene | Passed | Pending | Pending |
| 9 | Panda | panda | Animals | Original GLB scene | Passed | Pending | Pending |
| 10 | Fox | fox | Animals | Original GLB scene | Passed | Pending | Pending |
| 11 | Royal Crown | royal-crown | Accessories | Original GLB scene | Passed | Pending | Pending |
| 12 | Heart Glasses | heart-glasses | Accessories | Original GLB scene | Passed | Pending | Pending |
| 13 | Butterfly Hair | butterfly-hair | Accessories | Original GLB scene | Passed | Pending | Pending |
| 14 | Golden Earrings | golden-earrings | Accessories | Original GLB scene | Passed | Pending | Pending |
| 15 | Cyber Headset | cyber-headset | Accessories | Original GLB scene | Passed | Pending | Pending |
| 16 | Angel | angel | Fantasy | Original GLB scene | Passed | Pending | Pending |
| 17 | Devil | devil | Fantasy | Original GLB scene | Passed | Pending | Pending |
| 18 | Fairy | fairy | Fantasy | Original GLB scene | Passed | Pending | Pending |
| 19 | Ice Queen | ice-queen | Fantasy | Original GLB scene | Passed | Pending | Pending |
| 20 | Fire King | fire-king | Fantasy | Original GLB scene | Passed | Pending | Pending |
| 21 | Anime Eyes | anime-eyes | Anime | Original GLB scene | Passed | Pending | Pending |
| 22 | Anime Blush | anime-blush | Anime | Original GLB scene | Passed | Pending | Pending |
| 23 | Magic Eyes | magic-eyes | Anime | Original GLB scene | Passed | Pending | Pending |
| 24 | Anime Cat | anime-cat | Anime | Original GLB scene | Passed | Pending | Pending |
| 25 | Star Eyes | star-eyes | Anime | Original GLB scene | Passed | Pending | Pending |
| 26 | Love Hearts | love-hearts | Emotions | Original GLB scene | Passed | Pending | Pending |
| 27 | Cry Baby | cry-baby | Emotions | Original GLB scene | Passed | Pending | Pending |
| 28 | Funny Face | funny-face | Emotions | Original GLB scene | Passed | Pending | Pending |
| 29 | Happy Spark | happy-spark | Emotions | Original GLB scene | Passed | Pending | Pending |
| 30 | Angry Face | angry-face | Emotions | Original GLB scene | Passed | Pending | Pending |
| 31 | Butterflies | butterflies | Nature | Original GLB scene | Passed | Pending | Pending |
| 32 | Flower Crown | flower-crown | Nature | Original GLB scene | Passed | Pending | Pending |
| 33 | Snowfall | snowfall | Nature | Original GLB scene | Passed | Pending | Pending |
| 34 | Star Shower | star-shower | Nature | Original GLB scene | Passed | Pending | Pending |
| 35 | Rainbow Aura | rainbow-aura | Nature | Original GLB scene | Passed | Pending | Pending |
| 36 | Birthday | birthday | Party | Original GLB scene | Passed | Pending | Pending |
| 37 | Disco King | disco-king | Party | Original GLB scene | Passed | Pending | Pending |
| 38 | Confetti | confetti | Party | Original GLB scene | Passed | Pending | Pending |
| 39 | Neon Party | neon-party | Party | Original GLB scene | Passed | Pending | Pending |
| 40 | Gold Rain | gold-rain | Party | Original GLB scene | Passed | Pending | Pending |
| 41 | Diamond Face | diamond-face | Premium | Original GLB scene | Passed | Pending | Pending |
| 42 | Hologram | hologram | Premium | Original GLB scene | Passed | Pending | Pending |
| 43 | Dragon Mask | dragon-mask | Premium | Original GLB scene | Passed | Pending | Pending |
| 44 | Crystal Butterfly | crystal-butterfly | Premium | Original GLB scene | Passed | Pending | Pending |
| 45 | Yaro Royal | yaro-royal | Premium | Original GLB scene | Passed | Pending | Pending |
| 46 | Neon Rings | neon-rings | Special | Original GLB scene | Passed | Pending | Pending |
| 47 | Galaxy Face | galaxy-face | Special | Original GLB scene | Passed | Pending | Pending |
| 48 | Robot Face | robot-face | Special | Original GLB scene | Passed | Pending | Pending |
| 49 | Flame Face | flame-face | Special | Original GLB scene | Passed | Pending | Pending |
| 50 | Yaro Signature | yaro-signature | Special | Original GLB scene | Passed | Pending | Pending |

| Additional beauty preset | Native mode | Source status | Physical preview | Remote viewer |
|---|---|---|---|---|
| Natural Skin | 6 | Shader and native mode exist | Pending | Pending |
| Smooth Skin | 7 | Shader and native mode exist | Pending | Pending |
| Bright Eyes | 8 | Shader and native mode exist | Pending | Pending |
| Lip Tint | 9 | Shader and native mode exist | Pending | Pending |

## Executed checks

| Check | Result for this continuation |
|---|---|
| App/room/live/AR Jest regression suites | 86 tests passed across 14 suites after the custom-preview fix, log at `../scratch/ar-continuation/current-app-regression.log` |
| Backend live/entry/AR regression suites | 36 tests passed after the final backend review changes |
| AR TypeScript check | Passed |
| Backend TypeScript check and production compilation | Passed after live gift context, ranking and concurrent admission fixes |
| Android native FaceSmoother JVM tests | 3 passed in the current build run |
| Bundled registry/model verification | 50 experimental catalog definitions, 45 distinct GLB scenes, zero verified effects |
| Face Landmarker SHA-256 | `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff` matched |
| Earlier Android debug and release build | Passed in 25m 49s |
| Earlier release APK inspection | All 45 source GLB hashes, 50 manifests, Face Landmarker model, beauty shader and license passed. Packaged arm64 MediaPipe ELF load segments support 16 KB alignment |
| Final Android build after latest source edits | Running, log at `../scratch/ar-continuation/device-fix-build.log` |
| Candidate APK installation | 0.2.2/code 22 installed successfully on I2011 and RMX3940 while preserving app data |
| This continuation?s camera/face/GPU device tests | Pending |
| Remote Agora video and actual audio | Pending |
| iOS build and device tests | Pending, requires Mac/Xcode and iPhone |

No FPS or thermal performance measurement has been recorded for this continuation.

## Android artifacts and device inventory

The earlier successful release output is `android/app/build/outputs/apk/release/app-release.apk`, application ID `yaro.vc.app`, version 0.2.2/code 22, 198,344,324 bytes. Latest source edits require the final rebuild now in progress. The standard debug output is `android/app/build/outputs/apk/debug/app-debug.apk`.

| Device | Android | Installed version observed | Actual result |
|---|---|---|---|
| I2011 | 13 | 0.2.1/code 21 | ADB package inspection succeeded, connection dropped before new APK installation |
| RMX3940 | 16 | 0.2.1/code 21 | ADB package inspection succeeded, connection dropped before new APK installation |

Wireless ADB transports briefly connected. A later ADB inventory was empty and reconnecting to the discovered RMX3940 service returned connection refused. Installation and live-camera tests await a stable device connection.

## Agora acceptance and remaining work

| Acceptance area | Actual state |
|---|---|
| Local processed preview | Native/custom-source path exists and controller tests pass. Physical preview pending |
| Outgoing processed frames | Native adapter pushes through installed Iris/Agora APIs and selection waits for successful frame submission. Current real-camera publication pending |
| Remote processed video | Two-device confirmation pending |
| Microphone audio with effects | Actual listening test pending |
| Gifts and entry assets on a second device | Client/backend regressions pass. Production backend deployed and healthy, two-device verification pending |
| Front/rear camera, moving-face tracking and cleanup | Physical camera acceptance pending |
| Existing live sockets, gifts, wallet and co-host flows | Automated regression coverage passed within the tested scope. Full live acceptance pending |
| iOS | Source present. Pod resolution, build, Metal rendering, camera and Agora device validation pending |
| Video calling | Dedicated video-call implementation remains absent from the earlier screen/engine inventory |
| Background segmentation | Unavailable until segmentation is implemented |

Backend source changes have not been deployed to the API used by the installed applications. Device tests against that API require the corresponding server version. Final acceptance remains open until the required installation, camera, audio, remote-video and media-delivery checks complete.

## Reproduction commands

From `YaroApp` run the asset and AR type checks, followed by the targeted test suites used for the current results.

```powershell
node scripts/verify-yaro-ar-assets.cjs
node scripts/verify-yaro-ar-models.cjs
node node_modules/typescript/bin/tsc -p tsconfig.yaro-ar.json --pretty false
node node_modules/jest/bin/jest.js src/__tests__/roomEntrance.test.js src/__tests__/roomEmoji.test.js src/__tests__/roomMicState.test.js src/__tests__/roomCosmeticVisibility.test.js src/__tests__/giftRecipients.test.js src/__tests__/createLive.test.js src/__tests__/giftDelivery.test.js src/__tests__/roomEvents.test.js src/__tests__/liveStream.test.js src/__tests__/yaroARLifecycle.test.js src/__tests__/yaroAR.test.js --runInBand --watchman=false --testTimeout=30000
cd android
.\gradlew.bat :app:assembleDebug :app:assembleRelease :app:testDebugUnitTest --tests yaro.vc.app.ar.FaceSmootherTest --console=plain --max-workers=2
cd ..
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-yaro-ar-apk.ps1 -ApkPath android/app/build/outputs/apk/release/app-release.apk
```

From `YaroServer` run the backend checks.

```powershell
node node_modules/typescript/bin/tsc --noEmit --pretty false
node --test -r ts-node/register/transpile-only src/tests/liveBroadcast.test.cjs src/tests/liveMediaSocket.test.cjs src/tests/roomEntrance.test.ts src/tests/arValidation.test.ts src/tests/arRoutes.test.cjs
```

---

# Historical implementation report

The preserved text below records the earlier five-beauty implementation stage and its historical checks. Current status and acceptance are recorded above.

# YaroAR implementation and verification report

## Phase 1: pre-change audit (2026-11-16)

This audit was written before changing application or native source for this request.

| Area | Observed source and version |
|---|---|
| React Native / React | package.json: 0.81.4 / 19.1.4; existing app is mostly JavaScript |
| TypeScript | Installed 5.8.x; no app tsconfig.json exists |
| Android | Namespace yaro.vc.app; SDK min 24, compile/target 36; Kotlin 2.2.0; JVM 17; Gradle wrapper 8.13; declared AGP 8.5.2 |
| Architecture | android/gradle.properties: newArchEnabled=false, Hermes enabled |
| iOS | MyNewApp target, Swift 5, deployment target 15.1; Podfile uses RN supported minimum |
| Agora | react-native-agora 4.6.2; Android agora-special-full 4.6.2.70 and iris-rtc 4.6.2-build.1; matching iOS pod constraints |
| Live Start | src/screens/user/CreateLiveScreen.js: existing Agora camera preview, permission request, room settings and Start live action |
| Live | src/screens/user/LiveStreamScreen.js: host/viewer/co-host capture, heartbeat, socket events, gifts and wallet |
| Audio rooms | src/context/VoiceRoomContext.js, src/services/agoraService.js; do not take over their engine/audio |
| Video calling | No separate video-calling implementation found by source-wide searches for createAgoraRtcEngine/RtcSurfaceView; no integration may be claimed for a nonexistent screen |
| Navigation | Existing AppStack and BottomTabsNavigator; CreateLive is a bottom tab with the app tab bar already hidden |
| Menus/design | Existing LiveToolsBottomSheet and LiveConnectionSheet; Ionicons/MaterialCommunityIcons, gradients, pink/purple and teal camera controls, safe-area insets |
| Working tree | Existing unrelated edits in live controls, live screen and bottom navigator must be preserved |

### Compatibility and capture decision

Do not upgrade RN or Agora. The installed Agora binding exposes createCustomVideoTrack, destroyCustomVideoTrack, getNativeHandle and the versioned Iris MediaEngine_pushVideoFrame_4e544e2 operation. Frame payloads must remain native. Never use JS pushVideoFrame for image data, start a second Agora engine, or open CameraX concurrently with Agora camera capture.

The proposed custom capture pipeline must explicitly stop Agora local capture before native capture starts, publish only the custom video track, and restore capture on any initialization failure. Existing microphone, joins, tokens and socket ownership stay with the existing screen. An unavailable native capability must produce an explicit pending/unavailable state; catalog selection alone does not count as rendering.

MediaPipe Tasks Vision 0.10.21 is the initial pinned integration candidate on both platforms, not latest.release. Its API is documented by Google; Apache-2.0 code license. The official face_landmarker float16/1 model and license/attribution must be bundled and its SHA-256 recorded. This candidate is not declared runtime-compatible until native builds and physical-device tests pass. Filament is not added before the native GPU pipeline is verified.

### Environment limits discovered during audit

This is a Windows host. Xcode/CocoaPods/iOS device validation are unavailable here. The configured Android SDK directory cannot be inspected under the default filesystem permissions; a native build must be attempted and its actual result recorded. Dependency/model retrieval and native linkage remain separately verifiable prerequisites, not assumed successes.

### Primary references checked

- Installed react-native-agora/src/IAgoraRtcEngine.ts and src/impl/IAgoraMediaEngineImpl.ts: exact track and Iris API signatures.
- Installed react-native-agora/android/src/main/java/io/agora/rtc/ng/react/AgoraRtcNgModule.java and ios/AgoraRtcNg.h/.mm: existing native Iris engine ownership.
- https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker
- https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE
- https://github.com/google-ai-edge/mediapipe-samples/blob/main/examples/face_landmarker/android/app/download_tasks.gradle

## Implementation/verification log

Only executed checks are marked passed. Native source, catalog definitions, rendered effects, published frames and remote-device verification are separate milestones. This is a partial phased implementation, not acceptance of all 50 effects as finished.

Dependency correction during implementation: Android tasks-vision is pinned to 0.10.26 rather than the initial 0.10.21 candidate because upstream identifies 0.10.26 as supporting 16 KB native page sizes. iOS remains pinned to 0.10.21 and requires a Mac build; platform binary packages need not have identical version numbers to share the same model/effect contract. Reference: https://github.com/google-ai-edge/mediapipe/issues/6028 and https://github.com/google-ai-edge/mediapipe/releases/tag/v0.10.26 .

## Implemented source and behavior

- Shared typed registry/controller/hooks/UI under `src/features/YaroAR`. Exactly 50 independently stored definitions, manifests and original SVG catalog illustrations. Five beauty definitions are experimental; 45 decorative definitions explicitly reject selection while their original assets are missing. No missing model is represented as a working filter.
- Original face-aware GLES and Metal beauty shaders: Yaro Beauty, Pink Glow, Rosy Cheeks, Soft Makeup and Golden Shine. Skin smoothing excludes eyes and lips; blush, tint and warmth are distinct shader modes. Bright Eyes and the dedicated Lip Tint preset remain pending.
- Android MediaPipe tracking retains landmarks, blendshapes and facial matrices natively, smooths geometry and expires stale face data. CPU inference uses one bounded in-flight slot; GL rendering and camera callbacks share a native handler thread. Reusable RGBA buffers feed the existing native Iris engine, without frame data crossing JavaScript.
- Android uses Camera2 rather than CameraX, avoiding an additional capture dependency. The controller stops ordinary Agora capture before native capture starts. Cleanup waits for the native camera to close before restoring ordinary capture. Filter switching changes shader mode/intensity without leaving the channel or restarting the camera.
- iOS source implements AVFoundation capture, MediaPipe tracking, a Metal compute renderer, a pixel-buffer pool and native BGRA delivery to the existing Iris engine. A local CocoaPod registers Swift/Objective-C++ sources, model, shader and licenses. iOS compilation and behavior are unverified here.
- Existing Live Start has the five inline feature tabs. Existing title, cover, channel, room mode, share and Start live actions remain. The public Agora configuration service replaces the old hard-coded preview App ID. Camera ownership is released on focus loss and before the live screen takes over.
- Existing live tools expose Beauty and Effects. The co-host preview uses the same panel; preview-only AR does not enable publication until host acceptance. Only outgoing local video changes; microphone options, joins, token renewal, gifts, wallet and socket ownership remain with the existing live screen.
- Effects is also available from the existing Me service menu. ARFilterStudio is a catalog entry, not a second camera screen. Background replacement stays explicitly pending because segmentation is not implemented.
- Optional server catalog/admin routes exist at `/api/ar/*` and `/api/admin/ar/*`. Management reuses existing authentication and store-manager roles. Deletion disables metadata rather than deleting bundled offline files. Available remote assets require HTTPS URLs and a SHA-256 hash. No remote code/asset execution or remote binary loading is enabled.

## Completed checks so far

| Check | Actual result |
|---|---|
| AR controller and existing live regression suite | 17 tests passed, including native-unavailable fallback, camera ownership, failed-start rollback, background restoration, preview-only publication, co-host/chat/gift regression |
| Server metadata validation and route tests | 9 tests passed, including all admin mutation auth boundaries, create/update/activate/soft-delete and invalid asset metadata |
| YaroAR TypeScript check | Passed with `tsconfig.yaro-ar.json` |
| Backend TypeScript check | Passed |
| Android debug build | Passed; final native test build is recorded separately below |
| Android native smoothing tests | 3 JVM tests passed; these do not count as device face tracking or GPU tests |
| Bundled asset verification | 50 unique expected names, 5 experimental definitions, 45 pending definitions, zero verified effects; matching manifests/thumbnails; official model SHA-256 verified |
| APK contents / MediaPipe ELF alignment | Model, GLSL shader and license present; packaged arm64 MediaPipe load segments support 16 KB alignment |
| Android production JavaScript bundle | Generated successfully; existing Firebase package-export fallback warnings remain |
| Physical-device native tests | 3 passed on one connected arm64 Android device: offline face detection/loss/recovery with landmarks/matrices/blendshapes, five distinct actual GLES outputs with preserved eye pixels, and the installed Agora SDK accepting the exact custom-frame contract |
| iOS build, device rendering and publishing | Not executed: requires macOS/Xcode/CocoaPods |
| Live remote video, call remote video, actual microphone audio, thermal soak and network interruption | Not executed / pending |

## Pending deliverables and limits

1. Original rigged GLB models, textures and animations for the remaining 45 decorative effects. Their illustrations are catalog artwork only, not proof of AR rendering.
2. General GLB/face-mesh/particle/animation rendering and equivalent Metal support. The implemented renderer currently supports the five beauty shaders only; it is not a completed general 3D engine.
3. Segmentation-based background blur/replacement and dedicated Bright Eyes/Lip Tint beauty modes.
4. Video-call integration: no corresponding caller/receiver screen or video-call engine was found in the current checkout. No duplicate call screen was invented.
5. iOS dependency resolution, compile/link validation, physical-device camera/Metal/Agora verification and memory testing on a Mac.
6. End-to-end outgoing camera/processed local preview/remote viewer verification, camera orientation across devices, audio verification and measured 24–30 FPS/thermal behavior. Targets are not measurements.
7. Persistent favorites across process restarts and a trusted, hash-verified remote asset download/update pipeline. Current favorites are session-local; downloaded view refers to locally bundled supported effects.

The native controller is intentionally opt-in. Selecting an unavailable effect keeps ordinary video capture intact. No effect is marked verified in the catalog before device and publication checks are complete.

The physical tests use a public Google portrait fixture and a native offscreen GPU surface. The Agora check initializes a local SDK engine and pushes a synthetic frame without joining a channel. These results are not a claim that a physical camera session, remote viewer, video call or iOS device has passed. Device GPU testing exposed a vertical mask-coordinate error; sampling coordinates and landmark-mask coordinates were separated, and the same test then passed for all five shader modes.

The temporary QA app and instrumentation package were removed after testing. The existing installed Yaro package remained at version 0.2.1/code 21. Catalog verification remains experimental across platforms because end-to-end publication and iOS acceptance are still pending. Executed automated checks total 32 tests: 17 app/controller tests, 9 backend tests, 3 native JVM tests and 3 physical-device instrumentation tests.

## Build and test commands

From `YaroApp`:

```powershell
node scripts/verify-yaro-ar-assets.cjs
node node_modules/typescript/bin/tsc -p tsconfig.yaro-ar.json --pretty false
node node_modules/jest/bin/jest.js src/__tests__/yaroAR.test.js src/__tests__/liveStream.test.js --runInBand --watchman=false --testTimeout=30000
cd android
.\gradlew.bat :app:assembleDebug :app:testDebugUnitTest --tests yaro.vc.app.ar.FaceSmootherTest --console=plain --max-workers=2
cd ..
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-yaro-ar-apk.ps1
```

Normal debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`. A debug build requires Metro; a separate production JS bundle was checked in scratch without replacing the repository's existing embedded bundle.

Release build, when ready for device acceptance:

```powershell
cd YaroApp/android
.\gradlew.bat :app:assembleRelease --console=plain --max-workers=2
```

On a Mac, from `YaroApp` (not executed in this environment):

```sh
cd ios
bundle exec pod install
xcodebuild -workspace MyNewApp.xcworkspace -scheme MyNewApp -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

The test-only instrumentation init script uses the same existing app source with ID `yaro.vc.app.arqa` and no second camera UI. It is isolated from the user's installed app. Build with `gradlew -I ../scripts/ar-instrumentation.init.gradle :app:assembleDebug :app:assembleDebugAndroidTest`; install only the resulting QA APK and its instrumentation APK on a selected test device. Rebuild normally afterward to restore the standard output artifact ID.
