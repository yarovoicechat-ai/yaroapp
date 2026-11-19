#include <metal_stdlib>
using namespace metal;
struct ModelVertex { packed_float3 position; packed_float3 normal; };
struct ModelUniforms { float4 face; float4 pose0; float4 pose1; float4 pose2; float4 centerAnimation; float4 timeIntensitySeedRoll; float4 color; };
struct ModelOut { float4 position [[position]]; float3 normal; float glow; float alpha; };
float wrap4(float value) { return value-floor(value*.25)*4; }
vertex ModelOut yaroModelVertex(const device ModelVertex* vertices [[buffer(0)]],constant ModelUniforms& u [[buffer(1)]],uint id [[vertex_id]]) {
 float3 p=vertices[id].position;float a=u.centerAnimation.w,t=u.timeIntensitySeedRoll.x,seed=u.timeIntensitySeedRoll.z,phase=t*2.8+seed,glow=1,alpha=1;
 if(a==1)p.y=wrap4(p.y-t*.65+seed+3)-2;
 if(a==2)p.y=wrap4(p.y+t*.43+seed+3)-2;
 if(a==3){p.z+=sin(phase)*abs(p.x-u.centerAnimation.x)*.65;p.x+=sin(t+seed)*.045;}
 if(a==4 || a==10)glow=.65+.35*sin(phase);
 if(a==5){p.x+=sin(p.y*9+phase)*.035;p.y+=sin(phase)*.045;}
 if(a==6)p.y+=sin(t*1.7)*.07;
 if(a==7){float3 d=p-u.centerAnimation.xyz;float r=t*.7;p=u.centerAnimation.xyz+float3(d.x*cos(r)+d.z*sin(r),d.y,-d.x*sin(r)+d.z*cos(r));}
 if(a==8){float r=sin(t*.8)*.25;float2 q=p.xy;p.xy=float2(q.x*cos(r)-q.y*sin(r),q.x*sin(r)+q.y*cos(r));}
 if(a==9)p.y-=fmod(t*.4+seed,.24);
 if(a==11){p.y-=u.pose0.w*.25;alpha=smoothstep(.08,.25,u.pose0.w);}
 if(a==12){p.y=u.centerAnimation.y+(p.y-u.centerAnimation.y)*max(.03,1-u.pose1.w);alpha=1-smoothstep(.7,.95,u.pose1.w);}
 float3x3 pose=float3x3(u.pose0.xyz,u.pose1.xyz,u.pose2.xyz);p=pose*p;
 float roll=u.timeIntensitySeedRoll.w;float2 q=float2(p.x*cos(roll)-p.y*sin(roll),p.x*sin(roll)+p.y*cos(roll));
 float2 uv=u.face.xy+float2(q.x*u.face.z,-q.y*u.face.w);
 ModelOut out;out.position=float4(uv.x*2-1,1-uv.y*2,clamp(.5-p.z*.12,.01,.99),1);out.normal=pose*float3(vertices[id].normal);out.glow=glow;out.alpha=alpha;return out;
}
fragment float4 yaroModelFragment(ModelOut in [[stage_in]],constant ModelUniforms& u [[buffer(0)]]) {
 float light=.62+.38*abs(dot(normalize(in.normal),normalize(float3(-.4,.6,1))));
 if(in.alpha<.01)discard_fragment();return float4(u.color.rgb*light*in.glow,u.color.a*u.timeIntensitySeedRoll.y*in.alpha);
}
