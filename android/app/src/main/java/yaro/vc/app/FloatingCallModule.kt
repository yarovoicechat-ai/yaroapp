package yaro.vc.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*

class FloatingCallModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private var incomingPlayer: android.media.MediaPlayer? = null
        private var incomingTransactionId: String? = null
        private val incomingHandler = android.os.Handler(android.os.Looper.getMainLooper())
        private var incomingStopTask: Runnable? = null

        @Synchronized
        private fun stopIncomingPlayer(transactionId: String? = null) {
            if (transactionId != null && incomingTransactionId != transactionId) return
            incomingStopTask?.let(incomingHandler::removeCallbacks)
            incomingStopTask = null
            try { incomingPlayer?.stop() } catch (_: Exception) {}
            try { incomingPlayer?.release() } catch (_: Exception) {}
            incomingPlayer = null
            incomingTransactionId = null
        }
    }

    override fun getName(): String = "FloatingCall"

    @ReactMethod
    fun startIncomingRingtone(transactionId: String, expiresAtMs: Double) {
        val remainingMs = expiresAtMs.toLong() - System.currentTimeMillis()
        if (transactionId.isBlank() || remainingMs <= 0) return
        if (incomingTransactionId == transactionId && incomingPlayer?.isPlaying == true) return

        stopIncomingPlayer()
        try {
            val descriptor = reactContext.resources.openRawResourceFd(R.raw.incallmanager_ringtone)
            incomingPlayer = android.media.MediaPlayer().apply {
                setAudioAttributes(
                    android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                setDataSource(descriptor.fileDescriptor, descriptor.startOffset, descriptor.length)
                isLooping = true
                prepare()
                start()
            }
            descriptor.close()
            incomingTransactionId = transactionId
            incomingStopTask = Runnable { stopIncomingPlayer(transactionId) }
            incomingHandler.postDelayed(incomingStopTask!!, remainingMs.coerceAtMost(45_000L))
            android.util.Log.i("CALL", "[CALL] RING START tx=$transactionId")
        } catch (error: Exception) {
            stopIncomingPlayer()
            android.util.Log.e("CALL", "[CALL] RING START failed tx=$transactionId", error)
        }
    }

    @ReactMethod
    fun stopIncomingRingtone(transactionId: String?) {
        stopIncomingPlayer(transactionId)
        android.util.Log.i("CALL", "[CALL] RING STOP tx=${transactionId ?: "active"}")
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(reactContext)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactContext.packageName}")
            ).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun startFloatingCall(params: ReadableMap) {
        android.util.Log.d("FLOATING", "[ FLOATING ] Foreground floating call service postponed for this release")
    }

    @ReactMethod
    fun updateFloatingCallState(params: ReadableMap) {
        // Foreground floating call service postponed for this release
    }

    @ReactMethod
    fun stopFloatingCall() {
        android.util.Log.d("FLOATING", "[ FLOATING ] stopFloatingCall called (postponed)")
    }

    @ReactMethod
    fun isFloatingCallActive(promise: Promise) {
        promise.resolve(false)
    }
}
