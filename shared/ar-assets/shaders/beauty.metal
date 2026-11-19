#include <metal_stdlib>
using namespace metal;
struct ARUniforms { float4 face; float4 eyes; float4 mouth; float4 cheeks; float4 adjust; float intensity; float beauty; float sharpness; uint mode; };
float ellipse(float2 uv,float2 center,float2 radius) { return 1.0-smoothstep(.65,1.0,length((uv-center)/max(radius,float2(.001)))); }
kernel void yaroBeauty(texture2d<float,access::sample> input [[texture(0)]],texture2d<float,access::write> output [[texture(1)]],constant ARUniforms& p [[buffer(0)]],uint2 gid [[thread_position_in_grid]]) {
  if(gid.x>=output.get_width() || gid.y>=output.get_height()) return;
  constexpr sampler linearSampler(coord::normalized,address::clamp_to_edge,filter::linear);
  float2 size=float2(output.get_width(),output.get_height()), uv=(float2(gid)+.5)/size, texel=1.0/size;
  float3 original=input.sample(linearSampler,uv).rgb,color=original;
  float3 avg=(input.sample(linearSampler,uv+float2(texel.x*2,0)).rgb+input.sample(linearSampler,uv-float2(texel.x*2,0)).rgb+input.sample(linearSampler,uv+float2(0,texel.y*2)).rgb+input.sample(linearSampler,uv-float2(0,texel.y*2)).rgb)*.25;
  if(p.mode>0 && p.face.z>0) {
    float skin=ellipse(uv,p.face.xy,p.face.zw)*(1-ellipse(uv,p.eyes.xy,p.face.zw*float2(.28,.15)))*(1-ellipse(uv,p.eyes.zw,p.face.zw*float2(.28,.15)));
    float lip=ellipse(uv,p.mouth.xy,p.mouth.zw); skin*=1-lip;
    float lipColor=lip*(1-smoothstep(.55,.80,min(original.r,min(original.g,original.b))))*smoothstep(.02,.12,dot(original,float3(.2126,.7152,.0722)));
    color=mix(color,avg,skin*clamp(1-length(original-avg)*12,0.0,1.0)*p.beauty*.6);
    if(p.mode==1) color+=float3(.035,.025,.020)*skin;
    if(p.mode==2) color=mix(color,color*float3(1.12,1,1.06),skin*.7);
    float cheeks=max(ellipse(uv,p.cheeks.xy,p.face.zw*float2(.30,.19)),ellipse(uv,p.cheeks.zw,p.face.zw*float2(.30,.19)));
    if(p.mode==3) color=mix(color,float3(.98,.35,.46),cheeks*.38);
    if(p.mode==4) { color=mix(color,color*float3(1.15,.62,.80),lipColor*.60); color=mix(color,float3(.96,.46,.57),cheeks*.22); }
    if(p.mode==5) color+=float3(.09,.055,-.01)*skin;
    if (p.mode==6) color=mix(original,color,0.35)+float3(.012,.009,.006)*skin;
    if (p.mode==7) color=mix(original,avg,skin*clamp(1-length(original-avg)*12,0.0,1.0)*.82);
    if (p.mode==8) {
      color=original;
      float eyes=max(ellipse(uv,p.eyes.xy,p.face.zw*float2(.23,.11)),ellipse(uv,p.eyes.zw,p.face.zw*float2(.23,.11)));
      float white= smoothstep(.30,.75,min(original.r,min(original.g,original.b)));
      color+=float3(.12,.12,.10)*eyes*white;
    }
    if (p.mode==9) color=mix(original,original*float3(1.30,.55,.75),lipColor*.70);
  }
  if(p.mode>0) {
    color=(color-.5)*p.adjust.y+.5+p.adjust.x*.2;
    color=mix(float3(dot(color,float3(.2126,.7152,.0722))),color,p.adjust.z);
    color+=float3(p.adjust.w*.08,0,-p.adjust.w*.08)+(original-avg)*p.sharpness;
  }
  output.write(float4(mix(original,clamp(color,0.0,1.0),clamp(p.intensity,0.0,1.0)),1),gid);
}
