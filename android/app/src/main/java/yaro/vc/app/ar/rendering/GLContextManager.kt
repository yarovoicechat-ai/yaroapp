package yaro.vc.app.ar.rendering
import android.opengl.EGL14
import android.opengl.EGLConfig
class GLContextManager(width:Int,height:Int):AutoCloseable {
 private val display=EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY)
 private val context:android.opengl.EGLContext
 private val surface:android.opengl.EGLSurface
 init {
  check(EGL14.eglInitialize(display,IntArray(2),0,IntArray(2),1)){"EGL initialization failed"}
  val configs=arrayOfNulls<EGLConfig>(1)
  check(EGL14.eglChooseConfig(display,intArrayOf(EGL14.EGL_RENDERABLE_TYPE,EGL14.EGL_OPENGL_ES2_BIT,EGL14.EGL_SURFACE_TYPE,EGL14.EGL_PBUFFER_BIT,EGL14.EGL_RED_SIZE,8,EGL14.EGL_GREEN_SIZE,8,EGL14.EGL_BLUE_SIZE,8,EGL14.EGL_ALPHA_SIZE,8,EGL14.EGL_DEPTH_SIZE,16,EGL14.EGL_NONE),0,configs,0,1,IntArray(1),0))
  context=EGL14.eglCreateContext(display,configs[0],EGL14.EGL_NO_CONTEXT,intArrayOf(EGL14.EGL_CONTEXT_CLIENT_VERSION,2,EGL14.EGL_NONE),0)
  surface=EGL14.eglCreatePbufferSurface(display,configs[0],intArrayOf(EGL14.EGL_WIDTH,width,EGL14.EGL_HEIGHT,height,EGL14.EGL_NONE),0)
  check(context!=EGL14.EGL_NO_CONTEXT && surface!=EGL14.EGL_NO_SURFACE)
  check(EGL14.eglMakeCurrent(display,surface,surface,context))
 }
 override fun close(){EGL14.eglMakeCurrent(display,EGL14.EGL_NO_SURFACE,EGL14.EGL_NO_SURFACE,EGL14.EGL_NO_CONTEXT);EGL14.eglDestroySurface(display,surface);EGL14.eglDestroyContext(display,context);EGL14.eglTerminate(display);EGL14.eglReleaseThread()}
}
