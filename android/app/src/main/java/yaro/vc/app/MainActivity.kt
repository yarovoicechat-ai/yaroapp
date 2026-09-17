package yaro.vc.app

import android.app.PictureInPictureParams
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Rational
import android.view.WindowManager
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  companion object {
    @JvmStatic var isCallActive: Boolean = false
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    // Keep every React Navigation scene edge-to-edge, matching the launch and
    // authentication surfaces. Screen-level safe-area padding keeps controls
    // clear of system icons without Android reserving a second header strip.
    WindowCompat.setDecorFitsSystemWindows(window, false)
    window.statusBarColor = Color.TRANSPARENT
    window.navigationBarColor = Color.TRANSPARENT
    window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }

  override fun onResume() {
    super.onResume()
    window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }

  override fun onNewIntent(intent: android.content.Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
    if (intent?.getStringExtra("navigate_to") == "OnGoing") {
      try {
        val reactContext = reactInstanceManager.currentReactContext
        if (reactContext != null && reactContext.hasActiveReactInstance()) {
          val map: com.facebook.react.bridge.WritableMap = com.facebook.react.bridge.Arguments.createMap()
          map.putBoolean("value", true)
          reactContext.getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onFloatingCallOpened", map)
        }
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "MithiChat"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  fun enterCallPictureInPicture() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isCallActive && !isInPictureInPictureMode) {
      val params = PictureInPictureParams.Builder()
        .setAspectRatio(Rational(9, 16))
        .build()
      enterPictureInPictureMode(params)
    }
  }

  override fun onUserLeaveHint() {
    if (isCallActive) enterCallPictureInPicture()
    super.onUserLeaveHint()
  }
}
