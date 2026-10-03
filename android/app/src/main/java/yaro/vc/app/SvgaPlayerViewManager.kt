package yaro.vc.app

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

class SvgaPlayerViewManager : SimpleViewManager<SVGAImageView>() {
  private val sources = WeakHashMap<SVGAImageView, String>()

  override fun getName(): String = "SvgaPlayerView"

  override fun createViewInstance(reactContext: ThemedReactContext): SVGAImageView =
    SVGAImageView(reactContext).apply {
      loops = 0
      clearsAfterDetached = false
      scaleType = android.widget.ImageView.ScaleType.FIT_CENTER
    }

  @ReactProp(name = "loops", defaultInt = 0)
  fun setLoops(view: SVGAImageView, loops: Int) {
    view.loops = loops
  }

  @ReactProp(name = "source")
  fun setSource(view: SVGAImageView, source: String?) {
    view.stopAnimation(true)
    if (source.isNullOrBlank()) {
      sources.remove(view)
      view.setImageDrawable(null)
      return
    }

    sources[view] = source
    try {
      android.util.Log.d("SvgaPlayerViewManager", "Starting decodeFromURL: $source")
      SVGAParser.shareParser().decodeFromURL(
        URL(source),
        object : SVGAParser.ParseCompletion {
          override fun onComplete(videoItem: SVGAVideoEntity) {
            view.post {
              if (sources[view] != source) return@post
              val drawable = SVGADrawable(videoItem)
              view.setImageDrawable(drawable)
              view.startAnimation()
              android.util.Log.d("SvgaPlayerViewManager", "SVGA animation started successfully: $source")
            }
          }

          override fun onError() {
            android.util.Log.e("SvgaPlayerViewManager", "Error decoding SVGA from URL: $source")
            if (sources[view] == source) {
              view.post { view.setImageDrawable(null) }
            }
          }
        },
      )
    } catch (e: Exception) {
      android.util.Log.e("SvgaPlayerViewManager", "Exception loading SVGA: $source", e)
      view.setImageDrawable(null)
    }
  }

  override fun onDropViewInstance(view: SVGAImageView) {
    sources.remove(view)
    view.stopAnimation(true)
    view.setImageDrawable(null)
    super.onDropViewInstance(view)
  }
}
