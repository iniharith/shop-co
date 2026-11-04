'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),sharp=require('sharp');
const {buildIndex,searchIndex,readLimited}=require('../image-index');
test('index builds from allowed storage, searches by image and reuses unchanged records',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'kc-index-'));const file=path.join(dir,'index.json');
  try {
    let image=await sharp({create:{width:50,height:50,channels:3,background:'#ff0000'}}).png().toBuffer();
    let docs=[{_id:'file1',taskId:'task1',originalName:'Example.png',path:'https://kampungcetak-storage.s3.ap-southeast-5.amazonaws.com/example.png',updatedAt:'2026-01-01'}];
    const collection={find(){return {sort(){return this},async *[Symbol.asyncIterator](){yield* docs},async close(){}}}};
    let calls=0;const fetchImpl=async()=>{calls++;return new Response(image)};
    assert.deepEqual(await buildIndex({collection,filename:file,fetchImpl}),{processed:1,failed:0,indexed:1,nextAfter:null});
    const result=await searchIndex(image,file);assert.equal(result.matches[0].id,'file1');assert.equal(result.matches[0].score,1);
    await buildIndex({collection,filename:file,fetchImpl});assert.equal(calls,1);
    assert.ok(!(await fs.readFile(file,'utf8')).includes('amazonaws.com'));
  }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('bounded batches resume strictly after their last record',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'kc-index-batch-')),file=path.join(dir,'index.json');
  const {ObjectId}=require('mongodb');
  try {
    const bytes=await sharp({create:{width:30,height:30,channels:3,background:'#2288cc'}}).png().toBuffer();
    const docs=[1,2,3].map(n=>({_id:new ObjectId(n.toString(16).padStart(24,'0')),taskId:'task',originalName:`${n}.png`,path:`https://res.cloudinary.com/example/${n}.png`}));
    const collection={find(filter){const selected=docs.filter(d=>!filter._id||d._id.toString()>filter._id.$gt.toString());return {sort(){return this},async *[Symbol.asyncIterator](){yield* selected},async close(){}}}};
    const fetchImpl=async()=>new Response(bytes);
    const first=await buildIndex({collection,filename:file,fetchImpl,limit:2});assert.equal(first.indexed,2);assert.equal(first.nextAfter,String(docs[1]._id));
    const second=await buildIndex({collection,filename:file,fetchImpl,limit:2,afterId:first.nextAfter});assert.equal(second.processed,1);assert.equal(second.indexed,3);assert.equal(second.nextAfter,null);
    await assert.rejects(()=>buildIndex({collection,filename:file,afterId:'bad'}),/cursor/);
  } finally {await fs.rm(dir,{recursive:true,force:true})}
});
test('bounded downloads reject oversized payloads',async()=>{await assert.rejects(()=>readLimited(new Response(Buffer.alloc(20),{headers:{'content-length':'20'}}),10),/size limit/)});
