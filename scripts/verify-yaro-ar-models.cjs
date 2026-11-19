const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'../shared/ar-assets/models'),inventory=require(path.join(root,'original-models.json')).effects,hashes=new Set();assert.equal(inventory.length,45);
let triangles=0,animated=0;
for(const model of inventory){const data=fs.readFileSync(path.join(root,model.id+'.glb'));assert.equal(data.readUInt32LE(0),0x46546c67);assert.equal(data.readUInt32LE(4),2);assert.equal(data.readUInt32LE(8),data.length);assert.equal(data.readUInt32LE(16),0x4e4f534a);
 const jsonLength=data.readUInt32LE(12),doc=JSON.parse(data.subarray(20,20+jsonLength)),binaryStart=jsonLength+28;assert.equal(data.readUInt32LE(jsonLength+24),0x004e4942);assert.equal(data.readUInt32LE(jsonLength+20),data.length-binaryStart);
 const hash=crypto.createHash('sha256').update(data.subarray(binaryStart)).digest('hex');assert(!hashes.has(hash),model.id+' duplicates another scene geometry');hashes.add(hash);
 let count=0;for(const mesh of doc.meshes)for(const primitive of mesh.primitives){assert.equal(primitive.mode,4);assert.equal(primitive.indices,undefined);assert.ok(doc.materials[primitive.material]);
 for(const name of ['POSITION','NORMAL']){const accessor=doc.accessors[primitive.attributes[name]],view=doc.bufferViews[accessor.bufferView];assert.equal(accessor.type,'VEC3');assert.equal(accessor.componentType,5126);assert.equal(accessor.count%3,0);assert(view.byteOffset>=0 && view.byteOffset+view.byteLength<=data.length-binaryStart);assert.equal(view.byteLength,accessor.count*12);for(let i=0;i<accessor.count*3;i++)assert(Number.isFinite(data.readFloatLE(binaryStart+view.byteOffset+i*4)));if(name==='POSITION')count+=accessor.count/3;}}
 assert.equal(count,model.triangles);triangles+=count;assert(count>0 && count<25000);if(doc.nodes.some(n=>n.extras.yaroAnimation!=='none'))animated++;
}
console.log(JSON.stringify({distinctOriginalGLBScenes:hashes.size,totalTriangles:triangles,animatedScenes:animated,nativeGpuValidation:'separate device test required'},null,2));
