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
                    MediaStore.Audio.Media.SIZE,
                    MediaStore.Audio.Media.IS_MUSIC
                )

                // Query: only audio marked as music, with size >= 50KB and duration >= 10s (or duration 0/null during index)
                val selection = "(${MediaStore.Audio.Media.IS_MUSIC} != 0) AND (${MediaStore.Audio.Media.SIZE} IS NULL OR ${MediaStore.Audio.Media.SIZE} >= 50000) AND (${MediaStore.Audio.Media.DURATION} IS NULL OR ${MediaStore.Audio.Media.DURATION} >= 10000 OR ${MediaStore.Audio.Media.DURATION} == 0)"
                // Sort by recently added first - never append LIMIT in sortOrder string on modern Android
                val sortOrder = "${MediaStore.Audio.Media.DATE_ADDED} DESC"

                val cursor = reactContext.contentResolver.query(uri, projection, selection, null, sortOrder)

                var count = 0
                val maxSongs = 500

                cursor?.use {
                    val idCol = it.getColumnIndex(MediaStore.Audio.Media._ID)
                    val titleCol = it.getColumnIndex(MediaStore.Audio.Media.TITLE)
                    val artistCol = it.getColumnIndex(MediaStore.Audio.Media.ARTIST)
                    val durationCol = it.getColumnIndex(MediaStore.Audio.Media.DURATION)
                    val dataCol = it.getColumnIndex(MediaStore.Audio.Media.DATA)
                    val displayNameCol = it.getColumnIndex(MediaStore.Audio.Media.DISPLAY_NAME)
                    val sizeCol = it.getColumnIndex(MediaStore.Audio.Media.SIZE)
                    val isMusicCol = it.getColumnIndex(MediaStore.Audio.Media.IS_MUSIC)
                    val isRecordingCol = try {
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                            it.getColumnIndex(MediaStore.Audio.Media.IS_RECORDING)
                        } else -1
                    } catch (_: Exception) { -1 }

                    while (it.moveToNext() && count < maxSongs) {
                        // Check is_music flag
                        if (isMusicCol >= 0 && it.getInt(isMusicCol) == 0) {
                            continue
                        }

                        // Check Android 12+ is_recording flag
                        if (isRecordingCol >= 0 && it.getInt(isRecordingCol) != 0) {
                            continue
                        }

                        val durationMs = if (durationCol >= 0) it.getLong(durationCol) else 0L
                        // Skip if duration is too short (< 10 seconds)
                        if (durationMs in 1..9999) {
                            continue
                        }

                        val size = if (sizeCol >= 0) it.getLong(sizeCol) else 0L
                        if (size in 1..49999) {
                            continue
                        }

                        val path = if (dataCol >= 0) {
                            try { it.getString(dataCol) ?: "" } catch (_: Exception) { "" }
                        } else ""

                        val displayName = if (displayNameCol >= 0) it.getString(displayNameCol) ?: "Audio Track" else "Audio Track"
                        var title = if (titleCol >= 0) it.getString(titleCol) else null
                        if (title.isNullOrBlank() || title == "<unknown>") {
                            title = displayName.replace(Regex("\\.[a-zA-Z0-9]+$"), "")
                        }

                        // Filter out recordings, voice notes, call recordings, ringtones
                        if (isRecordingOrNonMusic(path, title, displayName)) {
                            continue
                        }

                        var artist = if (artistCol >= 0) it.getString(artistCol) else null
                        if (artist.isNullOrBlank() || artist == "<unknown>") {
                            artist = "Phone Storage"
                        }

                        val id = if (idCol >= 0) it.getLong(idCol) else 0L
                        val contentUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id).toString()
                        val playUri = if (contentUri.isNotBlank()) contentUri else path

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
                        count++
                    }
                }

                promise.resolve(audioList)
            } catch (e: Exception) {
                promise.reject("ERR_AUDIO_QUERY", e.message, e)
            }
        }.start()
    }

    private fun isRecordingOrNonMusic(path: String, title: String, displayName: String): Boolean {
        val lowerPath = path.lowercase(java.util.Locale.ROOT)
        val lowerTitle = title.lowercase(java.util.Locale.ROOT)
        val lowerName = displayName.lowercase(java.util.Locale.ROOT)

        // 1. Blacklisted path directories (folders containing recordings, voice notes, call records, etc.)
        val excludedPathKeywords = arrayOf(
            "/recording",
            "/recordings",
            "/record/",
            "/records/",
            "/sound_recorder",
            "/soundrecorder",
            "/voice recorder",
            "/voicerecorder",
            "/voice_recorder",
            "/callrecordings",
            "/call recordings",
            "/call_recordings",
            "/call_rec",
            "/callrec",
            "/call/",
            "/calls/",
            "/standard recordings",
            "/whatsapp",
            "/telegram",
            "/voicenotes",
            "/voice notes",
            "/voice_notes",
            "/ringtones",
            "/ringtone",
            "/notifications",
            "/notification",
            "/alarms",
            "/alarm",
            "/audiomemo",
            "/voice memo",
            "/voicememo",
            "/.trash",
            "/cache"
        )

        for (kw in excludedPathKeywords) {
            if (lowerPath.contains(kw)) {
                return true
            }
        }

        // 2. Blacklisted extensions (voice notes/recorder specific formats)
        val excludedExtensions = arrayOf(".amr", ".3gp", ".awb", ".opus")
        for (ext in excludedExtensions) {
            if (lowerPath.endsWith(ext) || lowerName.endsWith(ext)) {
                return true
            }
        }

        // 3. Blacklisted title or filename phrases
        val combined = "$lowerTitle $lowerName"
        val recordingPhrases = arrayOf(
            "standard recording",
            "voice recording",
            "audio recording",
            "call recording",
            "call record",
            "sound recording",
            "sound record",
            "voice note",
            "voicenote",
            "voice memo",
            "voicememo",
            "audiomemo",
            "call_rec"
        )
        for (phrase in recordingPhrases) {
            if (combined.contains(phrase)) {
                return true
            }
        }

        // 4. Prefixes typical of audio recorders
        val nameWithoutExt = lowerName.substringBeforeLast(".")
        val prefixes = arrayOf(
            "rec_", "rec-", "rec ", "recording",
            "call_", "call-", "call ",
            "voice_", "voice-", "voice ",
            "aud-", "ptt-", "snd_", "snd-",
            "phone-ringtone", "facebook_ringtone"
        )

        for (pre in prefixes) {
            if (nameWithoutExt.startsWith(pre) || lowerTitle.startsWith(pre)) {
                return true
            }
        }

        return false
    }

    private fun formatDuration(durationMs: Long): String {
        if (durationMs <= 0) return "Local"
        val totalSecs = durationMs / 1000
        val mins = totalSecs / 60
        val secs = totalSecs % 60
        return String.format("%02d:%02d", mins, secs)
    }
}
