package yaro.vc.app

import android.content.Context
import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.opensource.svgaplayer.SVGACallback
import com.opensource.svgaplayer.SVGADrawable
import com.opensource.svgaplayer.SVGAImageView
import com.opensource.svgaplayer.SVGAParser
import com.opensource.svgaplayer.SVGAVideoEntity
import java.net.URL
import java.util.WeakHashMap

class ResumableSVGAImageView(context: Context) : SVGAImageView(context) {
  var lastVideoItem: SVGAVideoEntity? = null
  var isAutoPlaying: Boolean = true

  fun resumeIfNeeded() {
    if (!isAutoPlaying) return
    post {
      val item = lastVideoItem
      if (item != null) {
        if (drawable == null) {
          setImageDrawable(SVGADrawable(item))
        }
        if (!isAnimating) {
          startAnimation()
        }
      } else if (drawable != null && !isAnimating) {
        startAnimation()
      }
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    resumeIfNeeded()
  }

  override fun onWindowFocusChanged(hasWindowFocus: Boolean) {
    super.onWindowFocusChanged(hasWindowFocus)
    if (hasWindowFocus) {
      resumeIfNeeded()
    }
  }

  override fun onVisibilityChanged(changedView: View, visibility: Int) {
    super.onVisibilityChanged(changedView, visibility)
    if (visibility == View.VISIBLE) {
      resumeIfNeeded()
    }
  }
}

class SvgaPlayerViewManager : SimpleViewManager<SVGAImageView>() {
  private val sources = WeakHashMap<SVGAImageView, String>()
  private val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())

