package yaro.vc.app

import android.media.AudioFormat
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.net.Uri
import com.facebook.react.bridge.*
import java.io.File
import java.io.RandomAccessFile
import java.nio.ByteOrder
import java.security.MessageDigest
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicLong
import kotlin.math.*

/** Decode music off the UI thread; apply EQ/gain before Agora publishes it. */
class MusicAudioProcessor(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val worker = Executors.newSingleThreadExecutor()
    private val generation = AtomicLong(0)
    override fun getName() = "MusicAudioProcessor"

    @ReactMethod fun cancel() { generation.incrementAndGet() }

    @ReactMethod fun prepare(uri: String, bassDb: Double, promise: Promise) {
        val request = generation.incrementAndGet()
        worker.execute {
            var temporary: File? = null
            var downloaded: File? = null
            val extractor = MediaExtractor()
            var decoder: MediaCodec? = null
            try {
                val directory = File(context.cacheDir, "room-music-dsp").apply { mkdirs() }
                val fingerprint = if (uri.startsWith("/")) File(uri).let { "${it.length()}:${it.lastModified()}" } else ""
                val key = MessageDigest.getInstance("SHA-256").digest("v2:$uri:$fingerprint:$bassDb".toByteArray()).joinToString("") { "%02x".format(it) }
                val output = File(directory, "$key.wav")
                if (output.exists() && output.length() > 44) {
                    output.setLastModified(System.currentTimeMillis())
                    if (request != generation.get()) throw InterruptedException()
                    promise.resolve(output.absolutePath)
                    return@execute
                }
                // Bound the cache; never delete the most recently used playback file.
                var size = directory.listFiles()?.sumOf { it.length() } ?: 0L
                directory.listFiles()?.filter { it.extension == "wav" }?.sortedBy { it.lastModified() }?.dropLast(1)?.forEach {
                    if (size > 256L * 1024 * 1024) { size -= it.length(); it.delete() }
                }
                val started = System.nanoTime()
                fun checkActive() {
                    if (request != generation.get()) throw InterruptedException()
                    check((System.nanoTime() - started) / 1_000_000 < 30000) { "Music processing timed out" }
                }
                checkActive()
                if (uri.startsWith("http")) {
                    val connection = URL(uri).openConnection() as HttpURLConnection
                    connection.connectTimeout = 10000
                    connection.readTimeout = 10000
                    try {
                        check(connection.responseCode in 200..299) { "Unable to download music (${connection.responseCode})" }
                        val source = File(directory, "$key.$request.download")
                        downloaded = source
                        connection.inputStream.use { input -> source.outputStream().use { destination ->
                            val bytes = ByteArray(32768)
                            while (true) {
                                checkActive()
                                val length = input.read(bytes)
                                if (length < 0) break
                                destination.write(bytes, 0, length)
                                check(source.length() < 64L * 1024 * 1024) { "Music download is too large" }
                            }
                        } }
                        extractor.setDataSource(source.absolutePath)
                    } finally { connection.disconnect() }
                } else extractor.setDataSource(context, Uri.parse(if (uri.startsWith("/")) "file://$uri" else uri), null)
                checkActive()
                val track = (0 until extractor.trackCount).firstOrNull { extractor.getTrackFormat(it).getString(MediaFormat.KEY_MIME)?.startsWith("audio/") == true }
                    ?: error("No audio track in file")
                extractor.selectTrack(track)
                val inputFormat = extractor.getTrackFormat(track)
                inputFormat.setInteger(MediaFormat.KEY_PCM_ENCODING, AudioFormat.ENCODING_PCM_16BIT)
                val codec = MediaCodec.createDecoderByType(inputFormat.getString(MediaFormat.KEY_MIME)!!)
                decoder = codec
                codec.configure(inputFormat, null, null, 0)
                codec.start()
                var rate = inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
                var channels = inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
                var floatPcm = false
                var filter = MusicBassFilter(rate, channels, bassDb.coerceIn(-15.0, 15.0))
                val workingFile = File(directory, "$key.$request.tmp")
                temporary = workingFile
                RandomAccessFile(workingFile, "rw").use { file ->
                    file.setLength(0)
                    file.write(ByteArray(44))
                    val info = MediaCodec.BufferInfo()
                    var inputEnded = false
                    var outputEnded = false
                    while (!outputEnded) {
                        checkActive()
                        if (!inputEnded) {
                            val index = codec.dequeueInputBuffer(10000)
                            if (index >= 0) {
                                val buffer = codec.getInputBuffer(index)!!
                                val count = extractor.readSampleData(buffer, 0)
                                if (count < 0) {
                                    codec.queueInputBuffer(index, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                                    inputEnded = true
                                } else {
                                    codec.queueInputBuffer(index, 0, count, extractor.sampleTime, 0)
                                    extractor.advance()
                                }
                            }
                        }
                        val index = codec.dequeueOutputBuffer(info, 10000)
                        if (index == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                            val format = codec.outputFormat
                            rate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
                            channels = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
                            floatPcm = format.containsKey(MediaFormat.KEY_PCM_ENCODING) && format.getInteger(MediaFormat.KEY_PCM_ENCODING) == AudioFormat.ENCODING_PCM_FLOAT
                            filter = MusicBassFilter(rate, channels, bassDb.coerceIn(-15.0, 15.0))
                        } else if (index >= 0) {
                            val buffer = codec.getOutputBuffer(index)!!.order(ByteOrder.LITTLE_ENDIAN)
                            buffer.position(info.offset)
                            buffer.limit(info.offset + info.size)
                            val samples = info.size / if (floatPcm) 4 else 2
                            val bytes = ByteArray(samples * 2)
                            for (sample in 0 until samples) {
                                val value = if (floatPcm) buffer.float.toDouble() else buffer.short / 32768.0
                                val pcm = encodeMusicSample(filter.process(value, sample % channels), bassDb)
                                bytes[sample * 2] = pcm.toByte()
                                bytes[sample * 2 + 1] = (pcm shr 8).toByte()
                            }
                            file.write(bytes)
                            check(file.length() < 256L * 1024 * 1024) { "Music file is too large to enhance" }
                            outputEnded = info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
                            codec.releaseOutputBuffer(index, false)
                        }
                    }
                    val dataSize = file.length() - 44
                    check(dataSize > 0) { "Audio decoder returned no samples" }
                    file.seek(0)
                    fun word(value: Int) { file.write(value and 255); file.write((value shr 8) and 255) }
                    fun integer(value: Int) { word(value); word(value shr 16) }
                    file.writeBytes("RIFF"); integer((dataSize + 36).toInt()); file.writeBytes("WAVEfmt ")
                    integer(16); word(1); word(channels); integer(rate); integer(rate * channels * 2)
                    word(channels * 2); word(16); file.writeBytes("data"); integer(dataSize.toInt())
                }
                checkActive()
                check(workingFile.renameTo(output)) { "Unable to save processed music" }
                promise.resolve(output.absolutePath)
            } catch (error: Exception) {
                temporary?.delete()
                promise.reject(if (error is InterruptedException) "CANCELED" else "AUDIO_PROCESSING", error.message, error)
            } finally {
                try { decoder?.stop() } catch (_: Exception) {}
                decoder?.release()
                extractor.release()
                downloaded?.delete()
            }
        }
    }

    override fun invalidate() { generation.incrementAndGet(); worker.shutdownNow(); super.invalidate() }
}

internal fun encodeMusicSample(sample: Double, bassDb: Double = 0.0): Int {
    // Preserve full music volume while applying mild headroom for bass boost
    val headroom = (0.95 / (1.0 + 0.25 * (bassDb.coerceIn(0.0, 15.0) / 6.0))).coerceIn(0.70, 0.95)
    return (sample * headroom * 32767).roundToInt().coerceIn(-32768, 32767)
}

/** RBJ low-shelf biquad, separate history for every stereo channel. */
internal class MusicBassFilter(rate: Int, channels: Int, db: Double) {
    private val z1 = DoubleArray(channels)
    private val z2 = DoubleArray(channels)
    private val b0: Double; private val b1: Double; private val b2: Double
    private val a1: Double; private val a2: Double
    init {
        val a = 10.0.pow(db / 40)
        val w = 2 * PI * 180 / rate
        val c = cos(w)
        val alpha = sin(w) / 2 * sqrt(2.0)
        val beta = 2 * sqrt(a) * alpha
        val norm = (a + 1) + (a - 1) * c + beta
        b0 = a * ((a + 1) - (a - 1) * c + beta) / norm
        b1 = 2 * a * ((a - 1) - (a + 1) * c) / norm
        b2 = a * ((a + 1) - (a - 1) * c - beta) / norm
        a1 = -2 * ((a - 1) + (a + 1) * c) / norm
        a2 = ((a + 1) + (a - 1) * c - beta) / norm
    }
    fun process(sample: Double, channel: Int): Double {
        val result = b0 * sample + z1[channel]
        z1[channel] = b1 * sample - a1 * result + z2[channel]
        z2[channel] = b2 * sample - a2 * result
        return result
    }
}
