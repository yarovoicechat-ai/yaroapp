package yaro.vc.app.ar.tracking
 data class FaceLandmarkData(val face:FloatArray=FloatArray(4),val eyes:FloatArray=FloatArray(4),val mouth:FloatArray=FloatArray(4),val cheeks:FloatArray=FloatArray(4),val landmarks:List<FloatArray> = emptyList(),val matrix:FloatArray=FloatArray(0),val blendshapes:Map<String,Float> = emptyMap(),val timestampMs:Long=0)
