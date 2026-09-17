# Add project specific ProGuard rules here.

-dontwarn com.google.devtools.build.android.desugar.runtime.ThrowableExtension

# App Custom Package & Native Modules
-keep class com.umangchatlive.** { *; }

# React Native Core & Native Modules Reflection
-keep class com.facebook.react.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.react.**
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
    @com.facebook.react.bridge.ReactProp <methods>;
    @com.facebook.react.bridge.ReactPropGroup <methods>;
}

# Nitro Modules Framework & Document Picker
-keep class com.margelo.nitro.** { *; }
-keep class com.margelo.nitro.iap.** { *; }
-dontwarn com.margelo.nitro.**
-keep class com.reactnativedocumentspicker.** { *; }

# React Navigation & Screens
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }

# Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Device Info, Linear Gradient, SVG, Image Picker
-keep class com.learnium.RNDeviceInfo.** { *; }
-keep class com.BV.LinearGradient.** { *; }
-keep class com.horcrux.svg.** { *; }
-keep class com.imagepicker.** { *; }

# Notifee
-keep class app.notifee.** { *; }
-dontwarn app.notifee.**

# Firebase
-keep class io.invertase.firebase.** { *; }
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-dontwarn io.invertase.firebase.**

# Play Integrity API & Google Play Services Tasks
-keep class com.google.android.play.core.integrity.** { *; }
-keep class com.google.android.play.core.tasks.** { *; }
-keep class com.google.android.gms.tasks.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.safetynet.** { *; }
-keep class com.google.android.gms.recaptcha.** { *; }
-keep class com.google.android.recaptcha.** { *; }
-dontwarn com.google.android.play.**
-dontwarn com.google.android.gms.**

# Keep WebViews & WebChromeClient for Firebase reCAPTCHA Fallback
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(...);
}
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void *(...);
}
-keep class android.webkit.** { *; }

# Google Sign-In
-keep class com.reactnativegooglesignin.** { *; }
-keep class com.google.android.gms.auth.api.signin.** { *; }

# React Native IAP / Play Billing
-keep class com.doobooloo.rniap.** { *; }
-keep class com.android.billingclient.** { *; }
-dontwarn com.android.billingclient.**

# Agora SDK
-keep class io.agora.** { *; }
-dontwarn io.agora.**

# SVGAPlayer & Wire
-keep class com.squareup.wire.** { *; }
-keep class com.opensource.svgaplayer.** { *; }
-keep class com.opensource.svgaplayer.proto.** { *; }

# Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# Audio / Sound / Incall Manager / Background Timer
-keep class com.zmxv.RNSound.** { *; }
-keep class com.goodatlas.audiorecord.** { *; }
-keep class com.asterinet.react.bgtimer.** { *; }
-keep class com.ineating.reactnative.incallmanager.** { *; }

# OkHttp & Socket.io
-keep class okhttp3.** { *; }
-keep class io.socket.** { *; }
-dontwarn okhttp3.**
-dontwarn io.socket.**
