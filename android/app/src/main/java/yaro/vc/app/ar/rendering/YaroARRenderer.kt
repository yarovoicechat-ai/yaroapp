package yaro.vc.app.ar.rendering
import android.content.Context
import android.graphics.SurfaceTexture
import android.opengl.GLES11Ext
import android.opengl.GLES20 as GL
import yaro.vc.app.ar.tracking.FaceLandmarkData
import java.nio.ByteBuffer
import java.nio.ByteOrder
class YaroARRenderer(context:Context,val width:Int,val height:Int):AutoCloseable {
 private val egl=GLContextManager(width,height)
 private val texture=IntArray(1)
 private val program:Int
 private val models:GLBEffectRenderer
 private val animationEpoch=android.os.SystemClock.elapsedRealtime()
 private val matrix=FloatArray(16)
 private val vertices=ByteBuffer.allocateDirect(32).order(ByteOrder.nativeOrder()).asFloatBuffer().apply {put(floatArrayOf(-1f,-1f,1f,-1f,-1f,1f,1f,1f));position(0)}
 val pixels:ByteBuffer=ByteBuffer.allocateDirect(width*height*4)
 val cameraTexture:SurfaceTexture
 var mode=0;var intensity=.5f;var beauty=.5f;var adjustments=floatArrayOf(0f,1f,1f,0f);var sharpness=0f
 var inputAspect=width.toFloat()/height
 init {
  GL.glGenTextures(1,texture,0);GL.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,texture[0])
  GL.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,GL.GL_TEXTURE_MIN_FILTER,GL.GL_LINEAR);GL.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,GL.GL_TEXTURE_MAG_FILTER,GL.GL_LINEAR)
  GL.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,GL.GL_TEXTURE_WRAP_S,GL.GL_CLAMP_TO_EDGE);GL.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,GL.GL_TEXTURE_WRAP_T,GL.GL_CLAMP_TO_EDGE)
  cameraTexture=SurfaceTexture(texture[0])
  try {
   fun compile(type:Int,source:String):Int {val shader=GL.glCreateShader(type);GL.glShaderSource(shader,source);GL.glCompileShader(shader);val status=IntArray(1);GL.glGetShaderiv(shader,GL.GL_COMPILE_STATUS,status,0);check(status[0]!=0){GL.glGetShaderInfoLog(shader)};return shader}
   val vertex=compile(GL.GL_VERTEX_SHADER,"attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=(aPosition+1.0)*0.5;gl_Position=vec4(aPosition,0.0,1.0);}")
   val fragment=compile(GL.GL_FRAGMENT_SHADER,context.assets.open("shaders/beauty.frag").bufferedReader().use{it.readText()})
   program=GL.glCreateProgram();GL.glAttachShader(program,vertex);GL.glAttachShader(program,fragment);GL.glLinkProgram(program)
   val status=IntArray(1);GL.glGetProgramiv(program,GL.GL_LINK_STATUS,status,0);check(status[0]!=0){GL.glGetProgramInfoLog(program)};GL.glDeleteShader(vertex);GL.glDeleteShader(fragment)
   models=GLBEffectRenderer(context)
  }catch(error:Throwable){cameraTexture.release();egl.close();throw error}
 }
 fun updateCamera(){cameraTexture.updateTexImage();cameraTexture.getTransformMatrix(matrix)}
 fun render(face:FaceLandmarkData,rotation:Int,original:Boolean=false,timeSeconds:Float=(android.os.SystemClock.elapsedRealtime()-animationEpoch)/1000f):ByteBuffer {
  GL.glViewport(0,0,width,height);GL.glUseProgram(program)
  val attr=GL.glGetAttribLocation(program,"aPosition");GL.glEnableVertexAttribArray(attr);vertices.position(0);GL.glVertexAttribPointer(attr,2,GL.GL_FLOAT,false,0,vertices)
  GL.glActiveTexture(GL.GL_TEXTURE0);GL.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,texture[0]);GL.glUniform1i(u("uCamera"),0)
  GL.glUniformMatrix4fv(u("uTransform"),1,false,matrix,0);GL.glUniform1i(u("uRotation"),rotation);GL.glUniform1i(u("uMode"),if(original)0 else mode)
  GL.glUniform1f(u("uIntensity"),intensity);GL.glUniform1f(u("uBeauty"),beauty);GL.glUniform2f(u("uTexel"),1f/width,1f/height)
  val rotatedAspect=if(rotation%180==0)inputAspect else 1f/inputAspect;val outputAspect=width.toFloat()/height
  GL.glUniform2f(u("uCrop"),minOf(1f,outputAspect/rotatedAspect),minOf(1f,rotatedAspect/outputAspect))
  GL.glUniform4fv(u("uFace"),1,face.face,0);GL.glUniform4fv(u("uEyes"),1,face.eyes,0);GL.glUniform4fv(u("uMouth"),1,face.mouth,0);GL.glUniform4fv(u("uCheeks"),1,face.cheeks,0)
  GL.glUniform4fv(u("uAdjust"),1,adjustments,0);GL.glUniform1f(u("uSharpness"),sharpness);GL.glDrawArrays(GL.GL_TRIANGLE_STRIP,0,4)
  GL.glDisableVertexAttribArray(attr)
  if(!original)models.draw(face,intensity,timeSeconds)
  pixels.clear();GL.glReadPixels(0,0,width,height,GL.GL_RGBA,GL.GL_UNSIGNED_BYTE,pixels);pixels.rewind();check(GL.glGetError()==GL.GL_NO_ERROR){"AR GPU frame failed"};return pixels
 }
 private fun u(name:String)=GL.glGetUniformLocation(program,name)
 fun model(id:String?){if(id==null)models.clear() else models.load(id)}
 override fun close(){models.close();cameraTexture.release();GL.glDeleteProgram(program);GL.glDeleteTextures(1,texture,0);egl.close()}
}
