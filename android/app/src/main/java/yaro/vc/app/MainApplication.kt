package yaro.vc.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.opensource.svgaplayer.SVGAParser

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              add(CallPipPackage())
              add(FloatingCallPackage())
              add(LocalMusicPackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    try {
      SVGAParser.shareParser().init(this)
    } catch (e: Exception) {
      if (BuildConfig.DEBUG) {
        android.util.Log.e("MainApplication", "SVGAParser init failed", e)
      }
    }
    createNotificationChannel()
    loadReactNative(this)
  }

  private fun createNotificationChannel() {
    try {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
        val channelId = "call_channel"
        val channelName = "Incoming Calls"
        val channelDescription = "Notifications for incoming calls"
        val importance = android.app.NotificationManager.IMPORTANCE_HIGH

        val channel = android.app.NotificationChannel(channelId, channelName, importance).apply {
          description = channelDescription
          enableVibration(true)
          
          val soundUri = android.net.Uri.parse(
            "${android.content.ContentResolver.SCHEME_ANDROID_RESOURCE}://${packageName}/raw/incallmanager_ringtone"
          )
          
          val audioAttributes = android.media.AudioAttributes.Builder()
            .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .build()
            
          setSound(soundUri, audioAttributes)
        }

        val notificationManager = getSystemService(android.app.NotificationManager::class.java)
        notificationManager?.createNotificationChannel(channel)
      }
    } catch (e: Exception) {
      if (BuildConfig.DEBUG) {
        android.util.Log.e("MainApplication", "Failed to create notification channel", e)
      }
    }
  }
}
