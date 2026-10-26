package yaro.vc.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.*

class MusicBassFilterTest {
    @Test fun pcmPreservesLoudSamplesWithoutFivefoldSaturation() {
        assertEquals((0.8 * 0.95 * 32767).roundToInt(), encodeMusicSample(0.8))
        assertEquals(0, encodeMusicSample(0.0))
        for (value in listOf(-1.0, -0.2, 0.2, 1.0)) {
            assertEquals(-encodeMusicSample(value), encodeMusicSample(-value))
        }
    }

    @Test fun boostedBassKeepsHeadroomForLoudMusic() {
        val filter = MusicBassFilter(48000, 1, 15.0)
        var peak = 0
        for (i in 0 until 48000) {
            val sample = 0.9 * sin(2 * PI * 50 * i / 48000)
            peak = max(peak, abs(encodeMusicSample(filter.process(sample, 0), 15.0)))
        }
        assertTrue("Loud bass must not flatten at the PCM limit: $peak", peak in 20000..31000)
    }
    private fun amplitude(db: Double, frequency: Double): Double {
        val filter = MusicBassFilter(48000, 2, db)
        var energy = 0.0
        for (i in 0 until 48000) {
            val sample = 0.05 * sin(2 * PI * frequency * i / 48000)
            val output = filter.process(sample, 0)
            // Right channel must not receive left-channel filter history.
            assertEquals(0.0, filter.process(0.0, 1), 1e-12)
            if (i >= 24000) energy += output * output
        }
        return sqrt(energy / 24000)
    }

    @Test fun bassBoostTargetsLowFrequencies() {
        val lowRatio = amplitude(15.0, 50.0) / amplitude(0.0, 50.0)
        val highRatio = amplitude(15.0, 4000.0) / amplitude(0.0, 4000.0)
        assertTrue("Low bass should gain about 15 dB: $lowRatio", lowRatio in 5.3..5.8)
        assertTrue("High frequencies should remain neutral: $highRatio", highRatio in 0.99..1.02)
    }

    @Test fun neutralSettingPreservesSamples() {
        assertEquals(0.05 / sqrt(2.0), amplitude(0.0, 1000.0), 1e-9)
    }

    @Test fun negativeBassCutsLowFrequencies() {
        assertTrue(amplitude(-15.0, 50.0) / amplitude(0.0, 50.0) in 0.17..0.20)
    }
}
