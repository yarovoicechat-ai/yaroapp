import Foundation
import MediaPipeTasksVision
import CoreVideo

enum YaroARError: LocalizedError {
  case unavailable(String)
  var errorDescription: String? { if case let .unavailable(message)=self { return message }; return nil }
}
func arResource(_ name: String, _ ext: String) -> URL? {
  let module=Bundle(for: YaroARModule.self)
  let url=module.url(forResource: "YaroARResources", withExtension: "bundle") ?? Bundle.main.url(forResource: "YaroARResources", withExtension: "bundle")
  return url.flatMap { Bundle(url:$0) }?.url(forResource:name,withExtension:ext)
}
final class FaceLandmarkerEngine {
  private let queue=DispatchQueue(label:"in.yaro.ar.tracking",qos:.userInitiated)
  private let lock=NSLock()
  private var busy=false, closed=false, detected=false
  private var detector: FaceLandmarker?
  private var data=FaceLandmarkData()
  private let smoother=FaceSmoother()
  private let changed:(Bool)->Void
  private let failed:(Error)->Void
  init(changed:@escaping(Bool)->Void,failed:@escaping(Error)->Void) throws {
    self.changed=changed; self.failed=failed
    guard let model=arResource("face_landmarker","task") else { throw YaroARError.unavailable("Face tracking model is missing") }
    let options=FaceLandmarkerOptions(); options.baseOptions.modelAssetPath=model.path
    options.runningMode = .video; options.numFaces=1; options.outputFaceBlendshapes=true; options.outputFacialTransformationMatrixes=true
    detector=try FaceLandmarker(options:options)
  }
  func latest() -> FaceLandmarkData { lock.lock(); defer {lock.unlock()}; return data }
  func offer(_ pixelBuffer:CVPixelBuffer,timestamp:Int) {
    lock.lock(); if busy || closed { lock.unlock(); return }; busy=true; lock.unlock()
    queue.async { [self] in
      defer { lock.lock(); busy=false; lock.unlock() }
      do {
        guard let detector=detector else { return }
        let image=try MPImage(pixelBuffer:pixelBuffer)
        let result=try detector.detect(videoFrame:image,timestampInMilliseconds:timestamp)
        let present=(result.faceLandmarks.first?.count ?? 0)>454
        var next=FaceLandmarkData()
        if let p=result.faceLandmarks.first, present {
          func x(_ i:Int)->Float { p[i].x }; func y(_ i:Int)->Float { p[i].y }
          next.face=SIMD4((x(234)+x(454))*0.5,(y(10)+y(152))*0.5,abs(x(454)-x(234))*0.5,abs(y(152)-y(10))*0.5)
          next.eyes=SIMD4((x(33)+x(133))*0.5,(y(33)+y(133))*0.5,(x(362)+x(263))*0.5,(y(362)+y(263))*0.5)
          next.mouth=SIMD4((x(61)+x(291))*0.5,(y(13)+y(14))*0.5,abs(x(291)-x(61))*0.6,abs(y(17)-y(0))*0.65)
          next.cheeks=SIMD4(x(50),y(50),x(280),y(280)); next.landmarks=p.map { SIMD3($0.x,$0.y,$0.z) }
          next.blendshapes=Dictionary(uniqueKeysWithValues:(result.faceBlendshapes.first?.categories ?? []).map { ($0.categoryName ?? "unknown",$0.score) })
          // Native matrices stay native; no landmark telemetry is emitted to JS/backend.
          // Match Android and Metal's column-major matrix convention.
          if let matrix=result.facialTransformationMatrixes.first { next.transformationMatrix=(0..<matrix.columns).flatMap { column in (0..<matrix.rows).map { row in matrix.value(atRow:row,column:column) } } }
          next.timestamp=timestamp; next=smoother.apply(next)
        } else { smoother.reset() }
        lock.lock();if closed {lock.unlock();return};data=next;let transition=present != detected;detected=present;lock.unlock()
        if transition { changed(present) }
      } catch { lock.lock();let active = !closed;lock.unlock();if active {failed(error)} }
    }
  }
  func close() { lock.lock(); closed=true;data=FaceLandmarkData();lock.unlock(); queue.sync { detector=nil } }
}
