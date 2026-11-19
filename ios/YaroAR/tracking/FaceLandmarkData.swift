import Foundation
import simd
struct FaceLandmarkData {
  var face = SIMD4<Float>(repeating: 0)
  var eyes = SIMD4<Float>(repeating: 0)
  var mouth = SIMD4<Float>(repeating: 0)
  var cheeks = SIMD4<Float>(repeating: 0)
  var landmarks: [SIMD3<Float>] = []
  var blendshapes: [String: Float] = [:]
  var transformationMatrix: [Float] = []
  var timestamp: Int = 0
}
final class FaceSmoother {
  private var previous: FaceLandmarkData?
  func reset() { previous = nil }
  func apply(_ input: FaceLandmarkData) -> FaceLandmarkData {
    var output=input
    if let old=previous, input.timestamp-old.timestamp<250 {
      output.face=old.face+(input.face-old.face)*0.35
      output.eyes=old.eyes+(input.eyes-old.eyes)*0.35
      output.mouth=old.mouth+(input.mouth-old.mouth)*0.35
      output.cheeks=old.cheeks+(input.cheeks-old.cheeks)*0.35
      output.landmarks=input.landmarks.enumerated().map { i,p in i<old.landmarks.count ? old.landmarks[i]+(p-old.landmarks[i])*0.35 : p }
    }
    previous=output; return output
  }
}
