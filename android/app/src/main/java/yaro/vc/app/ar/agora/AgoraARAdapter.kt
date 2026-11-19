package yaro.vc.app.ar.agora
import com.facebook.react.bridge.ReactApplicationContext
import io.agora.rtc.ng.react.AgoraRtcNgModule
import org.json.JSONObject
import java.nio.ByteBuffer
class AgoraARAdapter(private val context:ReactApplicationContext,trackId:Int,width:Int,height:Int){
 private val bytes=ByteArray(width*height*4)
 private val buffers=listOf(bytes,ByteArray(0),ByteArray(0),ByteArray(0),ByteArray(0))
 private val frame=JSONObject().put("type",2).put("format",4).put("stride",width).put("height",height).put("rotation",0)
 private val parameters=JSONObject().put("frame",frame).put("videoTrackId",trackId)
 fun push(rgba:ByteBuffer,timestampMs:Long){
  rgba.rewind();rgba.get(bytes);frame.put("timestamp",timestampMs)
  val module=context.getNativeModule(AgoraRtcNgModule::class.java) ?: error("Existing Agora module unavailable")
  synchronized(module.irisApiLock){val engine=module.irisApiEngine ?: error("Agora engine has been released");val result=JSONObject(engine.callIrisApi("MediaEngine_pushVideoFrame_4e544e2",parameters.toString(),buffers));check(result.optInt("result",-1)>=0){"Agora rejected AR frame: "+result}}
 }
}
