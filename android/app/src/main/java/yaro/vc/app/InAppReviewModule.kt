package yaro.vc.app

import android.app.Activity
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*
import com.google.android.play.core.review.ReviewInfo
import com.google.android.play.core.review.ReviewManager
import com.google.android.play.core.review.ReviewManagerFactory

/**
 * Official Google Play In-App Review Native Module for Yaro
 *
 * Implements Google Play In-App Review API using Play Core Review library.
 * Flow:
 * 1. Request ReviewFlow via ReviewManager
 * 2. Launch ReviewFlow with Activity & ReviewInfo
 * 3. Resolve promise cleanly regardless of whether Google Play decided to show the prompt
 *    (as required by Google Play policy).
 */
class InAppReviewModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "InAppReviewModule"
    }

    override fun getName(): String = "InAppReviewModule"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        try {
            // Google Play In-App Review requires Android 5.0 (API 21)+
            val available = Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP
            promise.resolve(available)
        } catch (e: Exception) {
            Log.w(TAG, "isAvailable check failed: ${e.message}")
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun requestReview(promise: Promise) {
        val activity: Activity? = reactContext.currentActivity
        if (activity == null) {
            Log.w(TAG, "Current Activity is null, cannot request in-app review")
            promise.resolve(false)
            return
        }

        try {
            Log.i(TAG, "Creating Google Play ReviewManager...")
            val manager: ReviewManager = ReviewManagerFactory.create(activity)
            val request = manager.requestReviewFlow()

            request.addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val reviewInfo: ReviewInfo = task.result
                    Log.i(TAG, "ReviewFlow requested successfully, launching review flow dialog...")
                    val flow = manager.launchReviewFlow(activity, reviewInfo)

                    flow.addOnCompleteListener { flowTask ->
                        // Google Play does not inform the app whether the user reviewed or dismissed.
                        // Play API contract dictates app continues normally.
                        Log.i(TAG, "Google Play Review flow completed. isSuccessful=${flowTask.isSuccessful}")
                        promise.resolve(true)
                    }
                } else {
                    val ex = task.exception
                    Log.w(TAG, "requestReviewFlow was unsuccessful: ${ex?.message}")
                    promise.resolve(false)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during requestReview", e)
            promise.resolve(false)
        }
    }
}

