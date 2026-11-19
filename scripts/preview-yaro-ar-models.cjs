// Deterministic orthographic asset inspection; native/device tests remain authoritative.
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const root=path.resolve(__dirname,'../shared/ar-assets/models'),models=require(path.join(root,'original-models.json')).effects;
const W=1440,H=1000,cellW=160,cellH=200,pixels=Buffer.alloc(W*H*4),depth=new Float32Array(W*H).fill(-1e10);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;pixels[i]=20;pixels[i+1]=15;pixels[i+2]=31;pixels[i+3]=255;}
function pixel(x,y,c,z){x=Math.floor(x);y=Math.floor(y);if(x<0||x>=W||y<0||y>=H)return;const k=y*W+x;if(z<depth[k])return;const i=k*4,a=c[3];for(let j=0;j<3;j++)pixels[i+j]=Math.round(pixels[i+j]*(1-a)+c[j]*255*a);if(a===1)depth[k]=z;}
function triangle(v,c){const minX=Math.max(0,Math.floor(Math.min(...v.map(p=>p[0])))),maxX=Math.min(W-1,Math.ceil(Math.max(...v.map(p=>p[0])))),minY=Math.max(0,Math.floor(Math.min(...v.map(p=>p[1])))),maxY=Math.min(H-1,Math.ceil(Math.max(...v.map(p=>p[1]))));const [a,b,d]=v,den=(b[1]-d[1])*(a[0]-d[0])+(d[0]-b[0])*(a[1]-d[1]);if(Math.abs(den)<.001)return;for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const u=((b[1]-d[1])*(x-d[0])+(d[0]-b[0])*(y-d[1]))/den,w=((d[1]-a[1])*(x-d[0])+(a[0]-d[0])*(y-d[1]))/den,t=1-u-w;if(u>=0&&w>=0&&t>=0)pixel(x,y,c,u*a[2]+w*b[2]+t*d[2]);}}
models.forEach((model,index)=>{const cx=index%9*cellW+80,cy=Math.floor(index/9)*cellH+100;
 for(let y=-45;y<46;y++)for(let x=-35;x<36;x++)if(x*x/1225+y*y/2025<1)pixel(cx+x,cy+y,[.58,.46,.43,1],-10);
 for(const side of [-1,1])for(let y=-2;y<3;y++)for(let x=-5;x<6;x++)pixel(cx+side*15+x,cy-10+y,[.12,.08,.12,1],-9);
 const file=fs.readFileSync(path.join(root,model.id+'.glb')),len=file.readUInt32LE(12),doc=JSON.parse(file.subarray(20,20+len)),bin=28+len;
 function accessor(i){const a=doc.accessors[i],v=doc.bufferViews[a.bufferView],start=bin+(v.byteOffset||0)+(a.byteOffset||0);return Array.from({length:a.count*3},(_,k)=>file.readFloatLE(start+k*4));}
 const triangles=[];
 for(const mesh of doc.meshes)for(const primitive of mesh.primitives){const p=accessor(primitive.attributes.POSITION),n=accessor(primitive.attributes.NORMAL),color=doc.materials[primitive.material].pbrMetallicRoughness.baseColorFactor;for(let k=0;k<p.length;k+=9){const light=.62+.38*Math.abs((n[k]*-.4+n[k+1]*.6+n[k+2])/Math.sqrt(1.52));triangles.push({v:[0,3,6].map(j=>[cx+p[k+j]*35,cy-p[k+j+1]*45,p[k+j+2]]),c:[...color.slice(0,3).map(v=>v*light),color[3]]});}}
 triangles.sort((a,b)=>(a.c[3]<1)-(b.c[3]<1));for(const t of triangles)triangle(t.v,t.c);
 // Numbered swatches are mapped to full names in the adjacent JSON inventory.
 for(let k=0;k<index+1;k++)pixel(cx-22+k%45,cy+90-Math.floor(k/45)*3,[.9,.7,.3,1],100);
});
const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}
function crc(data){let c=0xffffffff;for(const b of data)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const b=Buffer.alloc(12+data.length);b.writeUInt32BE(data.length);b.write(type,4);data.copy(b,8);b.writeUInt32BE(crc(b.subarray(4,8+data.length)),8+data.length);return b;}
const header=Buffer.alloc(13);header.writeUInt32BE(W);header.writeUInt32BE(H,4);header[8]=8;header[9]=6;const rows=Buffer.alloc((W*4+1)*H);for(let y=0;y<H;y++)pixels.copy(rows,y*(W*4+1)+1,y*W*4,(y+1)*W*4);
const out=path.resolve(__dirname,'../scratch/yaro-original-models.png');fs.writeFileSync(out,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]));console.log(out);
