package yaro.vc.app

import android.content.Context
import android.view.View
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

  override fun getName(): String = "SvgaPlayerView"

  override fun createViewInstance(reactContext: ThemedReactContext): SVGAImageView =
    ResumableSVGAImageView(reactContext).apply {
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

    try {
      SVGAParser.shareParser().decodeFromURL(
        URL(source),
        object : SVGAParser.ParseCompletion {
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
            android.util.Log.e("SvgaPlayerViewManager", "Error decoding SVGA from URL: $source")
          }
        },
      )
    } catch (e: Exception) {
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
