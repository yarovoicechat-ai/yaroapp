package yaro.vc.app

import android.animation.ValueAnimator
import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.*
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import android.provider.Settings
import android.util.TypedValue
import android.view.*
import android.widget.Chronometer
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.net.URL
import kotlin.concurrent.thread

class FloatingCallService : Service() {

    companion object {
        const val ACTION_START = "yaro.vc.app.ACTION_START_FLOATING"
        const val ACTION_STOP = "yaro.vc.app.ACTION_STOP_FLOATING"
        const val ACTION_UPDATE = "yaro.vc.app.ACTION_UPDATE_FLOATING"

        const val EXTRA_CALLER_NAME = "caller_name"
        const val EXTRA_CALLER_IMAGE = "caller_image"
        const val EXTRA_IS_MUTED = "is_muted"
        const val EXTRA_IS_SPEAKER = "is_speaker"

        const val CHANNEL_ID = "call_floating_channel"
        const val NOTIFICATION_ID = 998822

        var instance: FloatingCallService? = null
            private set
    }

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var params: WindowManager.LayoutParams? = null

    // Subviews
    private var collapsedView: View? = null
    private var expandedView: View? = null
    private var avatarImageView: ImageView? = null
    private var initialsTextView: TextView? = null
    private var chronometer: Chronometer? = null
    private var muteButton: LinearLayout? = null
    private var muteIconView: ImageView? = null
    private var speakerButton: LinearLayout? = null
    private var speakerIconView: ImageView? = null
    private var endButton: LinearLayout? = null
    private var openButton: LinearLayout? = null

    private var isMuted = false
    private var isSpeaker = true
    private var callerName = "Yaro"
    private var callerImage = ""

