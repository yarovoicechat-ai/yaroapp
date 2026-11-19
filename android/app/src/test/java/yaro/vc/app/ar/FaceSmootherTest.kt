package yaro.vc.app.ar
import org.junit.Assert.*
import org.junit.Test
import yaro.vc.app.ar.tracking.FaceSmoother
import yaro.vc.app.ar.tracking.FaceLandmarkData
class FaceSmootherTest {
 private fun face(value:Float,time:Long)=FaceLandmarkData(face=FloatArray(4){value},eyes=FloatArray(4){value},mouth=FloatArray(4){value},cheeks=FloatArray(4){value},landmarks=listOf(FloatArray(3){value}),timestampMs=time)
 @Test fun smoothsGeometryWhilePreservingTrackingMetadata(){
  val smoother=FaceSmoother(.35f);smoother.apply(face(0f,100));val next=face(1f,180).copy(matrix=floatArrayOf(1f,0f),blendshapes=mapOf("jawOpen" to .8f));val result=smoother.apply(next)
  assertArrayEquals(FloatArray(4){.35f},result.face,.001f);assertArrayEquals(FloatArray(3){.35f},result.landmarks[0],.001f);assertEquals(.8f,result.blendshapes["jawOpen"]!!,.001f);assertArrayEquals(next.matrix,result.matrix,.001f)
 }
 @Test fun staleFacesDoNotDragNewFaceGeometry(){val smoother=FaceSmoother();smoother.apply(face(0f,100));assertArrayEquals(FloatArray(4){1f},smoother.apply(face(1f,400)).face,.001f)}
 @Test fun resetRemovesPreviouslyDetectedFace(){val smoother=FaceSmoother();smoother.apply(face(0f,100));smoother.reset();assertArrayEquals(FloatArray(4){1f},smoother.apply(face(1f,120)).face,.001f)}
}
