'use strict';
const fs=require('node:fs/promises');
const {createHash}=require('node:crypto');
const {ObjectId}=require('mongodb');
const {fingerprint,rankMatches}=require('./image-match');
const MAX_BYTES=20*1024*1024;

async function readLimited(response, limit=MAX_BYTES) {
  if(!response.ok)throw new Error(`Image download failed (${response.status})`);
  const declared=Number(response.headers.get('content-length'));
  if(declared>limit)throw new Error('Image exceeds size limit');
  if(!response.body)throw new Error('Empty image response');
  let total=0;const chunks=[];
  for await(const chunk of response.body){total+=chunk.length;if(total>limit){await response.body.cancel().catch(()=>{});throw new Error('Image exceeds size limit');}chunks.push(Buffer.from(chunk));}
  if(!total)throw new Error('Empty image response');return Buffer.concat(chunks,total);
}
async function loadIndex(filename){
  try {const data=JSON.parse(await fs.readFile(filename,'utf8'));if(data.version!==1||!Array.isArray(data.entries))throw new Error('Invalid image index');return data;}
  catch(error){if(error.code==='ENOENT')return {version:1,entries:[]};throw error;}
}
async function saveIndex(filename,index){
  const tmp=filename+'.tmp';await fs.writeFile(tmp,JSON.stringify(index),{mode:0o600});await fs.rename(tmp,filename);
}
async function buildIndex({collection,filename,fetchImpl=fetch,limit=0,afterId='',onProgress=()=>{}}){
  if(!Number.isSafeInteger(limit)||limit<0)throw new Error('Image index limit must be a non-negative integer');
  if(afterId && !/^[a-f\d]{24}$/i.test(afterId))throw new Error('Invalid image index cursor');
  const index=await loadIndex(filename);const byId=new Map(index.entries.map(x=>[x.id,x]));let processed=0,failed=0,lastId=null,hasMore=false;
  const filter={taskId:{$type:'string',$ne:''},mimetype:{$regex:'^image/', $options:'i'}};
  if(afterId)filter._id={$gt:new ObjectId(afterId)};
  const cursor=collection.find(filter,{projection:{_id:1,taskId:1,originalName:1,mimetype:1,path:1,updatedAt:1}}).sort({_id:1});
  try {for await(const file of cursor){
    if(limit && processed>=limit){hasMore=true;break;}processed++;const id=String(file._id);lastId=id;
    const version=createHash('sha256').update(JSON.stringify([file.updatedAt||null,file.path||'',file.taskId||'',file.originalName||''])).digest('hex');
    if(byId.get(id)?.version!==version){
      try {const url=new URL(file.path);if(url.protocol!=='https:'||!['kampungcetak-storage.s3.ap-southeast-5.amazonaws.com','res.cloudinary.com'].includes(url.hostname)||url.username||url.password||url.port)throw new Error('Unsupported image host');
        const response=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(30000)});const hash=await fingerprint(await readLimited(response));
        byId.set(id,{id,taskId:file.taskId,name:String(file.originalName||'').slice(0,300),hash,version});
      } catch {failed++;byId.delete(id);}
    }
    if(processed%25===0){index.entries=[...byId.values()];await saveIndex(filename,index);onProgress({processed,failed,indexed:index.entries.length,lastId});}
  }} finally {if(cursor.close)await cursor.close();}
  index.entries=[...byId.values()];await saveIndex(filename,index);return {processed,failed,indexed:index.entries.length,nextAfter:hasMore?lastId:null};
}
async function searchIndex(bytes,filename,{limit=10,minScore=.78}={}) {const index=await loadIndex(filename);return {indexed:index.entries.length,matches:rankMatches(await fingerprint(bytes),index.entries,{limit,minScore})};}
module.exports={MAX_BYTES,readLimited,loadIndex,saveIndex,buildIndex,searchIndex};
