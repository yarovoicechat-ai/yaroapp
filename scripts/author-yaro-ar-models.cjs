/* Original Yaro geometric art. No downloaded models, thumbnails or remote code.
 * GLB 2.0 subset: non-indexed triangles, POSITION/NORMAL, solid PBR materials.
 * Coordinates: face center origin, face radius=1, +Y up, +Z toward camera.
 */
const fs=require('fs'),path=require('path');
const base=path.resolve(__dirname,'../shared/ar-assets/models');fs.mkdirSync(base,{recursive:true});
const C={gold:[1,.66,.14,1],pink:[1,.27,.55,1],cyan:[.10,.86,1,1],purple:[.57,.23,1,1],white:[.95,.96,1,1],black:[.055,.04,.09,1],red:[.95,.09,.13,1],green:[.11,.85,.49,1],brown:[.47,.23,.12,1],cream:[1,.84,.65,1],blue:[.17,.39,1,1]};
let parts=[];
function part(name,color,triangles,animation='none') { parts.push({name,color,triangles,animation}); }
function ell(name,c,r,color,animation='none',segments=16,rings=8){let out=[];const p=(a,b)=>[c[0]+r[0]*Math.sin(b)*Math.cos(a),c[1]+r[1]*Math.cos(b),c[2]+r[2]*Math.sin(b)*Math.sin(a)];for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){let a=i*2*Math.PI/segments,b=j*Math.PI/rings,d=2*Math.PI/segments,e=Math.PI/rings;out.push(p(a,b),p(a+d,b),p(a,b+e),p(a+d,b),p(a+d,b+e),p(a,b+e));}part(name,color,out,animation);}
function prism(name,poly,z,depth,color,animation='none'){let out=[],front=poly.map(p=>[p[0],p[1],z+depth/2]),back=poly.map(p=>[p[0],p[1],z-depth/2]);for(let i=1;i<poly.length-1;i++)out.push(front[0],front[i],front[i+1],back[0],back[i+1],back[i]);for(let i=0;i<poly.length;i++){let j=(i+1)%poly.length;out.push(front[i],back[i],front[j],front[j],back[i],back[j]);}part(name,color,out,animation);}
function box(name,x,y,z,w,h,d,color,anim='none'){prism(name,[[x-w/2,y-h/2],[x+w/2,y-h/2],[x+w/2,y+h/2],[x-w/2,y+h/2]],z,d,color,anim);}
function ring(name,c,rx,ry,t,color,anim='none'){let out=[];for(let i=0;i<48;i++){const a=i*Math.PI/24,b=(i+1)*Math.PI/24;const p=(v,r)=>[c[0]+(rx+r)*Math.cos(v),c[1]+(ry+r)*Math.sin(v),c[2]];out.push(p(a,t),p(b,t),p(a,-t),p(b,t),p(b,-t),p(a,-t));}part(name,color,out,anim);}
function star(name,x,y,z,r,color,anim='none'){let poly=[];for(let i=0;i<10;i++){let a=Math.PI/2+i*Math.PI/5,q=i%2?r*.43:r;poly.push([x+Math.cos(a)*q,y+Math.sin(a)*q]);}prism(name,poly,z,.035,color,anim);}
function heart(name,x,y,z,s,color,anim='none'){let poly=[];for(let i=0;i<48;i++){let t=2*Math.PI*i/48;poly.push([x+s*Math.pow(Math.sin(t),3),y+s*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16]);}prism(name,poly,z,.07,color,anim);}
function crystal(name,x,y,z,s,color){prism(name,[[x,y+s],[x+s*.45,y],[x,y-s],[x-s*.45,y]],z,s*.7,color);}
function ear(name,side,type,color,inner){let x=side*.72;if(type==='round'){ell(name,[x,.98,.12],[.40,.43,.19],color);ell(name+' inner',[x,.98,.31],[.24,.25,.05],inner);}else{const h=type==='long'?1.15:.64;prism(name,[[x-side*.39,.68],[x+side*.25,.73],[x+side*.14,.93+h]],.17,.17,color);prism(name+' inner',[[x-side*.22,.81],[x+side*.13,.83],[x+side*.10,.91+h*.77]],.28,.025,inner);}}
function nose(color){ell('nose',[0,-.15,.48],[.15,.11,.10],color);}
function whiskers(color){for(const side of [-1,1])for(let i=0;i<3;i++)box('whisker',side*.69,-.14-i*.12,.32,.48,.018,.018,color);}
function crown(color=C.gold){prism('sculpted crown',[[-.94,.79],[-.88,1.46],[-.47,1.13],[0,1.70],[.47,1.13],[.88,1.46],[.94,.79]],.06,.18,color);for(let i=-1;i<=1;i++)crystal('crown gemstone',i*.50,1.01, .20,.15,i===0?C.pink:C.cyan);box('crown band',0,.82,.18,1.88,.12,.12,C.gold);}
function butterfly(x,y,z,s,color,anim='flutter'){for(const side of [-1,1]){ell('upper wing',[x+side*s*.45,y+s*.18,z],[s*.43,s*.42,s*.055],color,anim);ell('lower wing',[x+side*s*.30,y-s*.28,z],[s*.29,s*.29,s*.05],C.pink,anim);}ell('butterfly body',[x,y,z+.07],[s*.055,s*.5,s*.06],C.gold,anim);}
function flower(x,y,z,s,color){for(let i=0;i<7;i++){let a=i*Math.PI*2/7;ell('petal',[x+Math.cos(a)*s*.6,y+Math.sin(a)*s*.6,z],[s*.42,s*.42,.045],color);}ell('flower center',[x,y,z+.06],[s*.30,s*.30,.06],C.gold);}
function sparks(type,count,colors){for(let i=0;i<count;i++){let x=Math.sin(i*7.73)*2.0,y=Math.cos(i*4.17)*1.85,z=.1+(i%5)*.04,c=colors[i%colors.length],s=.06+(i%4)*.025; if(type==='star')star('falling star',x,y,z,s,c,'fall');else if(type==='heart')heart('floating heart',x,y,z,s,c,'rise');else if(type==='snow'){for(let k=0;k<3;k++){const a=k*Math.PI/3;const dx=Math.cos(a)*s,dy=Math.sin(a)*s;prism('snow crystal',[[x-dx-.008,y-dy],[x+dx-.008,y+dy],[x+dx+.008,y+dy],[x-dx+.008,y-dy]],z,.01,c,'fall');}}else box('confetti',x,y,z,s,s*.45,.025,c,'fall');}}
const art={
 puppy(){for(const s of [-1,1]){ell('floppy puppy ear',[s*.85,.59,.12],[.31,.70,.16],C.brown);ell('inner ear',[s*.85,.57,.28],[.17,.45,.035],C.cream);}ell('muzzle',[0,-.25,.30],[.32,.18,.12],C.cream);nose(C.black);ell('tongue',[0,-.53,.43],[.13,.20,.045],C.pink,'jaw');},
 bunny(){for(const s of [-1,1])ear('bunny ear',s,'long',C.white,C.pink);nose(C.pink);whiskers(C.white);},
 kitty(){for(const s of [-1,1])ear('cat ear',s,'point',C.black,C.pink);nose(C.pink);whiskers(C.black);},
 panda(){for(const s of [-1,1]){ear('panda ear',s,'round',C.black,C.white);ring('panda eye patch',[s*.43,.27,.34],.28,.22,.065,C.black);}nose(C.black);},
 fox(){for(const s of [-1,1])ear('fox ear',s,'point',[1,.34,.05,1],C.cream);nose(C.black);for(const s of [-1,1])prism('fox cheek',[[s*.2,-.20],[s*.9,-.10],[s*.65,-.55]],.21,.06,C.cream);},
 'royal-crown'(){crown();},
 'heart-glasses'(){for(const s of [-1,1]){heart('heart lens',s*.43,.25,.42,.33,[1,.12,.38,.32]);ring('rose frame',[s*.43,.25,.45],.34,.28,.035,C.pink);}box('bridge',0,.27,.45,.22,.04,.04,C.gold);},
 'butterfly-hair'(){butterfly(-.73,1.04,.15,.56,C.purple);butterfly(.72,.86,.20,.35,C.cyan);},
 'golden-earrings'(){for(const s of [-1,1]){ring('gold hoop',[s*1.01,-.39,.09],.20,.35,.035,C.gold);crystal('pendant',s*1.01,-.81,.14,.16,C.white);}},
 'cyber-headset'(){ring('headphone band',[0,.30,-.17],1.12,1.05,.10,C.black);for(const s of [-1,1]){box('ear cup',s*1.08,.02,.05,.30,.64,.28,C.purple);box('light strip',s*1.08,.02,.22,.12,.48,.04,C.cyan);}box('mic arm',.64,-.44,.39,.80,.06,.05,C.black);ell('mic tip',[.25,-.44,.42],[.10,.09,.09],C.cyan);},
 angel(){ring('halo',[0,1.38,.04],.72,.18,.04,C.gold,'hover');for(const s of [-1,1])for(let i=0;i<6;i++)ell('feather',[s*(1.0+i*.11),.15-i*.11,-.12],[.16,.50-i*.035,.05],C.white);},
 devil(){for(const s of [-1,1])prism('curved horn',[[s*.42,.77],[s*.91,.81],[s*1.0,1.50],[s*.70,1.24]],.13,.22,C.red);nose(C.red);},
 fairy(){for(const s of [-1,1])butterfly(s*1.12,.25,-.10,.62,[.45,1,.84,.70]);flower(-.5,.95,.18,.22,C.pink);star('fairy jewel',0,.64,.35,.13,C.white);},
 'ice-queen'(){for(let i=-3;i<=3;i++)crystal('ice spire',i*.25,1.0+(.45-Math.abs(i)*.10),.12,.40-Math.abs(i)*.05,C.cyan);for(const s of [-1,1])crystal('ice earring',s*.95,-.46,.20,.26,C.white);},
 'fire-king'(){crown([1,.28,.025,1]);for(let i=-3;i<=3;i++)prism('flame tongue',[[i*.25-.12,1.02],[i*.25+.12,1.02],[i*.25+.09,1.55+(i%2)*.22]],.24,.08,C.gold,'flame');},
 'anime-eyes'(){for(const s of [-1,1]){ring('iris frame',[s*.43,.25,.40],.20,.25,.035,C.purple);star('eye sparkle',s*.43,.28,.45,.12,C.white);}},
 'anime-blush'(){for(const s of [-1,1]){ell('blush',[s*.59,-.16,.30],[.28,.12,.015],[1,.25,.49,.46]);for(let i=0;i<3;i++)box('blush line',s*(.44+i*.10),-.16,.34,.025,.12,.01,C.pink);}},
 'magic-eyes'(){for(const s of [-1,1]){ring('magic orbit',[s*.43,.25,.40],.25,.27,.018,C.cyan,'pulse');crystal('iris jewel',s*.43,.25,.44,.16,C.purple);}},
 'anime-cat'(){for(const s of [-1,1])ear('anime ear',s,'point',C.purple,C.cyan);nose(C.pink);for(const s of [-1,1])star('cat cheek star',s*.66,-.12,.36,.15,C.gold);whiskers(C.purple);},
 'star-eyes'(){for(const s of [-1,1]){star('golden star eye',s*.43,.25,.43,.25,C.gold,'blink');star('inner sparkle',s*.43,.25,.48,.11,C.white,'blink');}},
 'love-hearts'(){sparks('heart',22,[C.pink,C.red,C.purple]);},
 'cry-baby'(){for(const s of [-1,1]){ell('tear stream',[s*.5,-.16,.35],[.10,.38,.035],[.13,.64,1,.72],'tear');ell('tear drop',[s*.5,-.59,.37],[.13,.19,.06],C.cyan,'tear');}},
 'funny-face'(){ring('round glasses left',[-.43,.25,.43],.36,.36,.04,C.blue);ring('round glasses right',[.43,.25,.43],.36,.36,.04,C.red);ell('clown nose',[0,-.05,.59],[.23,.22,.24],C.red);box('moustache',0,-.35,.4,.77,.10,.10,C.black);},
 'happy-spark'(){sparks('star',20,[C.gold,C.pink]);for(const s of [-1,1])star('cheek spark',s*.62,-.13,.35,.16,C.gold);},
 'angry-face'(){for(const s of [-1,1])prism('angry brow',[[s*.1,.51],[s*.72,.72],[s*.73,.58],[s*.12,.38]],.38,.04,C.red);star('anger symbol',.80,.89,.27,.23,C.red);},
 butterflies(){for(let i=0;i<5;i++)butterfly(Math.sin(i*2.3)*1.35,Math.cos(i*2.3)*1.20,.1,.24+i*.025,[C.cyan,C.purple,C.gold][i%3]);},
 'flower-crown'(){for(let i=0;i<9;i++){let a=Math.PI*.12+i*Math.PI*.095;flower(Math.cos(a)*.93, .76+Math.sin(a)*.45,.20,.16,[C.pink,C.white,C.purple][i%3]);}},
 snowfall(){sparks('snow',30,[C.white,C.cyan]);},
 'star-shower'(){sparks('star',28,[C.gold,C.white,C.purple]);},
 'rainbow-aura'(){const colors=[C.red,[1,.49,.04,1],C.gold,C.green,C.cyan,C.purple];for(let i=0;i<6;i++)ring('rainbow arc',[0,.04,-.1],1.18+i*.055,1.35+i*.055,.022,colors[i],'pulse');},
 birthday(){prism('party hat',[[-.56,.84],[.56,.84],[0,1.94]],.03,.25,C.purple);for(let i=-2;i<=2;i++)star('hat star',i*.16,1.02+Math.abs(i%2)*.21,.21,.07,C.gold);ell('pom pom',[0,1.94,.08],[.16,.16,.16],C.pink);sparks('confetti',16,[C.cyan,C.gold,C.pink]);},
 'disco-king'(){ell('mirror ball',[0,1.46,.08],[.47,.47,.47],C.white,'spin',12,6);for(let i=0;i<12;i++)box('disco beam',Math.cos(i)*1.3,Math.sin(i)*1.4,.02,.20,.04,.02,[C.pink,C.cyan,C.purple][i%3],'pulse');},
 confetti(){sparks('confetti',46,[C.pink,C.cyan,C.gold,C.purple,C.green]);},
 'neon-party'(){for(const s of [-1,1])ring('neon lens',[s*.43,.25,.45],.34,.25,.035,C.cyan,'pulse');ring('pink party halo',[0,1.21,.1],.95,.20,.03,C.pink,'hover');sparks('star',12,[C.purple,C.cyan]);},
 'gold-rain'(){sparks('confetti',40,[C.gold,[1,.88,.46,1]]);},
 'diamond-face'(){for(let i=0;i<14;i++){let a=i*Math.PI/7;crystal('faceted face jewel',Math.cos(a)*.75,Math.sin(a)*.80,.28,.12,C.white);}crystal('forehead diamond',0,.62,.38,.27,C.cyan);},
 hologram(){for(let i=0;i<13;i++)box('holographic scan line',0,-.84+i*.14,.25,1.60,.017,.01,[.08,.90,1,.50],'scan');for(const s of [-1,1])ring('temple circuit',[s*.80,.2,.18],.15,.28,.025,C.cyan,'pulse');},
 'dragon-mask'(){for(const s of [-1,1]){ear('dragon horn',s,'long',C.green,C.gold);for(let i=0;i<4;i++)crystal('dragon scale',s*(.4+i*.13),.56-i*.2,.32,.16,C.green);}prism('dragon snout',[[-.31,-.10],[.31,-.10],[.22,-.35],[-.22,-.35]],.53,.28,C.green);nose(C.gold);},
 'crystal-butterfly'(){butterfly(0,.96,.27,.59,C.cyan);for(const s of [-1,1]){crystal('crystal cheek',s*.64,-.08,.35,.25,C.purple);crystal('crystal drop',s*.96,-.49,.21,.20,C.white);}},
 'yaro-royal'(){crown();for(const s of [-1,1]){ring('royal chain',[s*.98,-.36,.12],.16,.29,.025,C.gold);crystal('royal sapphire',s*.98,-.69,.19,.20,C.blue);}star('royal crest',0,.64,.40,.17,C.purple);},
 'neon-rings'(){for(let i=0;i<4;i++)ring('orbital neon',[0,.02,.08+i*.05],1.12+i*.13,.96+i*.12,.022,[C.cyan,C.pink,C.purple,C.gold][i],'orbit');},
 'galaxy-face'(){for(let i=0;i<38;i++){let a=i*2.399,r=.15+.65*Math.sqrt(i/38);star('constellation',Math.cos(a)*r,Math.sin(a)*r,.31,.025+(i%3)*.013,[C.purple,C.cyan,C.white][i%3],'pulse');}ring('galaxy orbit',[0,.20,.33],.79,.21,.014,C.purple,'orbit');},
 'robot-face'(){for(const s of [-1,1]){box('temple plate',s*.85,.03,.20,.22,1.12,.14,[.23,.28,.37,1]);box('optic rail',s*.43,.49,.33,.65,.065,.06,C.cyan);for(let i=0;i<3;i++)box('vent',s*.66,-.33-i*.1,.31,.22,.025,.02,C.black);}box('forehead chip',0,.72,.33,.36,.23,.08,C.purple);},
 'flame-face'(){for(const s of [-1,1])for(let i=0;i<6;i++)prism('face flame',[[s*(.47+i*.07),-.63+i*.11],[s*(.79+i*.03),-.61+i*.11],[s*(.84+i*.035),-.19+i*.16]],.27,.04,i%2?C.gold:[1,.24,.015,1],'flame');},
 'yaro-signature'(){ring('signature orbit',[0,.12,.15],1.05,1.13,.022,C.gold,'pulse');prism('Y left',[[-.31,.76],[-.20,.76],[.04,.44],[-.04,.36]],.37,.045,C.gold);prism('Y right',[[.31,.76],[.20,.76],[-.04,.44],[.04,.36]],.37,.045,C.gold);box('Y stem',0,.29,.37,.09,.30,.045,C.gold);for(const s of [-1,1])star('signature star',s*.80,-.05,.31,.16,C.white);},
};
function glb(id){const buffers=[],views=[],accessors=[],meshes=[],materials=[],nodes=[];let offset=0;
 function accessor(values){let b=Buffer.alloc(values.length*4);values.forEach((n,i)=>b.writeFloatLE(n,i*4));buffers.push(b);views.push({buffer:0,byteOffset:offset,byteLength:b.length});offset+=b.length;accessors.push({bufferView:views.length-1,componentType:5126,count:values.length/3,type:'VEC3',min:[0,1,2].map(k=>Math.min(...values.filter((_,i)=>i%3===k))),max:[0,1,2].map(k=>Math.max(...values.filter((_,i)=>i%3===k)))});return accessors.length-1;}
 for(const p of parts){const xyz=[],normals=[];for(let i=0;i<p.triangles.length;i+=3){let [a,b,c]=p.triangles.slice(i,i+3),u=b.map((v,k)=>v-a[k]),v=c.map((w,k)=>w-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;n=n.map(v=>v/l);xyz.push(...a,...b,...c);normals.push(...n,...n,...n);}materials.push({name:p.name,pbrMetallicRoughness:{baseColorFactor:p.color,metallicFactor:.3,roughnessFactor:.38},alphaMode:p.color[3]<1?'BLEND':'OPAQUE',doubleSided:true});meshes.push({primitives:[{attributes:{POSITION:accessor(xyz),NORMAL:accessor(normals)},material:materials.length-1,mode:4}]});nodes.push({name:p.name,mesh:meshes.length-1,extras:{yaroAnimation:p.animation}});}
 const doc={asset:{version:'2.0',generator:'Yaro original geometric art author',copyright:'Yaro original assets'},scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes,materials,buffers:[{byteLength:offset}],bufferViews:views,accessors};let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=Buffer.concat(buffers),header=Buffer.alloc(20),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(path.join(base,id+'.glb'),Buffer.concat([header,json,bh,bin]));return {id,parts:parts.length,triangles:parts.reduce((n,p)=>n+p.triangles.length/3,0)};}
const inventory=[];for(const [id,draw]of Object.entries(art)){parts=[];draw();inventory.push(glb(id));}fs.writeFileSync(path.join(base,'original-models.json'),JSON.stringify({license:'Original Yaro project assets',format:'glTF 2.0',effects:inventory},null,2)+'\n');console.log(`Authored ${inventory.length} distinct original GLB scenes`);
