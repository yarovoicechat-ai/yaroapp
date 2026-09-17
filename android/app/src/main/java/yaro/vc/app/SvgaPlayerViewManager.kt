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
      loops = 1
      clearsAfterDetached = true
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
      SVGAParser.shareParser().decodeFromURL(
        URL(source),
        object : SVGAParser.ParseCompletion {
          override fun onComplete(videoItem: SVGAVideoEntity) {
            if (sources[view] != source) return
            view.setImageDrawable(SVGADrawable(videoItem))
            view.startAnimation()
          }

          override fun onError() {
            if (sources[view] == source) view.setImageDrawable(null)
          }
        },
      )
    } catch (_: Exception) {
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
