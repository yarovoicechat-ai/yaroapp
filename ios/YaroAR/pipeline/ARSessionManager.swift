import AVFoundation
import Foundation

final class ARSessionManager:NSObject,AVCaptureVideoDataOutputSampleBufferDelegate {
  static let effectIds=["yaro-beauty","pink-glow","rosy-cheeks","soft-makeup","golden-shine","natural-skin","smooth-skin","bright-eyes","lip-tint",
  "puppy","bunny","kitty","panda","fox","royal-crown","heart-glasses","butterfly-hair","golden-earrings","cyber-headset","angel","devil","fairy","ice-queen","fire-king","anime-eyes","anime-blush","magic-eyes","anime-cat","star-eyes","love-hearts","cry-baby","funny-face","happy-spark","angry-face","butterflies","flower-crown","snowfall","star-shower","rainbow-aura","birthday","disco-king","confetti","neon-party","gold-rain","diamond-face","hologram","dragon-mask","crystal-butterfly","yaro-royal","neon-rings","galaxy-face","robot-face","flame-face","yaro-signature"]
  private let captureQueue=DispatchQueue(label:"in.yaro.ar.capture",qos:.userInitiated)
  private let frameQueue=DispatchQueue(label:"in.yaro.ar.frames",qos:.userInitiated)
  private let lock=NSLock()
  private var camera:ARCameraManager?
  private var tracker:FaceLandmarkerEngine?
  private var renderer:YaroARRenderer?
  private let adapter=YaroAgoraARAdapter()
  private let trackId:Int, fps:Int, front:Bool
  private var uniform=ARUniforms(face:.zero,eyes:.zero,mouth:.zero,cheeks:.zero)
  private var previousFrame=0,previousTrack=0,previousStats=0,frames=0
  private var bytes=NSMutableData()
  private var ready:((Error?)->Void)?
  private var selection:(id:String, mode:UInt32, complete:(Error?)->Void)?
  private var modelId:String?
  private var running=false
  private let emit:(String,[String:Any])->Void
  init(trackId:Int,fps:Int,front:Bool,emit:@escaping(String,[String:Any])->Void) { self.trackId=trackId;self.fps=fps;self.front=front;self.emit=emit }
  func start(_ complete:@escaping(Error?)->Void) { captureQueue.async { [self] in
    do {
      lock.lock(); let active=running; lock.unlock(); if active { complete(nil); return }
      renderer=try YaroARRenderer()
      try renderer?.model(modelId)
      tracker=try FaceLandmarkerEngine(changed:{ [weak self] present in self?.emit(present ? "onFaceDetected":"onFaceLost",[:]) },failed:{ [weak self] error in self?.fail(error) })
      let capture=ARCameraManager(); try capture.configure(front:front,delegate:self,queue:frameQueue); camera=capture
      lock.lock(); running=true; ready=complete; previousFrame=0; previousTrack=0; previousStats=0; frames=0; lock.unlock()
      capture.start()
      captureQueue.asyncAfter(deadline:.now()+10) { [weak self] in
        guard let self=self else { return }; self.lock.lock();let pending=self.ready != nil;self.lock.unlock()
        if pending { self.fail(YaroARError.unavailable("AR camera did not deliver frames within 10 seconds")) }
      }
    } catch { cleanup(); complete(error) }
  } }
  func captureOutput(_ output:AVCaptureOutput,didOutput sampleBuffer:CMSampleBuffer,from connection:AVCaptureConnection) {
    lock.lock(); let active=running;var parameters=uniform;lock.unlock();guard active else { return }
    let now=Int(ProcessInfo.processInfo.systemUptime*1000)
    guard now-previousFrame>=1000/fps,let input=CMSampleBufferGetImageBuffer(sampleBuffer),let renderer=renderer else { return }; previousFrame=now
    do {
      if now-previousTrack>=83 { previousTrack=now;tracker?.offer(input,timestamp:now) }
      let latest=tracker?.latest() ?? FaceLandmarkData()
      let face=now-latest.timestamp<250 ? latest : FaceLandmarkData()
      if now-face.timestamp<250 { parameters.face=face.face;parameters.eyes=face.eyes;parameters.mouth=face.mouth;parameters.cheeks=face.cheeks }
      let processed=try renderer.render(input,uniforms:parameters,face:face)
      CVPixelBufferLockBaseAddress(processed,.readOnly); defer { CVPixelBufferUnlockBaseAddress(processed,.readOnly) }
      let width=CVPixelBufferGetWidth(processed),height=CVPixelBufferGetHeight(processed),stride=CVPixelBufferGetBytesPerRow(processed)
      guard let base=CVPixelBufferGetBaseAddress(processed) else { throw YaroARError.unavailable("GPU readback failed") }
      bytes.length=width*height*4
      for row in 0..<height { memcpy(bytes.mutableBytes.advanced(by:row*width*4),base.advanced(by:row*stride),width*4) }
      try adapter.pushBGRA(bytes,width:width,height:height,timestamp:now,trackId:trackId)
      lock.lock()
      let selected = selection?.mode == parameters.mode ? selection : nil
      if selected != nil { selection=nil }
      lock.unlock()
      if let selected=selected { emit("onEffectChanged",["effectId":selected.id]);selected.complete(nil) }
      lock.lock();let callback=ready;ready=nil;lock.unlock()
      if let callback=callback { emit("onARReady",["trackId":trackId]);callback(nil) }
      frames+=1
      if previousStats==0 { previousStats=now }
      if now-previousStats>=1000 { emit("onPerformanceUpdate",["fps":Double(frames)*1000/Double(now-previousStats),"queuedFrames":0]);frames=0;previousStats=now }
    } catch { fail(error) }
  }
  private func fail(_ error:Error) { captureQueue.async { [self] in
    lock.lock();let callback=ready;ready=nil;lock.unlock();cleanup();callback?(error);emit("onARError",["message":error.localizedDescription])
  } }
  private func cleanup() {
    lock.lock();running=false;let pending=selection;selection=nil;lock.unlock()
    pending?.complete(YaroARError.unavailable("AR stopped before the selected effect rendered"))
    camera?.stop();camera=nil
    frameQueue.sync { tracker?.close();tracker=nil;renderer?.releaseResources();renderer=nil;bytes.length=0 }
  }
  func stop(_ done:@escaping()->Void) { captureQueue.async { [self] in
    lock.lock();let callback=ready;ready=nil;lock.unlock();cleanup();callback?(YaroARError.unavailable("AR session stopped"));done()
  } }
  func setEffect(_ id:String,complete:@escaping(Error?)->Void) {
    guard let mode=Self.effectIds.firstIndex(of:id) else { complete(YaroARError.unavailable("Effect assets are pending"));return }
    frameQueue.async { [self] in
    lock.lock()
    guard running else { lock.unlock();complete(YaroARError.unavailable("AR camera is not running"));return }
    lock.unlock()
    do { try renderer?.model(mode>=9 ? id : nil) } catch { complete(error);return }
    lock.lock()
    let previous=selection
    modelId=mode>=9 ? id : nil
    uniform.mode=mode<9 ? UInt32(mode+1):0;selection=(id,uniform.mode,complete);lock.unlock()
    previous?.complete(YaroARError.unavailable("Effect selection superseded"))
    captureQueue.asyncAfter(deadline:.now()+10) { [weak self] in
      guard let self=self else { return }
      self.lock.lock();let pending=self.selection?.id == id ? self.selection : nil
      if pending != nil { self.selection=nil };self.lock.unlock()
      pending?.complete(YaroARError.unavailable("Selected effect did not render within 10 seconds"))
    }
    }
  }
  func intensity(_ value:Float) { lock.lock();uniform.intensity=min(1,max(0,value));lock.unlock() }
  func beauty(_ value:Float) { lock.lock();uniform.beauty=min(1,max(0,value));lock.unlock() }
  func adjust(_ values:SIMD4<Float>,sharpness:Float) { lock.lock();uniform.adjust=values;uniform.sharpness=sharpness;lock.unlock() }
  func removeEffect() { frameQueue.async { [self] in lock.lock();uniform.mode=0;modelId=nil;lock.unlock();try? renderer?.model(nil) } }
}
