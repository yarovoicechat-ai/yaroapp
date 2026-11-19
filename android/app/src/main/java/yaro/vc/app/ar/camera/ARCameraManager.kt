package yaro.vc.app.ar.camera
import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.SurfaceTexture
import android.hardware.camera2.*
import android.os.Handler
import android.view.Surface

class ARCameraManager(private val context:Context,private val handler:Handler,private val failed:(Throwable)->Unit) {
 private var device:CameraDevice?=null
 private var session:CameraCaptureSession?=null
 private var surface:Surface?=null
 private var stopped=false
 private var opening=false
 private var closeCallback:(()->Unit)?=null
 private var sensorRotation=0;private var isFront=true;private var retries=0;private var retryAfterClose:(()->Unit)?=null
 var captureAspect=1f;private set
 val rotation:Int get(){val display=(context.getSystemService(Context.WINDOW_SERVICE) as android.view.WindowManager).defaultDisplay.rotation;val degrees=when(display){Surface.ROTATION_90->90;Surface.ROTATION_180->180;Surface.ROTATION_270->270;else->0};return (sensorRotation+(if(isFront)degrees else -degrees)+360)%360}
 @SuppressLint("MissingPermission")
 fun start(texture:SurfaceTexture,front:Boolean,fps:Int) {
  if(stopped)return
  check(context.checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED) { "Camera permission is required" }
  val manager=context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
  val id=manager.cameraIdList.firstOrNull { manager.getCameraCharacteristics(it).get(CameraCharacteristics.LENS_FACING)==if(front) CameraCharacteristics.LENS_FACING_FRONT else CameraCharacteristics.LENS_FACING_BACK } ?: error("Requested camera unavailable")
  val info=manager.getCameraCharacteristics(id)
  sensorRotation=info.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 0;isFront=front
  val sizes=info.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)?.getOutputSizes(SurfaceTexture::class.java) ?: error("Camera sizes unavailable")
  val size=sizes.filter {it.width<=1280 && it.height<=720}.maxByOrNull {it.width*it.height} ?: sizes.minByOrNull {it.width*it.height}!!
  captureAspect=size.width.toFloat()/size.height
  texture.setDefaultBufferSize(size.width,size.height);surface=Surface(texture)
  manager.openCamera(id,object:CameraDevice.StateCallback() {
   override fun onOpened(camera:CameraDevice) {
    opening=false;device=camera
    if(stopped) {camera.close();return}
    camera.createCaptureSession(listOf(surface!!),object:CameraCaptureSession.StateCallback() {
     override fun onConfigured(configured:CameraCaptureSession) {
      if(stopped) {configured.close();return};session=configured
      try {
       val request=camera.createCaptureRequest(CameraDevice.TEMPLATE_RECORD).apply {
        addTarget(surface!!);set(CaptureRequest.CONTROL_AF_MODE,CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_VIDEO)
        val range=info.get(CameraCharacteristics.CONTROL_AE_AVAILABLE_TARGET_FPS_RANGES)?.filter {it.upper<=30 && it.upper>=fps}?.minByOrNull {kotlin.math.abs(it.upper-fps)+kotlin.math.abs(it.lower-fps)}
        if(range!=null)set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE,range)
       }.build();configured.setRepeatingRequest(request,null,handler)
      }catch(e:Throwable){failed(e)}
     }
     override fun onConfigureFailed(session:CameraCaptureSession){failed(IllegalStateException("Camera configuration failed"))}
    },handler)
   }
   override fun onClosed(camera:CameraDevice){device=null;opening=false;val retry=retryAfterClose;retryAfterClose=null;finishClose();if(!stopped && retry!=null)handler.postDelayed({if(!stopped)retry()},150)}
   override fun onDisconnected(camera:CameraDevice){camera.close();if(!stopped)failed(IllegalStateException("AR camera disconnected"))}
   override fun onError(camera:CameraDevice,code:Int){
    // Agora capture closes asynchronously after enableLocalVideo(false).
    // Retry only camera-busy ownership transitions, never permission/config errors.
    if(!stopped && (code==ERROR_CAMERA_IN_USE || code==ERROR_MAX_CAMERAS_IN_USE) && retries++<8)retryAfterClose={start(texture,front,fps)}
    else if(!stopped)failed(IllegalStateException("AR camera error: "+code))
    camera.close()
   }
  },handler)
  opening=true
 }
 private fun finishClose(){surface?.release();surface=null;val done=closeCallback;closeCallback=null;done?.invoke()}
 fun close(done:()->Unit){stopped=true;closeCallback=done;try{session?.stopRepeating()}catch(_:Exception){};session?.close();session=null;val camera=device;if(camera!=null)camera.close() else if(!opening)finishClose()}
}
