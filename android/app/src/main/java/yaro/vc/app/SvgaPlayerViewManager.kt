package yaro.vc.app

import android.content.Context
import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.opensource.svgaplayer.SVGACallback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
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

  private fun emit(view: SVGAImageView, event: String) {
    (view.context as? ThemedReactContext)?.getJSModule(RCTEventEmitter::class.java)
      ?.receiveEvent(view.id, event, Arguments.createMap())
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
        override fun onFinished() { emit(this@apply, "topPlaybackFinished") }
        override fun onPause() {}
        override fun onRepeat() {}
        override fun onStep(frame: Int, percentage: Double) {}
      }
      loops = 0
      clearsAfterStop = false
      clearsAfterDetached = false
      scaleType = android.widget.ImageView.ScaleType.FIT_CENTER
    }

  @ReactProp(name = "loops", defaultInt = 0)
  fun setLoops(view: SVGAImageView, loops: Int) {
    view.loops = loops
  }

  @ReactProp(name = "source")
  fun setSource(view: SVGAImageView, source: String?) {
    val rView = view as? ResumableSVGAImageView
    if (source.isNullOrBlank()) {
      sources.remove(view)
      rView?.lastVideoItem = null
      view.post {
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
        view.post {
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
        view.post { if (sources[view] == source) emit(view, "topPlaybackError") }
        android.util.Log.e("SvgaPlayerViewManager", "Error decoding SVGA from source: $source")
      }
    }

    try {
      if (source.startsWith("http://", ignoreCase = true) || source.startsWith("https://", ignoreCase = true)) {
        SVGAParser.shareParser().decodeFromURL(URL(source), callback)
      } else {
        var assetPath = source
        if (assetPath.startsWith("asset://", ignoreCase = true)) {
          assetPath = assetPath.substring("asset://".length)
        } else if (assetPath.startsWith("assets/", ignoreCase = true)) {
          assetPath = assetPath.substring("assets/".length)
        }
        SVGAParser.shareParser().decodeFromAssets(assetPath, callback)
      }
    } catch (e: Exception) {
      view.post { if (sources[view] == source) emit(view, "topPlaybackError") }
      android.util.Log.e("SvgaPlayerViewManager", "Exception loading SVGA: $source", e)
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
