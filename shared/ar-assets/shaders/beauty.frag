#extension GL_OES_EGL_image_external : require
precision highp float;
uniform samplerExternalOES uCamera;
uniform mat4 uTransform;
uniform int uRotation;
uniform int uMode;
uniform float uIntensity;
uniform float uBeauty;
uniform vec2 uTexel;
uniform vec2 uCrop;
uniform vec4 uFace;
uniform vec4 uEyes;
uniform vec4 uMouth;
uniform vec4 uCheeks;
uniform vec4 uAdjust;
uniform float uSharpness;
varying vec2 vUv;
vec2 source(vec2 uv) {
  uv=(uv-.5)*uCrop+.5;
  if (uRotation == 90) uv=vec2(uv.y,1.0-uv.x);
  else if (uRotation == 180) uv=1.0-uv;
  else if (uRotation == 270) uv=vec2(1.0-uv.y,uv.x);
  uv.y=1.0-uv.y;
  return (uTransform*vec4(uv,0.0,1.0)).xy;
}
// Logical UV follows the top-first CPU/MediaPipe row order. Flip only the
// camera sampling coordinates, never the face/eye/mouth mask coordinates.
vec3 read(vec2 uv) { return texture2D(uCamera,source(uv)).rgb; }
float ellipse(vec2 p,vec2 c,vec2 r) { return 1.0-smoothstep(0.65,1.0,length((p-c)/max(r,vec2(0.001)))); }
void main() {
  // Row zero of glReadPixels becomes row zero of the published RGBA buffer.
  vec2 uv=vUv;
  vec3 original=read(uv), color=original;
  if (uMode > 0 && uFace.z>0.0) {
    float skin=ellipse(uv,uFace.xy,uFace.zw);
    skin*=1.0-ellipse(uv,uEyes.xy,uFace.zw*vec2(.28,.15));
    skin*=1.0-ellipse(uv,uEyes.zw,uFace.zw*vec2(.28,.15));
    float lip=ellipse(uv,uMouth.xy,uMouth.zw);
    float lipColor=lip*(1.0-smoothstep(.55,.80,min(original.r,min(original.g,original.b))))*smoothstep(.02,.12,dot(original,vec3(.2126,.7152,.0722)));
    skin*=1.0-lip;
    vec3 blur=(read(uv+vec2(uTexel.x*2.0,0.0))+read(uv-vec2(uTexel.x*2.0,0.0))+read(uv+vec2(0.0,uTexel.y*2.0))+read(uv-vec2(0.0,uTexel.y*2.0)))*.25;
    float edge=clamp(1.0-length(original-blur)*12.0,0.0,1.0);
    color=mix(original,blur,skin*edge*uBeauty*.6);
    if (uMode==1) color+=vec3(.035,.025,.020)*skin;
    if (uMode==2) color=mix(color,color*vec3(1.12,1.0,1.06),skin*.7);
    float cheeks=max(ellipse(uv,uCheeks.xy,uFace.zw*vec2(.30,.19)),ellipse(uv,uCheeks.zw,uFace.zw*vec2(.30,.19)));
    if (uMode==3) color=mix(color,vec3(.98,.35,.46),cheeks*.38);
    if (uMode==4) { color=mix(color,color*vec3(1.15,.62,.80),lipColor*.60); color=mix(color,vec3(.96,.46,.57),cheeks*.22); }
    if (uMode==5) color+=vec3(.09,.055,-.01)*skin;
    if (uMode==6) color=mix(original,color,0.35)+vec3(.012,.009,.006)*skin;
    if (uMode==7) color=mix(original,blur,skin*edge*.82);
    if (uMode==8) {
      color=original;
      float eyes=max(ellipse(uv,uEyes.xy,uFace.zw*vec2(.23,.11)),ellipse(uv,uEyes.zw,uFace.zw*vec2(.23,.11)));
      float white= smoothstep(.30,.75,min(original.r,min(original.g,original.b)));
      color+=vec3(.12,.12,.10)*eyes*white;
    }
    if (uMode==9) color=mix(original,original*vec3(1.30,.55,.75),lipColor*.70);
  }
  if (uMode > 0) {
    color=(color-.5)*uAdjust.y+.5+uAdjust.x*.2;
    float luma=dot(color,vec3(.2126,.7152,.0722)); color=mix(vec3(luma),color,uAdjust.z);
    color+=vec3(uAdjust.w*.08,0.0,-uAdjust.w*.08);
    vec3 avg=(read(uv+vec2(uTexel.x,0.0))+read(uv-vec2(uTexel.x,0.0))+read(uv+vec2(0.0,uTexel.y))+read(uv-vec2(0.0,uTexel.y)))*.25;
    color+=(original-avg)*uSharpness;
  }
  gl_FragColor=vec4(mix(original,clamp(color,0.0,1.0),clamp(uIntensity,0.0,1.0)),1.0);
}
