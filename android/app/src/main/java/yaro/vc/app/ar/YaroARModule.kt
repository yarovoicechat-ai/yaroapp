package yaro.vc.app.ar
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import yaro.vc.app.ar.pipeline.ARSessionManager
class YaroARModule(private val context:ReactApplicationContext):ReactContextBaseJavaModule(context),LifecycleEventListener {
 private var session:ARSessionManager?=null
 init{context.addLifecycleEventListener(this)}
 override fun getName()="YaroAR"
 private fun emit(event:String,data:Map<String,Any>){if(context.hasActiveReactInstance())context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(event,Arguments.makeNativeMap(data))}
 private fun finish(p:Promise,error:Throwable?){if(error==null)p.resolve(null)else p.reject("YARO_AR",error.message,error)}
 private fun current(p:Promise,operation:(ARSessionManager)->Unit){val value=session;if(value==null)p.reject("AR_NOT_INITIALIZED","Initialize the AR session first")else operation(value)}
 @ReactMethod fun getCapabilities(p:Promise){val model=try{context.assets.open("models/face_landmarker.task").close();true}catch(_:Exception){false};p.resolve(Arguments.makeNativeMap(mapOf("nativeAvailable" to true,"tracking" to model,"customVideo" to model,"backgroundSegmentation" to false,"implementedEffectIds" to if(model)ARSessionManager.EFFECTS else emptyList<String>(),"verified" to false,"reason" to if(model)"Experimental pipeline; device verification required." else "Face model is missing.")))}
 @ReactMethod fun initialize(config:ReadableMap,p:Promise){
  if(session!=null){p.reject("AR_SESSION_EXISTS","Release the existing AR session first");return}
  try{val track=config.getDouble("trackId");require(track>=0 && track<=Int.MAX_VALUE);val width=config.getInt("width");val height=config.getInt("height");val fps=config.getInt("fps");require(width in 1..1280 && height in 1..1280 && fps in 1..30);session=ARSessionManager(context,track.toInt(),width,height,fps,config.getBoolean("frontCamera"),::emit);p.resolve(null)}catch(e:Throwable){p.reject("AR_CONFIG",e.message,e)}
 }
 @ReactMethod fun startSession(p:Promise)=current(p){it.start{error->finish(p,error)}}
 @ReactMethod fun setEffect(id:String,p:Promise)=current(p){it.effect(id){error->finish(p,error)}}
 @ReactMethod fun setIntensity(value:Double,p:Promise)=current(p){if(!value.isFinite())p.reject("AR_INTENSITY","Intensity must be finite")else{it.intensity(value.toFloat());p.resolve(null)}}
 @ReactMethod fun setBeautyIntensity(value:Double,p:Promise)=current(p){if(!value.isFinite())p.reject("AR_INTENSITY","Intensity must be finite")else{it.beauty(value.toFloat());p.resolve(null)}}
 @ReactMethod fun setAdjustments(values:ReadableMap,p:Promise)=current(p){
  try{val data=floatArrayOf(values.getDouble("brightness").toFloat(),values.getDouble("contrast").toFloat(),values.getDouble("saturation").toFloat(),values.getDouble("warmth").toFloat());val sharp=values.getDouble("sharpness").toFloat();require(data.all{v->v.isFinite()} && sharp.isFinite());it.adjust(data,sharp);p.resolve(null)}catch(e:Throwable){p.reject("AR_ADJUST",e.message,e)}
 }
 @ReactMethod fun removeEffect(p:Promise)=current(p){it.remove();p.resolve(null)}
 @ReactMethod fun pause(p:Promise)=current(p){it.pause{p.resolve(null)}}
 @ReactMethod fun resume(p:Promise)=current(p){it.start{error->finish(p,error)}}
 @ReactMethod fun stopSession(p:Promise){val old=session;if(old==null)p.resolve(null)else old.stop{p.resolve(null)}}
 @ReactMethod fun release(p:Promise){val old=session;session=null;if(old==null)p.resolve(null)else old.release{p.resolve(null)}}
 @ReactMethod fun addListener(event:String){}
 @ReactMethod fun removeListeners(count:Int){}
 override fun onHostPause(){session?.pause{}}
 override fun onHostResume(){}
 override fun onHostDestroy(){session?.release{};session=null}
 override fun invalidate(){onHostDestroy();context.removeLifecycleEventListener(this);super.invalidate()}
}
