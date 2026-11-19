import Foundation
import Metal
import simd

private struct ModelUniforms {
 var face:SIMD4<Float>;var pose0=SIMD4<Float>(1,0,0,0);var pose1=SIMD4<Float>(0,1,0,0);var pose2=SIMD4<Float>(0,0,1,0)
 var centerAnimation:SIMD4<Float>;var timeIntensitySeedRoll:SIMD4<Float>;var color:SIMD4<Float>
}
final class GLBEffectRenderer {
 private struct Part {let buffer:MTLBuffer;let count:Int;let color:SIMD4<Float>;let center:SIMD3<Float>;let animation:Float;let seed:Float}
 private let device:MTLDevice,pipeline:MTLRenderPipelineState,depthPipeline:MTLRenderPipelineState,opaqueDepth:MTLDepthStencilState,transparentDepth:MTLDepthStencilState
 private let outline=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]
 private let occlusionBuffer:MTLBuffer
 private var parts=[Part](),depth:MTLTexture?
 private let animations=["none","fall","rise","flutter","pulse","flame","hover","spin","orbit","tear","scan","jaw","blink"]
 init(device:MTLDevice) throws {
  self.device=device
  guard let url=arResource("model","metal") else {throw YaroARError.unavailable("GLB shader missing")}
  let library=try device.makeLibrary(source:String(contentsOf:url,encoding:.utf8),options:nil)
  let descriptor=MTLRenderPipelineDescriptor();descriptor.vertexFunction=library.makeFunction(name:"yaroModelVertex");descriptor.fragmentFunction=library.makeFunction(name:"yaroModelFragment");descriptor.depthAttachmentPixelFormat = .depth32Float
  let attachment=descriptor.colorAttachments[0]!;attachment.pixelFormat = .bgra8Unorm;attachment.isBlendingEnabled=true;attachment.sourceRGBBlendFactor = .sourceAlpha;attachment.destinationRGBBlendFactor = .oneMinusSourceAlpha;attachment.sourceAlphaBlendFactor = .one;attachment.destinationAlphaBlendFactor = .oneMinusSourceAlpha
  pipeline=try device.makeRenderPipelineState(descriptor:descriptor)
  attachment.writeMask=[];depthPipeline=try device.makeRenderPipelineState(descriptor:descriptor)
  guard let occluder=device.makeBuffer(length:36*3*24,options:.storageModeShared) else {throw YaroARError.unavailable("Face occlusion buffer unavailable")};occlusionBuffer=occluder
  let d=MTLDepthStencilDescriptor();d.depthCompareFunction = .lessEqual;d.isDepthWriteEnabled=true
  guard let opaque=device.makeDepthStencilState(descriptor:d) else {throw YaroARError.unavailable("GLB depth state unavailable")};opaqueDepth=opaque
  d.isDepthWriteEnabled=false
  guard let transparent=device.makeDepthStencilState(descriptor:d) else {throw YaroARError.unavailable("GLB transparency state unavailable")};transparentDepth=transparent
 }
 func load(_ id:String?) throws {
  guard let id=id else {parts=[];return}
  guard id.range(of:"^[a-z0-9-]+$",options:.regularExpression) != nil,let url=arResource(id,"glb") else {throw YaroARError.unavailable("Bundled GLB missing")}
  let data=try Data(contentsOf:url)
  func uint(_ offset:Int)throws->Int {guard offset>=0,offset+4<=data.count else {throw YaroARError.unavailable("Truncated GLB")};return Int(data[offset])|Int(data[offset+1])<<8|Int(data[offset+2])<<16|Int(data[offset+3])<<24}
  guard try uint(0)==0x46546c67,try uint(4)==2,try uint(8)==data.count else {throw YaroARError.unavailable("Invalid GLB header")}
  let length=try uint(12),binaryStart=28+length
  guard binaryStart<=data.count,try uint(16)==0x4e4f534a,try uint(24+length)==0x004e4942,let doc=try JSONSerialization.jsonObject(with:data.subdata(in:20..<20+length)) as? [String:Any],let nodes=doc["nodes"] as? [[String:Any]],let meshes=doc["meshes"] as? [[String:Any]],let accessors=doc["accessors"] as? [[String:Any]],let views=doc["bufferViews"] as? [[String:Any]],let materials=doc["materials"] as? [[String:Any]] else {throw YaroARError.unavailable("Invalid original GLB structure")}
  func floats(_ index:Int)throws->[Float] {
   guard accessors.indices.contains(index),let viewIndex=accessors[index]["bufferView"] as? Int,views.indices.contains(viewIndex),let count=accessors[index]["count"] as? Int,accessors[index]["componentType"] as? Int == 5126,accessors[index]["type"] as? String == "VEC3" else {throw YaroARError.unavailable("Unsupported GLB accessor")}
   let offset=(views[viewIndex]["byteOffset"] as? Int ?? 0)+(accessors[index]["byteOffset"] as? Int ?? 0)+binaryStart
   guard count>0,offset>=binaryStart,offset+count*12<=data.count else {throw YaroARError.unavailable("Invalid GLB buffer bounds")}
   return try (0..<count*3).map {Float(bitPattern:UInt32(try uint(offset+$0*4)))}
  }
  var loaded=[Part]()
  for (index,node) in nodes.enumerated() {
   guard let mesh=node["mesh"] as? Int,meshes.indices.contains(mesh),let primitives=meshes[mesh]["primitives"] as? [[String:Any]] else {throw YaroARError.unavailable("Unsupported GLB node")}
   for primitive in primitives {
    guard primitive["indices"]==nil,(primitive["mode"] as? Int ?? 4)==4,let attrs=primitive["attributes"] as? [String:Int],let pos=attrs["POSITION"],let normal=attrs["NORMAL"],let material=primitive["material"] as? Int,materials.indices.contains(material),let pbr=materials[material]["pbrMetallicRoughness"] as? [String:Any],let color=pbr["baseColorFactor"] as? [Double],color.count==4 else {throw YaroARError.unavailable("Unsupported GLB primitive")}
    let xyz=try floats(pos),normals=try floats(normal);guard xyz.count==normals.count,xyz.count%9==0 else {throw YaroARError.unavailable("Invalid GLB triangles")}
    var interleaved=[Float](),lo=SIMD3<Float>(repeating:Float.greatestFiniteMagnitude),hi = -SIMD3<Float>(repeating:Float.greatestFiniteMagnitude)
    for k in stride(from:0,to:xyz.count,by:3){interleaved.append(contentsOf:xyz[k..<k+3]);interleaved.append(contentsOf:normals[k..<k+3]);let v=SIMD3<Float>(xyz[k],xyz[k+1],xyz[k+2]);lo=simd_min(lo,v);hi=simd_max(hi,v)}
    let buffer=interleaved.withUnsafeBytes {device.makeBuffer(bytes:$0.baseAddress!,length:$0.count,options:.storageModeShared)}
    guard let buffer=buffer else {throw YaroARError.unavailable("GLB GPU upload failed")}
    let animation=(node["extras"] as? [String:String])?["yaroAnimation"] ?? "none"
    loaded.append(Part(buffer:buffer,count:xyz.count/3,color:SIMD4<Float>(Float(color[0]),Float(color[1]),Float(color[2]),Float(color[3])),center:(lo+hi)/2,animation:Float(animations.firstIndex(of:animation) ?? 0),seed:(Float(index)*1.618).truncatingRemainder(dividingBy:5)))
   }
  }
  guard !loaded.isEmpty else {throw YaroARError.unavailable("Empty GLB scene")};parts=loaded
 }
 func draw(command:MTLCommandBuffer,target:MTLTexture,face:FaceLandmarkData,intensity:Float,time:Float)throws {
  guard !parts.isEmpty,face.face.z>0,intensity>0 else {return}
  if depth?.width != target.width || depth?.height != target.height {let d=MTLTextureDescriptor.texture2DDescriptor(pixelFormat:.depth32Float,width:target.width,height:target.height,mipmapped:false);d.storageMode = .private;d.usage = .renderTarget;depth=device.makeTexture(descriptor:d)}
  guard let depth=depth else {throw YaroARError.unavailable("GLB depth texture unavailable")}
  let pass=MTLRenderPassDescriptor();pass.colorAttachments[0].texture=target;pass.colorAttachments[0].loadAction = .load;pass.colorAttachments[0].storeAction = .store;pass.depthAttachment.texture=depth;pass.depthAttachment.loadAction = .clear;pass.depthAttachment.clearDepth=1;pass.depthAttachment.storeAction = .dontCare
  guard let encoder=command.makeRenderCommandEncoder(descriptor:pass) else {throw YaroARError.unavailable("GLB render encoder unavailable")}
  encoder.setRenderPipelineState(pipeline);encoder.setCullMode(.none)
  let positions=occlusionBuffer.contents().assumingMemoryBound(to:Float.self);var cursor=0
  func vertex(_ index:Int){
   var p=SIMD3<Float>(0,0,-.001)
   if index>=0 {if face.landmarks.count>454 {let v=face.landmarks[outline[index%outline.count]];p.x=(v.x-face.face.x)/face.face.z;p.y = -(v.y-face.face.y)/face.face.w} else {let angle=Float(index)*2*Float.pi/Float(outline.count);p.x=cos(angle);p.y=sin(angle)}}
   for value in [p.x,p.y,p.z,0,0,1]{positions[cursor]=value;cursor+=1}
  }
  for i in outline.indices {vertex(-1);vertex(i);vertex((i+1)%outline.count)}
  var mask=ModelUniforms(face:face.face,centerAnimation:.zero,timeIntensitySeedRoll:SIMD4<Float>(time,1,0,0),color:SIMD4<Float>(repeating:1))
  encoder.setRenderPipelineState(depthPipeline);encoder.setDepthStencilState(opaqueDepth);encoder.setVertexBuffer(occlusionBuffer,offset:0,index:0);encoder.setVertexBytes(&mask,length:MemoryLayout<ModelUniforms>.stride,index:1);encoder.setFragmentBytes(&mask,length:MemoryLayout<ModelUniforms>.stride,index:0);encoder.drawPrimitives(type:.triangle,vertexStart:0,vertexCount:outline.count*3)
  encoder.setRenderPipelineState(pipeline)
  for transparent in [false,true] {for p in parts where (p.color.w<1)==transparent {
   var u=ModelUniforms(face:face.face,centerAnimation:SIMD4<Float>(p.center,p.animation),timeIntensitySeedRoll:SIMD4<Float>(time,intensity,p.seed,-atan2(face.eyes.w-face.eyes.y,face.eyes.z-face.eyes.x)),color:p.color)
   if face.transformationMatrix.count==16 {let m=face.transformationMatrix,yaw=atan2(-m[2],m[10]),pitch=atan2(m[6],m[5]),cy=cos(yaw),sy=sin(yaw),cx=cos(pitch),sx=sin(pitch);u.pose0=SIMD4<Float>(cy,0,-sy,0);u.pose1=SIMD4<Float>(sy*sx,cx,cy*sx,0);u.pose2=SIMD4<Float>(sy*cx,-sx,cy*cx,0)}
   u.pose0.w=min(1,max(0,face.blendshapes["jawOpen"] ?? 0));u.pose1.w=min(1,max(face.blendshapes["eyeBlinkLeft"] ?? 0,face.blendshapes["eyeBlinkRight"] ?? 0))
   encoder.setDepthStencilState(transparent ? transparentDepth:opaqueDepth);encoder.setVertexBuffer(p.buffer,offset:0,index:0);encoder.setVertexBytes(&u,length:MemoryLayout<ModelUniforms>.stride,index:1);encoder.setFragmentBytes(&u,length:MemoryLayout<ModelUniforms>.stride,index:0);encoder.drawPrimitives(type:.triangle,vertexStart:0,vertexCount:p.count)
  }}
  encoder.endEncoding()
 }
}
