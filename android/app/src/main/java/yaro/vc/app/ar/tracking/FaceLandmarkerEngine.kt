package yaro.vc.app.ar.tracking
import android.content.Context
import com.google.mediapipe.framework.image.ByteBufferImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarker
import java.nio.ByteBuffer
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
class FaceLandmarkerEngine(context:Context,private val changed:(Boolean)->Unit,private val failed:(Throwable)->Unit):AutoCloseable{
 private val worker=Executors.newSingleThreadExecutor();private val busy=AtomicBoolean(false);private val closed=AtomicBoolean(false);private val smoother=FaceSmoother()
 private val detector=FaceLandmarker.createFromOptions(context,FaceLandmarker.FaceLandmarkerOptions.builder().setBaseOptions(BaseOptions.builder().setModelAssetPath("models/face_landmarker.task").build()).setRunningMode(RunningMode.VIDEO).setNumFaces(1).setOutputFaceBlendshapes(true).setOutputFacialTransformationMatrixes(true).build())
 @Volatile var latest=FaceLandmarkData();private set
 private var detected=false;private var buffer:ByteBuffer?=null
 fun offer(rgba:ByteBuffer,width:Int,height:Int,timestampMs:Long){
  if(closed.get() || !busy.compareAndSet(false,true))return
  val size=width*height*4;if(buffer?.capacity()!=size)buffer=ByteBuffer.allocateDirect(size)
  val copy=buffer!!;copy.clear();rgba.rewind();copy.put(rgba);copy.rewind()
  worker.execute{
   try{
    val input=ByteBufferImageBuilder(copy,width,height,MPImage.IMAGE_FORMAT_RGBA).build()
    val result=try{detector.detectForVideo(input,timestampMs)}finally{input.close()}
    if(closed.get())return@execute
    val points=result.faceLandmarks().firstOrNull();val present=points!=null && points.size>454
    if(present){val p=points!!
     fun x(i:Int)=p[i].x()
     fun y(i:Int)=p[i].y()
     latest=smoother.apply(FaceLandmarkData(face=floatArrayOf((x(234)+x(454))*.5f,(y(10)+y(152))*.5f,kotlin.math.abs(x(454)-x(234))*.5f,kotlin.math.abs(y(152)-y(10))*.5f),eyes=floatArrayOf((x(33)+x(133))*.5f,(y(33)+y(133))*.5f,(x(362)+x(263))*.5f,(y(362)+y(263))*.5f),mouth=floatArrayOf((x(61)+x(291))*.5f,(y(13)+y(14))*.5f,kotlin.math.abs(x(291)-x(61))*.6f,kotlin.math.abs(y(17)-y(0))*.65f),cheeks=floatArrayOf(x(50),y(50),x(280),y(280)),landmarks=p.map{floatArrayOf(it.x(),it.y(),it.z())},matrix=result.facialTransformationMatrixes().orElse(emptyList()).firstOrNull() ?: FloatArray(0),blendshapes=result.faceBlendshapes().orElse(emptyList()).firstOrNull()?.associate{it.categoryName() to it.score()} ?: emptyMap(),timestampMs=timestampMs))
    }else{latest=FaceLandmarkData();smoother.reset()}
    if(present!=detected){detected=present;changed(present)}
   }catch(error:Throwable){latest=FaceLandmarkData();if(!closed.get())failed(error)}finally{busy.set(false)}
  }
 }
 override fun close(){if(closed.compareAndSet(false,true)){latest=FaceLandmarkData();worker.execute{detector.close();buffer=null};worker.shutdown()}}
}
