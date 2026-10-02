package yaro.vc.app

import android.content.ContentUris
import android.provider.MediaStore
import com.facebook.react.bridge.*

class LocalMusicModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "LocalMusicModule"

    @ReactMethod
    fun getAudioFiles(promise: Promise) {
        // Run query asynchronously in background thread so UI never freezes or stutters
        Thread {
            try {
                val audioList = Arguments.createArray()
                val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
                val projection = arrayOf(
                    MediaStore.Audio.Media._ID,
                    MediaStore.Audio.Media.TITLE,
                    MediaStore.Audio.Media.ARTIST,
                    MediaStore.Audio.Media.DURATION,
                    MediaStore.Audio.Media.DATA,
                    MediaStore.Audio.Media.DISPLAY_NAME,
                    MediaStore.Audio.Media.SIZE
                )

                // Fast indexed query: is_music!=0 OR mime_type LIKE 'audio/%', size >= 20KB
                val selection = "(${MediaStore.Audio.Media.IS_MUSIC} != 0 OR ${MediaStore.Audio.Media.MIME_TYPE} LIKE 'audio/%') AND ${MediaStore.Audio.Media.SIZE} >= 20000"
                // Sort by recently added first for immediate access to newly downloaded songs
                val sortOrder = "${MediaStore.Audio.Media.DATE_ADDED} DESC LIMIT 300"

                val cursor = reactContext.contentResolver.query(uri, projection, selection, null, sortOrder)

                cursor?.use {
                    val idCol = it.getColumnIndex(MediaStore.Audio.Media._ID)
                    val titleCol = it.getColumnIndex(MediaStore.Audio.Media.TITLE)
                    val artistCol = it.getColumnIndex(MediaStore.Audio.Media.ARTIST)
                    val durationCol = it.getColumnIndex(MediaStore.Audio.Media.DURATION)
                    val dataCol = it.getColumnIndex(MediaStore.Audio.Media.DATA)
                    val displayNameCol = it.getColumnIndex(MediaStore.Audio.Media.DISPLAY_NAME)
                    val sizeCol = it.getColumnIndex(MediaStore.Audio.Media.SIZE)

                    while (it.moveToNext()) {
                        val id = if (idCol >= 0) it.getLong(idCol) else 0L
                        var title = if (titleCol >= 0) it.getString(titleCol) else null
                        val displayName = if (displayNameCol >= 0) it.getString(displayNameCol) ?: "Audio Track" else "Audio Track"
                        if (title.isNullOrBlank() || title == "<unknown>") {
                            title = displayName.replace(Regex("\\.[a-zA-Z0-9]+$"), "")
                        }

                        var artist = if (artistCol >= 0) it.getString(artistCol) else null
                        if (artist.isNullOrBlank() || artist == "<unknown>") {
                            artist = "Phone Storage"
                        }

                        val durationMs = if (durationCol >= 0) it.getLong(durationCol) else 0L
                        val path = if (dataCol >= 0) it.getString(dataCol) ?: "" else ""
                        val size = if (sizeCol >= 0) it.getLong(sizeCol) else 0L

                        val contentUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id).toString()
                        val playUri = if (path.isNotBlank()) path else contentUri

                        val map = Arguments.createMap()
                        map.putString("id", id.toString())
                        map.putString("title", title)
                        map.putString("artist", artist)
                        map.putDouble("durationMs", durationMs.toDouble())
                        map.putString("duration", formatDuration(durationMs))
                        map.putString("path", path)
                        map.putString("uri", playUri)
                        map.putString("contentUri", contentUri)
                        map.putDouble("size", size.toDouble())

                        audioList.pushMap(map)
                    }
                }

                promise.resolve(audioList)
            } catch (e: Exception) {
                promise.reject("ERR_AUDIO_QUERY", e.message, e)
            }
        }.start()
    }

    private fun formatDuration(durationMs: Long): String {
        if (durationMs <= 0) return "Local"
        val totalSecs = durationMs / 1000
        val mins = totalSecs / 60
        val secs = totalSecs % 60
        return String.format("%02d:%02d", mins, secs)
    }
}
