import Foundation
import Metal
import CoreVideo

struct ARUniforms {
  var face:SIMD4<Float>; var eyes:SIMD4<Float>; var mouth:SIMD4<Float>; var cheeks:SIMD4<Float>
  var adjust=SIMD4<Float>(0,1,1,0); var intensity:Float=0.5; var beauty:Float=0.5; var sharpness:Float=0; var mode:UInt32=0
}
final class YaroARRenderer {
  private let device:MTLDevice
  private let queue:MTLCommandQueue
  private let pipeline:MTLComputePipelineState
  private let models:GLBEffectRenderer
  private let animationEpoch=ProcessInfo.processInfo.systemUptime
  private var cache:CVMetalTextureCache?
  private var pool:CVPixelBufferPool?
  private var dimensions=SIMD2<Int>(0,0)
  init() throws {
    guard let device=MTLCreateSystemDefaultDevice(),let queue=device.makeCommandQueue(),let url=arResource("beauty","metal") else { throw YaroARError.unavailable("Metal AR resources unavailable") }
    self.device=device; self.queue=queue
    models=try GLBEffectRenderer(device:device)
    let library=try device.makeLibrary(source:String(contentsOf:url,encoding:.utf8),options:nil)
    guard let function=library.makeFunction(name:"yaroBeauty") else { throw YaroARError.unavailable("AR Metal shader missing") }
    pipeline=try device.makeComputePipelineState(function:function)
    guard CVMetalTextureCacheCreate(nil,nil,device,nil,&cache)==kCVReturnSuccess else { throw YaroARError.unavailable("Metal texture cache failed") }
  }
  private func texture(_ buffer:CVPixelBuffer,usage:MTLTextureUsage = .shaderRead) throws -> (MTLTexture,CVMetalTexture) {
    var cv:CVMetalTexture?
    let attributes=[kCVMetalTextureUsage as String:usage.rawValue] as CFDictionary
    guard let cache=cache,CVMetalTextureCacheCreateTextureFromImage(nil,cache,buffer,attributes,.bgra8Unorm,CVPixelBufferGetWidth(buffer),CVPixelBufferGetHeight(buffer),0,&cv)==kCVReturnSuccess,let cv=cv,let texture=CVMetalTextureGetTexture(cv) else { throw YaroARError.unavailable("AR pixel buffer texture failed") }
    return (texture,cv)
  }
  func model(_ id:String?) throws { try models.load(id) }
  func render(_ input:CVPixelBuffer,uniforms:ARUniforms,face:FaceLandmarkData) throws -> CVPixelBuffer {
    let width=CVPixelBufferGetWidth(input),height=CVPixelBufferGetHeight(input)
    if dimensions != SIMD2(width,height) {
      dimensions=SIMD2(width,height)
      let attributes:[String:Any]=[kCVPixelBufferPixelFormatTypeKey as String:kCVPixelFormatType_32BGRA,kCVPixelBufferWidthKey as String:width,kCVPixelBufferHeightKey as String:height,kCVPixelBufferMetalCompatibilityKey as String:true,kCVPixelBufferIOSurfacePropertiesKey as String:[:]]
      guard CVPixelBufferPoolCreate(nil,[kCVPixelBufferPoolMinimumBufferCountKey:3] as CFDictionary,attributes as CFDictionary,&pool)==kCVReturnSuccess else { throw YaroARError.unavailable("AR pixel buffer pool failed") }
    }
    var output:CVPixelBuffer?
    guard let pool=pool,CVPixelBufferPoolCreatePixelBuffer(nil,pool,&output)==kCVReturnSuccess,let output=output else { throw YaroARError.unavailable("AR output frame allocation failed") }
    let (source,sourceCV)=try texture(input), (target,targetCV)=try texture(output,usage:[.shaderRead,.shaderWrite,.renderTarget])
    guard let command=queue.makeCommandBuffer(),let encoder=command.makeComputeCommandEncoder() else { throw YaroARError.unavailable("Metal command creation failed") }
    var parameters=uniforms
    encoder.setComputePipelineState(pipeline); encoder.setTexture(source,index:0); encoder.setTexture(target,index:1)
    encoder.setBytes(&parameters,length:MemoryLayout<ARUniforms>.stride,index:0)
    encoder.dispatchThreads(MTLSize(width:width,height:height,depth:1),threadsPerThreadgroup:MTLSize(width:8,height:8,depth:1)); encoder.endEncoding()
    try models.draw(command:command,target:target,face:face,intensity:uniforms.intensity,time:Float(ProcessInfo.processInfo.systemUptime-animationEpoch))
    command.commit(); command.waitUntilCompleted()
    withExtendedLifetime((sourceCV,targetCV)) {}
    if let error=command.error { throw error }; return output
  }
  func releaseResources() { pool=nil; if let cache=cache { CVMetalTextureCacheFlush(cache,0) } }
}