  private fun emit(view: SVGAImageView, event: String) {
    var ctx: Context? = view.context
    while (ctx is android.content.ContextWrapper) {
      if (ctx is ThemedReactContext) break
      ctx = ctx.baseContext
    }
    val reactContext = ctx as? ThemedReactContext ?: return
    try {
      reactContext.getJSModule(RCTEventEmitter::class.java)
        ?.receiveEvent(view.id, event, Arguments.createMap())
    } catch (e: Exception) {
      android.util.Log.w("SvgaPlayerViewManager", "Failed to emit $event: ${e.message}")
    }
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    mutableMapOf(
      "topPlaybackFinished" to mapOf("registrationName" to "onPlaybackFinished"),
      "topPlaybackError" to mapOf("registrationName" to "onPlaybackError")
    )

  override fun getName(): String = "SvgaPlayerView"

  override fun createViewInstance(reactContext: ThemedReactContext): SVGAImageView =
    ResumableSVGAImageView(reactContext).apply {
      callback = object : SVGACallback {
        override fun onFinished() {
          emit(this@apply, "topPlaybackFinished")
        }
        override fun onPause() {}
        override fun onRepeat() {}
        override fun onStep(frame: Int, percentage: Double) {}
      }
      loops = 0
      clearsAfterStop = false
      clearsAfterDetached = false
      scaleType = android.widget.ImageView.ScaleType.FIT_CENTER
    }

  @ReactProp(name = "autoPlay", defaultBoolean = true)
  fun setAutoPlay(view: SVGAImageView, autoPlay: Boolean) {
    (view as? ResumableSVGAImageView)?.isAutoPlaying = autoPlay
    if (autoPlay) (view as? ResumableSVGAImageView)?.resumeIfNeeded()
    else view.stopAnimation(false)
  }

  @ReactProp(name = "loops", defaultInt = 0)
  fun setLoops(view: SVGAImageView, loops: Int) {
    view.loops = loops
  }

  @ReactProp(name = "scaleMode")
  fun setScaleMode(view: SVGAImageView, scaleMode: String?) {
    mainHandler.post {
      when (scaleMode?.lowercase()) {
        "aspectfill", "centercrop" -> view.scaleType = android.widget.ImageView.ScaleType.CENTER_CROP
        "fill", "fitxy" -> view.scaleType = android.widget.ImageView.ScaleType.FIT_XY
        "center" -> view.scaleType = android.widget.ImageView.ScaleType.CENTER
        else -> view.scaleType = android.widget.ImageView.ScaleType.FIT_CENTER
      }
    }
  }

  @ReactProp(name = "resizeMode")
  fun setResizeMode(view: SVGAImageView, resizeMode: String?) {
    mainHandler.post {
      when (resizeMode?.lowercase()) {
        "cover" -> view.scaleType = android.widget.ImageView.ScaleType.CENTER_CROP
        "stretch" -> view.scaleType = android.widget.ImageView.ScaleType.FIT_XY
        "center" -> view.scaleType = android.widget.ImageView.ScaleType.CENTER
        else -> view.scaleType = android.widget.ImageView.ScaleType.FIT_CENTER
      }
    }
  }

  @ReactProp(name = "muteBuiltInAudio", defaultBoolean = false)
  fun setMuteBuiltInAudio(view: SVGAImageView, mute: Boolean) {
    // SVGA audio mute hook
  }

  @ReactProp(name = "source")
  fun setSource(view: SVGAImageView, source: String?) {
    val rView = view as? ResumableSVGAImageView
    if (source.isNullOrBlank()) {
      sources.remove(view)
      rView?.lastVideoItem = null
      mainHandler.post {
        view.stopAnimation(false)
        view.setImageDrawable(null)
      }
      return
    }

    if (sources[view] == source && rView?.lastVideoItem != null) {
      rView.resumeIfNeeded()
      return
    }

    sources[view] = source

    val callback = object : SVGAParser.ParseCompletion {
      override fun onComplete(videoItem: SVGAVideoEntity) {
        mainHandler.post {
          if (sources[view] != source) return@post
          rView?.lastVideoItem = videoItem
          val drawable = SVGADrawable(videoItem)
          view.setImageDrawable(drawable)
          if (rView?.isAutoPlaying != false) {
            view.startAnimation()
          }
        }
      }

      override fun onError() {
        android.util.Log.e("SvgaPlayerViewManager", "Error decoding SVGA from source: $source")
        emit(view, "topPlaybackError")
      }
    }

    try {
      try {
        SVGAParser.shareParser().init(view.context.applicationContext)
      } catch (_: Exception) {}

      val cleanSource = source.trim().replace(" ", "%20")
      if (cleanSource.startsWith("http://", ignoreCase = true) || cleanSource.startsWith("https://", ignoreCase = true)) {
        SVGAParser.shareParser().decodeFromURL(URL(cleanSource), callback)
      } else if (cleanSource.startsWith("file://", ignoreCase = true) || cleanSource.startsWith("/")) {
        val filePath = if (cleanSource.startsWith("file://")) cleanSource.substring(7) else cleanSource
        val file = java.io.File(filePath)
        if (file.exists()) {
          SVGAParser.shareParser().decodeFromInputStream(java.io.FileInputStream(file), file.name, callback, true)
        } else {
          android.util.Log.e("SvgaPlayerViewManager", "File not found: $filePath")
          emit(view, "topPlaybackError")
        }
      } else {
        var assetPath = cleanSource
        if (assetPath.startsWith("asset://", ignoreCase = true)) {
          assetPath = assetPath.substring("asset://".length)
        } else if (assetPath.startsWith("assets/", ignoreCase = true)) {
          assetPath = assetPath.substring("assets/".length)
        }
        SVGAParser.shareParser().decodeFromAssets(assetPath, callback)
      }
    } catch (e: Exception) {
      android.util.Log.e("SvgaPlayerViewManager", "Exception loading SVGA: $source", e)
      emit(view, "topPlaybackError")
    }
  }

  override fun onDropViewInstance(view: SVGAImageView) {
    sources.remove(view)
    (view as? ResumableSVGAImageView)?.lastVideoItem = null
    view.stopAnimation(false)
    view.setImageDrawable(null)
    super.onDropViewInstance(view)
  }
}
