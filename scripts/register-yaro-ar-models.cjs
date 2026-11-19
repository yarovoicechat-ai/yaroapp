const fs=require('fs'),path=require('path');
const app=path.resolve(__dirname,'..'),assets=path.join(app,'shared/ar-assets');
for(const file of fs.readdirSync(path.join(assets,'manifests'))){if(!file.endsWith('.json'))continue;
 const m=JSON.parse(fs.readFileSync(path.join(assets,'manifests',file),'utf8'));if(m.renderer.kind!=='glb')continue;
 if(!fs.existsSync(path.join(assets,'models',m.id+'.glb')))throw Error('Missing model '+m.id);
 m.status='experimental';delete m.pendingReason;m.version='2.0.0';m.renderer.shader='yaro-original-glb-v1';
 m.thumbnailSvg=m.thumbnailSvg.replace('ASSET PENDING',m.name);
 const folder=path.join(app,'src/features/YaroAR/effects',m.category.toLowerCase(),m.id);
 for(const target of [path.join(assets,'manifests',file),path.join(folder,'manifest.json')])fs.writeFileSync(target,JSON.stringify(m,null,2)+'\n');
 for(const target of [path.join(assets,'thumbnails',m.id+'.svg'),path.join(folder,'assets/thumbnail.svg')])fs.writeFileSync(target,m.thumbnailSvg);
 fs.writeFileSync(path.join(folder,'index.ts'),`import type { ARFilter } from '../../../types/ARFilter';\nexport const effect: ARFilter = ${JSON.stringify(m,null,2)};\nexport default effect;\n`);
}
fs.writeFileSync(path.join(assets,'ASSET_STATUS.json'),JSON.stringify({definitions:50,beautyModes:9,originalGLBScenes:45,verifiedEffects:0,deviceVerification:'pending',iosValidation:'Mac/Xcode/iPhone required',license:'Original Yaro geometric models; MediaPipe licensed separately'},null,2)+'\n');
