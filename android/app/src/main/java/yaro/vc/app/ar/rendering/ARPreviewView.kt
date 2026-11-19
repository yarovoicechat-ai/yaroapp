package yaro.vc.app.ar.rendering

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.view.View
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import java.lang.ref.WeakReference
import java.nio.ByteBuffer
import java.util.concurrent.CopyOnWriteArrayList

/** Native-only preview of the same processed pixels submitted to Agora. */
class ARPreviewView(context: Context) : View(context) {
    @Volatile var trackId = -1
    var mirror = true
    private val frameLock = Any()
    private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
    private var displayed: Bitmap? = null
    private var pending: Bitmap? = null
    private var queued = false

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        ARPreviewFrames.attach(this)
    }

    override fun onDetachedFromWindow() {
        ARPreviewFrames.detach(this)
        synchronized(frameLock) {
            displayed?.recycle()
            pending?.recycle()
            displayed = null
            pending = null
            queued = false
        }
        super.onDetachedFromWindow()
    }

    fun offer(pixels: ByteBuffer, frameWidth: Int, frameHeight: Int) {
        synchronized(frameLock) {
            if (queued || !isAttachedToWindow) return
            if (pending?.width != frameWidth || pending?.height != frameHeight) {
                pending?.recycle()
                pending = Bitmap.createBitmap(frameWidth, frameHeight, Bitmap.Config.ARGB_8888)
            }
            pixels.rewind()
            pending!!.copyPixelsFromBuffer(pixels)
            queued = true
        }
        postInvalidate()
    }

    override fun onDraw(canvas: Canvas) {
        canvas.drawColor(Color.BLACK)
        synchronized(frameLock) {
            if (queued) {
                val previous = displayed
                displayed = pending
                pending = previous
                queued = false
            }
            val frame = displayed ?: return
            val scale = maxOf(width.toFloat() / frame.width, height.toFloat() / frame.height)
            val scaledWidth = frame.width * scale
            val scaledHeight = frame.height * scale
            val target = RectF((width - scaledWidth) / 2, (height - scaledHeight) / 2,
                (width + scaledWidth) / 2, (height + scaledHeight) / 2)
            canvas.save()
            if (mirror) canvas.scale(-1f, 1f, width / 2f, height / 2f)
            canvas.drawBitmap(frame, null as Rect?, target, paint)
            canvas.restore()
        }
    }
}

object ARPreviewFrames {
    private val views = CopyOnWriteArrayList<WeakReference<ARPreviewView>>()
    fun attach(view: ARPreviewView) { views.add(WeakReference(view)) }
    fun detach(view: ARPreviewView) { views.removeAll { it.get() == null || it.get() === view } }
    fun submit(trackId: Int, pixels: ByteBuffer, width: Int, height: Int) {
        views.forEach { reference ->
            val view = reference.get()
            if (view?.trackId == trackId) view.offer(pixels, width, height)
        }
    }
}

class ARPreviewViewManager : SimpleViewManager<ARPreviewView>() {
    override fun getName() = "YaroARPreview"
    override fun createViewInstance(context: ThemedReactContext) = ARPreviewView(context)
    @ReactProp(name = "trackId")
    fun setTrackId(view: ARPreviewView, trackId: Int) { view.trackId = trackId }
    @ReactProp(name = "mirror", defaultBoolean = true)
    fun setMirror(view: ARPreviewView, mirror: Boolean) { view.mirror = mirror; view.invalidate() }
}
