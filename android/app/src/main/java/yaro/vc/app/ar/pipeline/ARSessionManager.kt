package yaro.vc.app.ar.pipeline
import android.os.Handler
import android.os.HandlerThread
import android.os.SystemClock
import com.facebook.react.bridge.ReactApplicationContext
import yaro.vc.app.ar.rendering.YaroARRenderer
import yaro.vc.app.ar.rendering.ARPreviewFrames
import yaro.vc.app.ar.camera.ARCameraManager
import yaro.vc.app.ar.agora.AgoraARAdapter
import yaro.vc.app.ar.tracking.FaceLandmarkerEngine
import yaro.vc.app.ar.tracking.FaceLandmarkData
class ARSessionManager(private val context:ReactApplicationContext,private val trackId:Int,private val width:Int,private val height:Int,private val fps:Int,private val front:Boolean,private val emit:(String,Map<String,Any>)->Unit){
 private val thread=HandlerThread("YaroAR-GL").apply{start()};private val handler=Handler(thread.looper)
 private var renderer:YaroARRenderer?=null;private var camera:ARCameraManager?=null;private var tracker:FaceLandmarkerEngine?=null;private var adapter:AgoraARAdapter?=null
 private var running=false;private var stopped=false;private var cleaning=false;private val cleanups=mutableListOf<()->Unit>()
 private var mode=0;private var intensity=.5f;private var beauty=.5f;private var adjustments=floatArrayOf(0f,1f,1f,0f);private var sharpness=0f
 private var previousFrame=0L;private var previousTrack=0L;private var previousStats=0L;private var frames=0;private var ready:((Throwable?)->Unit)?=null
 private var selection:Pair<String,(Throwable?)->Unit>?=null
 private var modelId:String?=null
 fun start(done:(Throwable?)->Unit){handler.post {
  if(stopped || cleaning){done(IllegalStateException("AR session unavailable"));return@post};if(running){done(null);return@post};ready=done
  try{
   val gpu=YaroARRenderer(context,width,height);renderer=gpu
   gpu.model(modelId)
   val tracking=FaceLandmarkerEngine(context,{present->emit(if(present)"onFaceDetected" else "onFaceLost",emptyMap())},::fail);tracker=tracking
   adapter=AgoraARAdapter(context,trackId,width,height);camera=ARCameraManager(context,handler,::fail)
   running=true;previousFrame=0;previousTrack=0;previousStats=SystemClock.elapsedRealtime();frames=0
   gpu.cameraTexture.setOnFrameAvailableListener({
    if(!running)return@setOnFrameAvailableListener
    try{
     gpu.updateCamera();val now=SystemClock.elapsedRealtime();if(now-previousFrame<1000/fps)return@setOnFrameAvailableListener;previousFrame=now
     gpu.inputAspect=camera?.captureAspect ?: width.toFloat()/height
     if(now-previousTrack>=83){previousTrack=now;tracking.offer(gpu.render(FaceLandmarkData(),camera?.rotation ?: 0,true),width,height,now)}
     gpu.mode=mode;gpu.intensity=intensity;gpu.beauty=beauty;gpu.adjustments=adjustments;gpu.sharpness=sharpness
     val face=tracking.latest.let{if(now-it.timestampMs>250)FaceLandmarkData() else it}
     val processed=gpu.render(face,camera?.rotation ?: 0)
     adapter!!.push(processed,now)
     ARPreviewFrames.submit(trackId,processed,width,height)
     frames++
     selection?.let{pending->selection=null;android.util.Log.i("YaroAR","Rendered and submitted effect=${pending.first} track=$trackId");emit("onEffectChanged",mapOf("effectId" to pending.first));pending.second(null)}
     ready?.let{ready=null;emit("onARReady",mapOf("trackId" to trackId));it(null)}
     if(now-previousStats>=1000){val measured=frames*1000.0/(now-previousStats);emit("onPerformanceUpdate",mapOf("fps" to measured,"queuedFrames" to 0));android.util.Log.d("YaroAR","fps=$measured queue=0 face=${face.face[2]>0} beauty=$mode model=${modelId?:"none"}");frames=0;previousStats=now}
    }catch(e:Throwable){fail(e)}
   },handler)
   camera!!.start(gpu.cameraTexture,front,fps)
   handler.postDelayed({if(ready!=null)fail(IllegalStateException("AR camera frame timed out"))},10000)
  }catch(e:Throwable){fail(e)}
 }}
 private fun fail(error:Throwable){handler.post{val callback=ready;ready=null;cleanup{callback?.invoke(error);emit("onARError",mapOf("message" to (error.message ?: "Native AR failure")))}}}
 private fun cleanup(done:()->Unit){
  cleanups.add(done);if(cleaning)return;cleaning=true;running=false
  selection?.second?.invoke(IllegalStateException("AR stopped before the selected effect rendered"));selection=null
  val old=camera;camera=null
  val finish={tracker?.close();tracker=null;renderer?.cameraTexture?.setOnFrameAvailableListener(null);renderer?.close();renderer=null;adapter=null;cleaning=false;val callbacks=cleanups.toList();cleanups.clear();callbacks.forEach{it()}}
  if(old==null)finish() else old.close(finish)
 }
 fun effect(id:String,done:(Throwable?)->Unit){handler.post{
  val index=EFFECTS.indexOf(id)
  if(index<0){done(IllegalArgumentException("Effect assets are pending"));return@post}
  if(!running){done(IllegalStateException("AR camera is not running"));return@post}
  selection?.second?.invoke(IllegalStateException("Effect selection superseded"))
  try{val model=if(index>=9)id else null;renderer!!.model(model);modelId=model;mode=if(index<9)index+1 else 0}catch(error:Throwable){done(error);return@post}
  val pending=Pair(id,done);selection=pending
  handler.postDelayed({if(selection===pending){selection=null;done(IllegalStateException("Selected effect did not render within 10 seconds"))}},10000)
 }}
 fun intensity(value:Float){handler.post{intensity=value.coerceIn(0f,1f)}}
 fun beauty(value:Float){handler.post{beauty=value.coerceIn(0f,1f)}}
 fun adjust(values:FloatArray,sharp:Float){handler.post{adjustments=values;sharpness=sharp}}
 fun remove(){handler.post{mode=0;modelId=null;renderer?.model(null)}}
 fun pause(done:()->Unit){handler.post{val callback=ready;ready=null;cleanup{callback?.invoke(IllegalStateException("AR paused before the first frame"));done()}}}
 fun stop(done:()->Unit){handler.post{ready?.invoke(IllegalStateException("AR session stopped"));ready=null;cleanup(done)}}
 fun release(done:()->Unit){handler.post{stopped=true;cleanup{done();thread.quitSafely()}}}
 companion object{val EFFECTS=listOf("yaro-beauty","pink-glow","rosy-cheeks","soft-makeup","golden-shine","natural-skin","smooth-skin","bright-eyes","lip-tint",
 "puppy","bunny","kitty","panda","fox","royal-crown","heart-glasses","butterfly-hair","golden-earrings","cyber-headset","angel","devil","fairy","ice-queen","fire-king","anime-eyes","anime-blush","magic-eyes","anime-cat","star-eyes","love-hearts","cry-baby","funny-face","happy-spark","angry-face","butterflies","flower-crown","snowfall","star-shower","rainbow-aura","birthday","disco-king","confetti","neon-party","gold-rain","diamond-face","hologram","dragon-mask","crystal-butterfly","yaro-royal","neon-rings","galaxy-face","robot-face","flame-face","yaro-signature")}
}
