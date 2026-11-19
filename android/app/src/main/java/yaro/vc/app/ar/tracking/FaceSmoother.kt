package yaro.vc.app.ar.tracking
 class FaceSmoother(private val alpha:Float=.35f){private var previous:FaceLandmarkData?=null
 fun reset(){previous=null}
 fun apply(next:FaceLandmarkData):FaceLandmarkData{
  val old=previous
  fun smooth(a:FloatArray,b:FloatArray):FloatArray=if(a.size!=b.size)b else FloatArray(b.size){a[it]+alpha*(b[it]-a[it])}
  val result=if(old==null || next.timestampMs-old.timestampMs>250)next else next.copy(face=smooth(old.face,next.face),eyes=smooth(old.eyes,next.eyes),mouth=smooth(old.mouth,next.mouth),cheeks=smooth(old.cheeks,next.cheeks),landmarks=next.landmarks.mapIndexed{index,point->old.landmarks.getOrNull(index)?.let{smooth(it,point)} ?: point})
  previous=result;return result
 }
}