    private var isExpanded = false
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var touchDownTime = 0L

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        safeStartForeground()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) return START_NOT_STICKY

        android.util.Log.d("FLOATING", "[ FLOATING ] Service received onStartCommand action=${intent.action}")

        when (intent.action) {
            ACTION_START -> {
                callerName = intent.getStringExtra(EXTRA_CALLER_NAME) ?: "Yaro"
                callerImage = intent.getStringExtra(EXTRA_CALLER_IMAGE) ?: ""
                isMuted = intent.getBooleanExtra(EXTRA_IS_MUTED, false)
                isSpeaker = intent.getBooleanExtra(EXTRA_IS_SPEAKER, true)

                android.util.Log.d("FLOATING", "[ FLOATING ] Service started for caller $callerName")
                safeStartForeground()
                showFloatingBubble()
            }
            ACTION_UPDATE -> {
                isMuted = intent.getBooleanExtra(EXTRA_IS_MUTED, isMuted)
                isSpeaker = intent.getBooleanExtra(EXTRA_IS_SPEAKER, isSpeaker)
                updateControlsUI()
            }
            ACTION_STOP -> {
                android.util.Log.d("FLOATING", "[ FLOATING ] Service stopping requested")
                removeFloatingBubble()
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        stopForeground(STOP_FOREGROUND_REMOVE)
                    } else {
                        @Suppress("DEPRECATION")
                        stopForeground(true)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                stopSelf()
            }
        }

        return START_NOT_STICKY
    }

    override fun onDestroy() {
        android.util.Log.d("FLOATING", "[ FLOATING ] Service onDestroy called")
        removeFloatingBubble()
        instance = null
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Ongoing Call Floating Bubble",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows floating ongoing call status overlay"
                setSound(null, null)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Ongoing Voice Call")
            .setContentText("Call with $callerName in progress")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun showFloatingBubble() {
        val hasOverlay = Settings.canDrawOverlays(this)
        android.util.Log.d("FLOATING", "[ FLOATING ] Overlay permission = $hasOverlay")
        if (!hasOverlay) {
            android.util.Log.w("FLOATING", "[ FLOATING ] Overlay permission is FALSE. Cannot draw floating bubble. Call audio remains active.")
            return
        }
        if (floatingView != null) {
            android.util.Log.d("FLOATING", "[ FLOATING ] Bubble view already exists. Reusing existing bubble.")
            updateControlsUI()
            return
        }

        android.os.Handler(android.os.Looper.getMainLooper()).post {
            try {
                android.util.Log.d("FLOATING", "[ FLOATING ] Creating bubble view")
                val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE
                }

                val displayMetrics = resources.displayMetrics
                val startX = (displayMetrics.widthPixels - dpToPx(80)).coerceAtLeast(30)
                val startY = (displayMetrics.heightPixels / 3).coerceAtLeast(200)

                android.util.Log.d("FLOATING", "[ FLOATING ] Bubble position x=$startX y=$startY")
                android.util.Log.d("FLOATING", "[ FLOATING ] Bubble width=${dpToPx(64)} height=${dpToPx(64)}")

                params = WindowManager.LayoutParams(
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    layoutType,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                    PixelFormat.TRANSLUCENT
                ).apply {
                    gravity = Gravity.TOP or Gravity.START
                    x = startX
                    y = startY
                }

                floatingView = createBubbleLayout()
                windowManager?.addView(floatingView, params)
                android.util.Log.d("FLOATING", "[ FLOATING ] WindowManager.addView called. Bubble visible.")
            } catch (e: Exception) {
                android.util.Log.e("FLOATING", "[ FLOATING ] WindowManager.addView error: ${e.message}", e)
            }
        }
    }

    private fun createBubbleLayout(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 0)
        }

        // --- COLLAPSED VIEW (68dp Circle Bubble) ---
        collapsedView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            val size = dpToPx(68)
            layoutParams = LinearLayout.LayoutParams(size, size)

            val bg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                colors = intArrayOf(Color.parseColor("#0F172A"), Color.parseColor("#0B0F17"))
                setStroke(dpToPx(2), Color.parseColor("#00F2FE"))
            }
            background = bg
            setPadding(dpToPx(4), dpToPx(4), dpToPx(4), dpToPx(4))
        }

        val avatarContainer = android.widget.FrameLayout(this).apply {
            val size = dpToPx(44)
            layoutParams = LinearLayout.LayoutParams(size, size)
        }

        avatarImageView = ImageView(this).apply {
            layoutParams = android.widget.FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            scaleType = ImageView.ScaleType.CENTER_CROP
        }

        initialsTextView = TextView(this).apply {
            layoutParams = android.widget.FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            gravity = Gravity.CENTER
            text = getInitials(callerName)
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            typeface = Typeface.DEFAULT_BOLD
            val bg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#1E293B"))
            }
            background = bg
        }

        avatarContainer.addView(avatarImageView)
        avatarContainer.addView(initialsTextView)

        if (callerImage.isNotEmpty()) {
            loadAvatarAsync(callerImage)
        } else {
            avatarImageView?.visibility = View.GONE
            initialsTextView?.visibility = View.VISIBLE
        }

        chronometer = Chronometer(this).apply {
            setTextColor(Color.parseColor("#00F2FE"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 9f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            base = SystemClock.elapsedRealtime()
            start()
        }

        (collapsedView as LinearLayout).addView(avatarContainer)
        (collapsedView as LinearLayout).addView(chronometer)

        // --- EXPANDED CONTROLS CARD ---
        expandedView = createExpandedControlsView().apply {
            visibility = View.GONE
        }

        root.addView(collapsedView)
        root.addView(expandedView)

        // Attach Touch Listener for Drag & Click on Collapsed Bubble
        collapsedView?.setOnTouchListener(object : View.OnTouchListener {
            override fun onTouch(v: View?, event: MotionEvent?): Boolean {
                if (event == null) return false

                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        touchDownTime = System.currentTimeMillis()
                        initialX = params?.x ?: 0
                        initialY = params?.y ?: 0
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = (event.rawX - initialTouchX).toInt()
                        val dy = (event.rawY - initialTouchY).toInt()
                        params?.x = initialX + dx
                        params?.y = initialY + dy
                        windowManager?.updateViewLayout(floatingView, params)
                        return true
                    }
                    MotionEvent.ACTION_UP -> {
                        val diffTime = System.currentTimeMillis() - touchDownTime
                        val diffX = Math.abs(event.rawX - initialTouchX)
                        val diffY = Math.abs(event.rawY - initialTouchY)

                        if (diffTime < 250 && diffX < 15 && diffY < 15) {
                            openAppAndCallScreen()
                        } else {
                            snapToEdge()
                        }
                        return true
                    }
                }
                return false
            }
        })

        return root
    }

    private fun createExpandedControlsView(): View {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dpToPx(12), dpToPx(8), dpToPx(12), dpToPx(8))
            val bg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dpToPx(24).toFloat()
                colors = intArrayOf(Color.parseColor("#0F172A"), Color.parseColor("#0B0F17"))
                setStroke(dpToPx(1.5f), Color.parseColor("#00F2FE"))
            }
            background = bg
        }

        // Mute Button
        muteButton = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dpToPx(8), dpToPx(6), dpToPx(8), dpToPx(6))
            setOnClickListener {
                isMuted = !isMuted
                sendJSEvent("onFloatingCallMuteToggled", isMuted)
                updateControlsUI()
            }
        }
        muteIconView = ImageView(this).apply {
            layoutParams = LinearLayout.LayoutParams(dpToPx(28), dpToPx(28))
            setImageResource(android.R.drawable.ic_lock_silent_mode)
        }
        muteButton?.addView(muteIconView)

        // Speaker Button
        speakerButton = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dpToPx(8), dpToPx(6), dpToPx(8), dpToPx(6))
            setOnClickListener {
                isSpeaker = !isSpeaker
                sendJSEvent("onFloatingCallSpeakerToggled", isSpeaker)
                updateControlsUI()
            }
        }
        speakerIconView = ImageView(this).apply {
            layoutParams = LinearLayout.LayoutParams(dpToPx(28), dpToPx(28))
            setImageResource(android.R.drawable.ic_btn_speak_now)
        }
        speakerButton?.addView(speakerIconView)

        // Open App Button
        openButton = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dpToPx(8), dpToPx(6), dpToPx(8), dpToPx(6))
            setOnClickListener {
                openAppAndCallScreen()
            }
        }
        val openIcon = ImageView(this).apply {
            layoutParams = LinearLayout.LayoutParams(dpToPx(28), dpToPx(28))
            setImageResource(android.R.drawable.ic_menu_view)
        }
        openButton?.addView(openIcon)

        // End Call Button
        endButton = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dpToPx(8), dpToPx(6), dpToPx(8), dpToPx(6))
            val bg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#ef4444"))
            }
            background = bg
            setOnClickListener {
                sendJSEvent("onFloatingCallEnded", true)
                stopSelf()
            }
        }
        val endIcon = ImageView(this).apply {
            layoutParams = LinearLayout.LayoutParams(dpToPx(28), dpToPx(28))
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
        }
        endButton?.addView(endIcon)

        card.addView(muteButton)
        card.addView(speakerButton)
        card.addView(openButton)
        card.addView(endButton)

        updateControlsUI()
        return card
    }

    private fun updateControlsUI() {
        val muteColor = if (isMuted) Color.parseColor("#ef4444") else Color.WHITE
        muteIconView?.setColorFilter(muteColor)

        val speakerColor = if (isSpeaker) Color.parseColor("#10b981") else Color.WHITE
        speakerIconView?.setColorFilter(speakerColor)
    }

    private fun toggleExpandedView() {
        isExpanded = !isExpanded
        if (isExpanded) {
            expandedView?.visibility = View.VISIBLE
        } else {
            expandedView?.visibility = View.GONE
        }
        windowManager?.updateViewLayout(floatingView, params)
    }

    private fun snapToEdge() {
        val displayMetrics = resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels
        val currentX = params?.x ?: 0
        val targetX = if (currentX + (dpToPx(60) / 2) < screenWidth / 2) 20 else screenWidth - dpToPx(80)

        val animator = ValueAnimator.ofInt(currentX, targetX)
        animator.duration = 200
        animator.addUpdateListener { animation ->
            params?.x = animation.animatedValue as Int
            try {
                windowManager?.updateViewLayout(floatingView, params)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        animator.start()
    }

    private fun openAppAndCallScreen() {
        sendJSEvent("onFloatingCallOpened", true)

        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("navigate_to", "OnGoing")
        }
        startActivity(launchIntent)
    }

    private fun safeStartForeground() {
        try {
            val notification = createNotification()
            startForeground(NOTIFICATION_ID, notification)
            android.util.Log.d("FLOATING", "[ FLOATING ] safeStartForeground executed successfully")
        } catch (e: Exception) {
            android.util.Log.e("FLOATING", "[ FLOATING ] safeStartForeground exception: ${e.message}", e)
        }
    }

    private fun removeFloatingBubble() {
        android.os.Handler(android.os.Looper.getMainLooper()).post {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            if (floatingView != null) {
                try {
                    windowManager?.removeView(floatingView)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                floatingView = null
            }
        }
    }

    private fun sendJSEvent(eventName: String, value: Any) {
        val reactContext = (application as MainApplication).reactNativeHost.reactInstanceManager.currentReactContext
        if (reactContext != null && reactContext.hasActiveReactInstance()) {
            val map: WritableMap = Arguments.createMap()
            when (value) {
                is Boolean -> map.putBoolean("value", value)
                is String -> map.putString("value", value)
                is Int -> map.putInt("value", value)
            }
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, map)
        }
    }

    private fun getInitials(name: String): String {
        return name.trim().split("\\s+".toRegex())
            .take(2)
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .joinToString("")
            .ifEmpty { "VC" }
    }

    private fun loadAvatarAsync(urlStr: String) {
        thread {
            try {
                val url = URL(urlStr)
                val bmp = BitmapFactory.decodeStream(url.openConnection().getInputStream())
                avatarImageView?.post {
                    if (bmp != null) {
                        avatarImageView?.setImageBitmap(bmp)
                        avatarImageView?.visibility = View.VISIBLE
                        initialsTextView?.visibility = View.GONE
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }

    private fun dpToPx(dp: Float): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
}
