package yaro.vc.app

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Build
import androidx.core.view.WindowCompat
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.ViewManager

class SystemBarsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "SystemBars"

  @ReactMethod
  fun setRoomAppearance(isRoom: Boolean) {
    UiThreadUtil.runOnUiThread {
      val activity = context.currentActivity ?: return@runOnUiThread
      val color = if (isRoom) Color.parseColor("#0C0806") else Color.WHITE
      // Cover the native surface exposed while the IME is being removed too.
      activity.window.setBackgroundDrawable(ColorDrawable(color))
      activity.window.decorView.setBackgroundColor(color)
      activity.window.navigationBarColor = if (isRoom) color else Color.TRANSPARENT
      WindowCompat.getInsetsController(activity.window, activity.window.decorView)
        .isAppearanceLightNavigationBars = !isRoom
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        activity.window.isNavigationBarContrastEnforced = false
      }
    }
  }
}

class SystemBarsPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(SystemBarsModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
