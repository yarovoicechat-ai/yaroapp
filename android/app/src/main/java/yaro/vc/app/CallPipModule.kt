package yaro.vc.app

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class CallPipModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "CallPip"

  @ReactMethod
  fun setCallActive(active: Boolean) {
    MainActivity.isCallActive = active
  }

  @ReactMethod
  fun enterPictureInPicture() {
    (reactContext.currentActivity as? MainActivity)?.enterCallPictureInPicture()
  }
}
