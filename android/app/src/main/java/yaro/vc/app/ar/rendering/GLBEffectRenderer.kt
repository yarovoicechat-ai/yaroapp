package yaro.vc.app.ar.rendering

import android.content.Context
import android.opengl.GLES20 as GL
import org.json.JSONObject
import yaro.vc.app.ar.tracking.FaceLandmarkData
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.atan2

/** Strict loader for the bundled original GLB triangle scenes; never loads URLs. */
class GLBEffectRenderer(private val context:Context):AutoCloseable {
 private data class Part(val buffer:Int,val count:Int,val color:FloatArray,val center:FloatArray,val animation:Int,val seed:Float)
 private var parts=emptyList<Part>()
 private val pose=FloatArray(9)
 private val outline=intArrayOf(10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109)
 private val occluder=ByteBuffer.allocateDirect(outline.size*3*24).order(ByteOrder.nativeOrder()).asFloatBuffer()
 private val occlusionBuffer=IntArray(1)
 private val identity=floatArrayOf(1f,0f,0f,0f,1f,0f,0f,0f,1f)
 private val animations=listOf("none","fall","rise","flutter","pulse","flame","hover","spin","orbit","tear","scan","jaw","blink")
 private val vertex="""
 attribute vec3 aPosition;attribute vec3 aNormal;
 uniform vec4 uFace;uniform mat3 uPose;uniform float uRoll;uniform float uTime;
 uniform float uAnimation;uniform float uSeed;uniform vec3 uCenter;uniform vec2 uExpression;
 varying vec3 vNormal;varying float vGlow;varying float vAlpha;
 void main(){
  vec3 p=aPosition;float t=uTime;float phase=t*2.8+uSeed;
  vGlow=1.0;vAlpha=1.0;
  if(uAnimation==1.0)p.y=mod(p.y-t*.65+uSeed+3.0,4.0)-2.0;
  if(uAnimation==2.0)p.y=mod(p.y+t*.43+uSeed+3.0,4.0)-2.0;
  if(uAnimation==3.0){p.z+=sin(phase)*abs(p.x-uCenter.x)*.65;p.x+=sin(t+uSeed)*.045;}
  if(uAnimation==4.0 || uAnimation==10.0)vGlow=.65+.35*sin(phase);
  if(uAnimation==5.0){p.x+=sin(p.y*9.0+phase)*.035;p.y+=sin(phase)*.045;}
  if(uAnimation==6.0)p.y+=sin(t*1.7)*.07;
  if(uAnimation==7.0){vec3 d=p-uCenter;float a=t*.7;p=uCenter+vec3(d.x*cos(a)+d.z*sin(a),d.y,-d.x*sin(a)+d.z*cos(a));}
  if(uAnimation==8.0){float a=sin(t*.8)*.25;vec2 q=p.xy;p.xy=vec2(q.x*cos(a)-q.y*sin(a),q.x*sin(a)+q.y*cos(a));}
  if(uAnimation==9.0)p.y-=mod(t*.4+uSeed, .24);
  if(uAnimation==11.0){p.y-=uExpression.x*.25;vAlpha=smoothstep(.08,.25,uExpression.x);}
  if(uAnimation==12.0){p.y=uCenter.y+(p.y-uCenter.y)*max(.03,1.0-uExpression.y);vAlpha=1.0-smoothstep(.7,.95,uExpression.y);}
  p=uPose*p;
  vec2 q=vec2(p.x*cos(uRoll)-p.y*sin(uRoll),p.x*sin(uRoll)+p.y*cos(uRoll));
  vec2 uv=uFace.xy+vec2(q.x*uFace.z,-q.y*uFace.w);
  gl_Position=vec4(uv*2.0-1.0,clamp(-p.z*.12,-.9,.9),1.0);
  vNormal=uPose*aNormal;
 }
 """.trimIndent()
 private val fragment="""
 precision mediump float;uniform vec4 uColor;uniform float uIntensity;
 varying vec3 vNormal;varying float vGlow;varying float vAlpha;
 void main(){if(vAlpha<.01)discard;float light=.62+.38*abs(dot(normalize(vNormal),normalize(vec3(-.4,.6,1.0))));gl_FragColor=vec4(uColor.rgb*light*vGlow,uColor.a*uIntensity*vAlpha);}
 """.trimIndent()
 private val program:Int
 init {
  fun compile(type:Int,source:String):Int {val id=GL.glCreateShader(type);GL.glShaderSource(id,source);GL.glCompileShader(id);val ok=IntArray(1);GL.glGetShaderiv(id,GL.GL_COMPILE_STATUS,ok,0);check(ok[0]!=0){GL.glGetShaderInfoLog(id)};return id}
  val v=compile(GL.GL_VERTEX_SHADER,vertex);val f=compile(GL.GL_FRAGMENT_SHADER,fragment)
  program=GL.glCreateProgram();GL.glAttachShader(program,v);GL.glAttachShader(program,f);GL.glLinkProgram(program)
  val ok=IntArray(1);GL.glGetProgramiv(program,GL.GL_LINK_STATUS,ok,0);GL.glDeleteShader(v);GL.glDeleteShader(f);check(ok[0]!=0){GL.glGetProgramInfoLog(program)}
  GL.glGenBuffers(1,occlusionBuffer,0);GL.glBindBuffer(GL.GL_ARRAY_BUFFER,occlusionBuffer[0]);GL.glBufferData(GL.GL_ARRAY_BUFFER,outline.size*3*24,null,GL.GL_DYNAMIC_DRAW);GL.glBindBuffer(GL.GL_ARRAY_BUFFER,0)
 }
 fun load(id:String) {
  require(id.matches(Regex("[a-z0-9-]+")))
  val bytes=context.assets.open("models/$id.glb").use{it.readBytes()}
  val data=ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)
  require(data.int==0x46546c67 && data.int==2 && data.int==bytes.size){"Invalid bundled GLB"}
  val jsonLength=data.int;require(data.int==0x4e4f534a)
  val json=ByteArray(jsonLength);data.get(json);val doc=JSONObject(String(json,Charsets.UTF_8))
  val binaryLength=data.int;require(data.int==0x004e4942 && binaryLength==data.remaining());val binaryStart=data.position()
  val views=doc.getJSONArray("bufferViews");val accessors=doc.getJSONArray("accessors");val materials=doc.getJSONArray("materials")
  fun floats(index:Int):FloatArray {val a=accessors.getJSONObject(index);require(a.getInt("componentType")==5126 && a.getString("type")=="VEC3");val view=views.getJSONObject(a.getInt("bufferView"));val count=a.getInt("count")*3;val offset=view.optInt("byteOffset")+a.optInt("byteOffset");require(offset>=0 && count>0 && count*4<=view.getInt("byteLength") && offset+count*4<=binaryLength);return FloatArray(count){data.getFloat(binaryStart+offset+it*4)}}
  val loaded=mutableListOf<Part>()
  try {
   val nodes=doc.getJSONArray("nodes");val meshes=doc.getJSONArray("meshes")
   for(i in 0 until nodes.length()) {
    val node=nodes.getJSONObject(i);val primitives=meshes.getJSONObject(node.getInt("mesh")).getJSONArray("primitives")
    for(j in 0 until primitives.length()) {
     val primitive=primitives.getJSONObject(j);require(primitive.optInt("mode",4)==4 && !primitive.has("indices"))
     val attrs=primitive.getJSONObject("attributes");val xyz=floats(attrs.getInt("POSITION"));val normals=floats(attrs.getInt("NORMAL"));require(xyz.size==normals.size && xyz.size%9==0)
     val color=materials.getJSONObject(primitive.getInt("material")).getJSONObject("pbrMetallicRoughness").getJSONArray("baseColorFactor")
     val buffer=ByteBuffer.allocateDirect(xyz.size*8).order(ByteOrder.nativeOrder()).asFloatBuffer()
     for(k in xyz.indices step 3){buffer.put(xyz,k,3);buffer.put(normals,k,3)};buffer.rewind()
     val handle=IntArray(1);GL.glGenBuffers(1,handle,0);GL.glBindBuffer(GL.GL_ARRAY_BUFFER,handle[0]);GL.glBufferData(GL.GL_ARRAY_BUFFER,xyz.size*8,buffer,GL.GL_STATIC_DRAW)
     val center=FloatArray(3){axis->var lo=Float.MAX_VALUE;var hi=-Float.MAX_VALUE;for(k in axis until xyz.size step 3){lo=minOf(lo,xyz[k]);hi=maxOf(hi,xyz[k])};(lo+hi)/2}
     loaded.add(Part(handle[0],xyz.size/3,FloatArray(4){color.getDouble(it).toFloat()},center,animations.indexOf(node.optJSONObject("extras")?.optString("yaroAnimation")?:"none").coerceAtLeast(0),(i*1.618f)%5))
    }
   }
   check(loaded.isNotEmpty());check(GL.glGetError()==GL.GL_NO_ERROR){"GLB upload failed"}
  }catch(error:Throwable){loaded.forEach{GL.glDeleteBuffers(1,intArrayOf(it.buffer),0)};throw error}
  clear();parts=loaded;GL.glBindBuffer(GL.GL_ARRAY_BUFFER,0)
 }
 fun draw(face:FaceLandmarkData,intensity:Float,time:Float) {
  if(face.face[2]<=0 || intensity<=0 || parts.isEmpty())return
  GL.glUseProgram(program);GL.glEnable(GL.GL_BLEND);GL.glBlendFunc(GL.GL_SRC_ALPHA,GL.GL_ONE_MINUS_SRC_ALPHA)
  GL.glClear(GL.GL_DEPTH_BUFFER_BIT);GL.glEnable(GL.GL_DEPTH_TEST);GL.glDepthFunc(GL.GL_LEQUAL);GL.glDepthMask(true)
  GL.glUniform4fv(u("uFace"),1,face.face,0)
  // Eye line provides roll. The MediaPipe matrix supplies yaw/pitch without
  // translation or scale; roll is removed there to avoid applying it twice.
  val roll=-atan2(face.eyes[3]-face.eyes[1],face.eyes[2]-face.eyes[0])
  pose.fill(0f);pose[0]=1f;pose[4]=1f;pose[8]=1f
  if(face.matrix.size==16){val m=face.matrix;val yaw=atan2(-m[2],m[10]);val pitch=atan2(m[6],m[5]);val cy=kotlin.math.cos(yaw);val sy=kotlin.math.sin(yaw);val cx=kotlin.math.cos(pitch);val sx=kotlin.math.sin(pitch);pose[0]=cy;pose[2]=-sy;pose[3]=sy*sx;pose[4]=cx;pose[5]=cy*sx;pose[6]=sy*cx;pose[7]=-sx;pose[8]=cy*cx}
  GL.glUniformMatrix3fv(u("uPose"),1,false,pose,0);GL.glUniform1f(u("uRoll"),roll);GL.glUniform1f(u("uTime"),time);GL.glUniform1f(u("uIntensity"),intensity)
  GL.glUniform2f(u("uExpression"),(face.blendshapes["jawOpen"]?:0f).coerceIn(0f,1f),maxOf(face.blendshapes["eyeBlinkLeft"]?:0f,face.blendshapes["eyeBlinkRight"]?:0f).coerceIn(0f,1f))
  val position=GL.glGetAttribLocation(program,"aPosition");val normal=GL.glGetAttribLocation(program,"aNormal");GL.glEnableVertexAttribArray(position);GL.glEnableVertexAttribArray(normal)
  // A depth-only mesh follows the real face contour. Geometry behind the face
  // (headband, wing roots, earring backs) must not paint over the camera image.
  occluder.clear()
  fun vertex(index:Int){
   if(index<0){occluder.put(0f);occluder.put(0f)}
   else if(face.landmarks.size>454){val p=face.landmarks[outline[index%outline.size]];occluder.put((p[0]-face.face[0])/face.face[2]);occluder.put(-(p[1]-face.face[1])/face.face[3])}
   else{val a=index*2*Math.PI/outline.size;occluder.put(kotlin.math.cos(a).toFloat());occluder.put(kotlin.math.sin(a).toFloat())}
   occluder.put(-.001f);occluder.put(0f);occluder.put(0f);occluder.put(1f)
  }
  for(i in outline.indices){vertex(-1);vertex(i);vertex((i+1)%outline.size)};occluder.rewind()
  GL.glBindBuffer(GL.GL_ARRAY_BUFFER,occlusionBuffer[0]);GL.glBufferSubData(GL.GL_ARRAY_BUFFER,0,outline.size*3*24,occluder)
  GL.glVertexAttribPointer(position,3,GL.GL_FLOAT,false,24,0);GL.glVertexAttribPointer(normal,3,GL.GL_FLOAT,false,24,12)
  GL.glUniformMatrix3fv(u("uPose"),1,false,identity,0);GL.glUniform1f(u("uRoll"),0f);GL.glUniform1f(u("uAnimation"),0f)
  GL.glColorMask(false,false,false,false);GL.glDrawArrays(GL.GL_TRIANGLES,0,outline.size*3);GL.glColorMask(true,true,true,true)
  GL.glUniformMatrix3fv(u("uPose"),1,false,pose,0);GL.glUniform1f(u("uRoll"),roll)
  // Opaque geometry first; transparent lenses and holograms last.
  for(transparent in listOf(false,true))for(p in parts){if((p.color[3]<1f)!=transparent)continue;GL.glDepthMask(!transparent);GL.glBindBuffer(GL.GL_ARRAY_BUFFER,p.buffer);GL.glVertexAttribPointer(position,3,GL.GL_FLOAT,false,24,0);GL.glVertexAttribPointer(normal,3,GL.GL_FLOAT,false,24,12);GL.glUniform4fv(u("uColor"),1,p.color,0);GL.glUniform3fv(u("uCenter"),1,p.center,0);GL.glUniform1f(u("uAnimation"),p.animation.toFloat());GL.glUniform1f(u("uSeed"),p.seed);GL.glDrawArrays(GL.GL_TRIANGLES,0,p.count)}
  GL.glBindBuffer(GL.GL_ARRAY_BUFFER,0);GL.glDisableVertexAttribArray(normal);GL.glDisableVertexAttribArray(position);GL.glDepthMask(true);GL.glDisable(GL.GL_DEPTH_TEST);GL.glDisable(GL.GL_BLEND)
 }
 private fun u(name:String)=GL.glGetUniformLocation(program,name)
 fun clear(){parts.forEach{GL.glDeleteBuffers(1,intArrayOf(it.buffer),0)};parts=emptyList()}
 override fun close(){clear();GL.glDeleteBuffers(1,occlusionBuffer,0);GL.glDeleteProgram(program)}
}
