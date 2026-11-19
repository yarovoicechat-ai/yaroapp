package yaro.vc.app.ar
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
class YaroARPackage:ReactPackage {
 override fun createNativeModules(context:ReactApplicationContext):List<NativeModule> = listOf(YaroARModule(context))
 override fun createViewManagers(context:ReactApplicationContext):List<ViewManager<*,*>> = listOf(yaro.vc.app.ar.rendering.ARPreviewViewManager())
}
