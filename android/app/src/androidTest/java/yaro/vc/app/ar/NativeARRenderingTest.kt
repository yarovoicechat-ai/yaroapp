package yaro.vc.app.ar
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Rect
import android.os.Handler
import android.os.HandlerThread
import android.os.SystemClock
import android.view.Surface
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import io.agora.iris.IrisApiEngine
import org.json.JSONObject
import yaro.vc.app.ar.tracking.FaceLandmarkerEngine
import yaro.vc.app.ar.tracking.FaceLandmarkData
import yaro.vc.app.ar.rendering.YaroARRenderer
import java.nio.ByteBuffer
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

@RunWith(AndroidJUnit4::class)
class NativeARRenderingTest {
 private val instrumentation=InstrumentationRegistry.getInstrumentation()
 private fun portrait():Bitmap=instrumentation.context.assets.open("ar-portrait.jpg").use {stream->
  val original=BitmapFactory.decodeStream(stream) ?: error("Portrait fixture missing")
  Bitmap.createScaledBitmap(original,320,(original.height*320.0/original.width).toInt(),true).also{if(it!==original)original.recycle()}
 }
 private fun rgba(bitmap:Bitmap):ByteBuffer{
  val pixels=IntArray(bitmap.width*bitmap.height);bitmap.getPixels(pixels,0,bitmap.width,0,0,bitmap.width,bitmap.height)
  return ByteBuffer.allocateDirect(pixels.size*4).apply{pixels.forEach{p->put((p shr 16 and 255).toByte());put((p shr 8 and 255).toByte());put((p and 255).toByte());put(255.toByte())};rewind()}
 }
 private fun waitUntil(condition:()->Boolean){val end=System.currentTimeMillis()+15000;while(!condition()){if(System.currentTimeMillis()>end)fail("Native result timed out");Thread.sleep(15)}}
 @Test fun detectsLosesAndRecoversOneFaceWithoutJavaScriptFrames(){
  val failure=AtomicReference<Throwable?>();val transitions=java.util.Collections.synchronizedList(mutableListOf<Boolean>())
  val detector=FaceLandmarkerEngine(instrumentation.targetContext,{transitions.add(it)},{failure.set(it)})
  val bitmap=portrait()
  try{
   val face=rgba(bitmap);detector.offer(face,bitmap.width,bitmap.height,100)
   waitUntil{failure.get()!=null || detector.latest.landmarks.size>=468};failure.get()?.let{throw it}
   assertEquals(16,detector.latest.matrix.size);assertTrue(detector.latest.blendshapes.size>10);Thread.sleep(50)
   val blank=ByteBuffer.allocateDirect(bitmap.width*bitmap.height*4).apply{while(hasRemaining())put(255.toByte());rewind()}
   detector.offer(blank,bitmap.width,bitmap.height,200)
   waitUntil{failure.get()!=null || transitions.contains(false)};failure.get()?.let{throw it};assertTrue(detector.latest.landmarks.isEmpty())
   Thread.sleep(50);face.rewind();detector.offer(face,bitmap.width,bitmap.height,300)
   waitUntil{failure.get()!=null || transitions.count{it}>=2};failure.get()?.let{throw it};assertTrue(detector.latest.landmarks.size>=468)
  }finally{detector.close();bitmap.recycle()}
 }
 @Test fun allBeautyAndOriginalModelsRenderOnGpuWithExactZeroBypass(){
  val fixture=portrait();val trackingFailure=AtomicReference<Throwable?>()
  val tracker=FaceLandmarkerEngine(instrumentation.targetContext,{}, {trackingFailure.set(it)})
  val trackedFace:FaceLandmarkData
  try{tracker.offer(rgba(fixture),fixture.width,fixture.height,100);waitUntil{trackingFailure.get()!=null || tracker.latest.landmarks.size>=468};trackingFailure.get()?.let{throw it};trackedFace=tracker.latest}finally{tracker.close();fixture.recycle()}
  val completed=CountDownLatch(1);val failure=AtomicReference<Throwable?>()
  val thread=HandlerThread("YaroAR-GPU-Test").apply{start()};val handler=Handler(thread.looper)
  handler.post{
   var renderer:YaroARRenderer?=null;var surface:Surface?=null
   try{
    val gpu=YaroARRenderer(instrumentation.targetContext,256,256);renderer=gpu;gpu.cameraTexture.setDefaultBufferSize(256,256)
    gpu.cameraTexture.setOnFrameAvailableListener({
     try{
      gpu.updateCamera()
      val face=trackedFace
      fun read(original:Boolean,time:Float=1f,tracked:Boolean=true):ByteArray=ByteArray(256*256*4).also{gpu.render(if(tracked)face else FaceLandmarkData(),0,original,time).get(it)}
      val original=read(true);val results=mutableSetOf<Int>();gpu.intensity=1f;gpu.beauty=.8f
      for(mode in 1..9){gpu.mode=mode;gpu.intensity=1f;val processed=read(false);assertTrue("Shader mode $mode changed no pixels",processed.indices.count{processed[it]!=original[it]}>20);results.add(processed.contentHashCode());val eye=((face.eyes[1]*256).toInt()*256+(face.eyes[0]*256).toInt())*4
       if(mode!=8)for(channel in 0..2)assertTrue("Eye detail was modified in $mode",kotlin.math.abs((processed[eye+channel].toInt() and 255)-(original[eye+channel].toInt() and 255))<=1)
       gpu.intensity=0f;assertArrayEquals("Mode $mode intensity zero is not original",original,read(false))
       gpu.intensity=.5f;val medium=read(false)
       for(k in original.indices)if(k%4!=3){val expected=((original[k].toInt() and 255)+(processed[k].toInt() and 255))/2;assertTrue("Mode $mode midpoint is not half strength",kotlin.math.abs((medium[k].toInt() and 255)-expected)<=1)}
      };assertEquals("Beauty modes produced identical output",9,results.size)
      gpu.mode=0;results.clear()
      for(id in yaro.vc.app.ar.pipeline.ARSessionManager.EFFECTS.drop(9)){
       gpu.model(id);gpu.intensity=0f;assertArrayEquals("$id zero intensity altered original",original,read(false))
       gpu.intensity=1f;val processed=read(false);assertTrue("$id did not render its model",processed.indices.count{processed[it]!=original[it]}>20);results.add(processed.contentHashCode())
       assertArrayEquals("$id remained visible after face loss",original,read(false,tracked=false))
       if(id in listOf("confetti","snowfall","love-hearts","butterflies","gold-rain","flame-face","neon-rings"))assertFalse("$id animation is static",processed.contentEquals(read(false,2f)))
      };assertEquals("Original scenes rendered duplicate images",45,results.size)
     }catch(error:Throwable){failure.set(error)}finally{surface?.release();renderer?.close();completed.countDown();thread.quitSafely()}
    },handler)
    surface=Surface(gpu.cameraTexture);val bitmap=portrait();val canvas=surface!!.lockCanvas(null);canvas.drawBitmap(bitmap,null,Rect(0,0,256,256),null);surface!!.unlockCanvasAndPost(canvas);bitmap.recycle()
   }catch(error:Throwable){failure.set(error);surface?.release();renderer?.close();completed.countDown();thread.quitSafely()}
  }
  assertTrue("GPU test timed out",completed.await(30,TimeUnit.SECONDS));failure.get()?.let{throw it}
 }
 @Test fun installedAgoraAcceptsNativeCustomFrameContract(){
  // No channel join, microphone capture or external publication.
  IrisApiEngine.enableUseJsonArray(true);val iris=IrisApiEngine(instrumentation.targetContext)
  fun call(name:String,params:JSONObject=JSONObject(),buffers:List<ByteArray> = emptyList()):JSONObject=JSONObject(iris.callIrisApi(name,params.toString(),buffers))
  try{
   val initialized=call("RtcEngine_initialize_0320339",JSONObject().put("context",JSONObject().put("appId","a728e57756ce4e9caebe4ace185c8bae").put("channelProfile",1)))
   assertEquals(initialized.toString(),0,initialized.getInt("result"));assertEquals(0,call("RtcEngine_enableVideo").getInt("result"));assertEquals(0,call("RtcEngine_enableLocalVideo_5039d15",JSONObject().put("enabled",false)).getInt("result"))
   val track=call("RtcEngine_createCustomVideoTrack").getLong("result");assertTrue(track>=0 && track<0xffffffffL)
   val frame=JSONObject().put("type",2).put("format",4).put("stride",16).put("height",16).put("rotation",0).put("timestamp",SystemClock.elapsedRealtime())
   val result=call("MediaEngine_pushVideoFrame_4e544e2",JSONObject().put("frame",frame).put("videoTrackId",track),listOf(ByteArray(16*16*4){127},ByteArray(0),ByteArray(0),ByteArray(0),ByteArray(0)))
   assertEquals(result.toString(),0,result.getInt("result"))
  }finally{try{call("RtcEngine_release",JSONObject().put("sync",true))}finally{iris.destroy()}}
 }
}
