const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const clone=value=>structuredClone(value);
function runtime(){
 const data={files:[],tasks:[],trash:[]},deletedObjects=[],events=[];let sequence=0,failDelete=false;
 const values=(obj,key)=>{const parts=key.split('.');let list=[obj];for(const part of parts)list=list.flatMap(item=>Array.isArray(item)?item.map(x=>x?.[part]):[item?.[part]]);return list.flat();};
 function eq(a,b){return a instanceof Date||b instanceof Date?+new Date(a)===+new Date(b):String(a)===String(b);}
 function matches(item,filter={}){return Object.entries(filter).every(([key,expected])=>{
  if(key==='$or')return expected.some(query=>matches(item,query));
  const actual=values(item,key);
  if(expected&&typeof expected==='object'&&!Array.isArray(expected)&&!(expected instanceof Date))return Object.entries(expected).every(([op,value])=>{
   if(op==='$in')return actual.some(a=>value.some(v=>eq(a,v)));
   if(op==='$nin')return actual.every(a=>!value.some(v=>eq(a,v)));
   if(op==='$ne')return actual.every(a=>!eq(a,value));
   if(op==='$exists')return value?actual.some(a=>a!==undefined):actual.every(a=>a===undefined);
   if(op==='$gt')return actual.some(a=>a>value);if(op==='$lt')return actual.some(a=>a<value);if(op==='$lte')return actual.some(a=>a<=value);
   throw Error(op);
  });
  return actual.some(value=>eq(value,expected));
 });}
 function apply(item,update){for(const [key,value]of Object.entries(update.$set||{}))item[key]=clone(value);for(const key of Object.keys(update.$unset||{}))delete item[key];for(const [key,value]of Object.entries(update.$push||{}))(item[key]||=[]).push(clone(value));for(const [key,value]of Object.entries(update.$pull||{}))item[key]=(item[key]||[]).filter(row=>!matches(row,value));}
 const query=work=>({session(){return this;},select(){return this;},read(){return this;},limit(){return this;},lean(){return Promise.resolve(clone(work()));},then(resolve,reject){return Promise.resolve().then(work).then(resolve,reject);}});
 function model(key){return {
  find:filter=>query(()=>data[key].filter(row=>matches(row,filter))),
  findOne:filter=>query(()=>data[key].find(row=>matches(row,filter))||null),findById:id=>query(()=>data[key].find(row=>eq(row._id,id))||null),
  exists:filter=>query(()=>!!data[key].find(row=>matches(row,filter))),
  create:async docs=>{const made=docs.map(doc=>({...clone(doc),_id:doc._id||`trash-${++sequence}`,...(key==='trash'?{state:'deleted'}:{})}));data[key].push(...made);return made;},
  updateOne:(filter,update)=>query(()=>{const row=data[key].find(row=>matches(row,filter));if(row)apply(row,update);return {matchedCount:row?1:0,modifiedCount:row?1:0};}),
  updateMany:(filter,update)=>query(()=>{const rows=data[key].filter(row=>matches(row,filter));rows.forEach(row=>apply(row,update));return {matchedCount:rows.length,modifiedCount:rows.length};}),
  findOneAndUpdate:(filter,update)=>query(()=>{const row=data[key].find(row=>matches(row,filter));if(row)apply(row,update);return row||null;}),
  findOneAndDelete:filter=>query(()=>{const index=data[key].findIndex(row=>matches(row,filter));return index<0?null:data[key].splice(index,1)[0];}),
  deleteOne:filter=>query(()=>{const index=data[key].findIndex(row=>matches(row,filter));if(index>=0)data[key].splice(index,1);return {deletedCount:index>=0?1:0};}),
  deleteMany:filter=>query(()=>{const old=data[key].length;data[key]=data[key].filter(row=>!matches(row,filter));return {deletedCount:old-data[key].length};}),
 };}
 const mocks={Task:model('tasks'),FileUpload:model('files'),TrashItem:model('trash')};
 const mongoose={startSession:async()=>({withTransaction:async fn=>{const saved=clone(data);try{return await fn();}catch(error){Object.assign(data,saved);throw error;}},endSession:async()=>{}})};
 const exports={};
 vm.runInNewContext(fs.readFileSync(require.resolve('../dist/shared/utils/trash'),'utf8'),{exports,require:name=>{
  if(name==='mongoose')return mongoose;
  if(name.endsWith('/entities/Task'))return {Task:mocks.Task};if(name.endsWith('/entities/FileUpload'))return {FileUpload:mocks.FileUpload};if(name.endsWith('/entities/TrashItem'))return {TrashItem:mocks.TrashItem};
  if(name.endsWith('/config/s3'))return {S3_BUCKET_NAME:'bucket',deleteFromS3:async url=>{deletedObjects.push(url);return !failDelete;}};
  if(name.endsWith('/FileUploadRepository'))return {notifyFileClients:()=>events.push('files')};
  if(name.endsWith('/taskBroadcast'))return {emitTaskUpdated:async()=>events.push('tasks')};throw Error(name);
 },Date,Set,URL,console,setInterval,clearInterval});
 return {api:exports,data,deletedObjects,failStorage:()=>{failDelete=true;},recoverStorage:()=>{failDelete=false;}};
}
const file={_id:'111111111111111111111111',taskId:'222222222222222222222222',userId:'staff',originalName:'Artwork.pdf',filename:'stored.pdf',path:'https://bucket.s3.amazonaws.com/art.pdf',sourcePath:'https://bucket.s3.amazonaws.com/source.pdf',thumbnailPath:'https://bucket.s3.amazonaws.com/thumb.png'};
const task=()=>({_id:file.taskId,title:'Task A',status:'PACKAGING',isDeleted:false,files:[{_id:'embedded',url:file.path,name:'Artwork.pdf',notes:'Keep note'}],activities:[]});

test('file soft delete preserves storage, removes active references and Undo restores original metadata',async()=>{
 const r=runtime();r.data.files.push(clone(file));r.data.tasks.push(task());
 const before=Date.now(),result=await r.api.trashFile(file,'staff');
 assert.equal(r.data.files.length,0);assert.equal(r.data.tasks[0].files.length,0);assert.equal(r.deletedObjects.length,0);
 assert.ok(+new Date(result.purgeAt)-before>=15*60000);assert.ok(+new Date(result.purgeAt)-before<15*60000+1000);
 await r.api.restoreTrash(result.trashId,'staff');
 assert.equal(r.data.files[0].path,file.path);assert.equal(r.data.tasks[0].files[0].notes,'Keep note');assert.equal(r.data.trash.length,0);
});
test('restore collisions and expiration leave the recoverable snapshot intact',async()=>{
 const r=runtime();r.data.files.push(clone(file));r.data.tasks.push(task());const result=await r.api.trashFile(file,'staff');
 r.data.files.push({...clone(file),_id:'other'});
 await assert.rejects(r.api.restoreTrash(result.trashId,'staff'),/already exists/);assert.equal(r.data.trash.length,1);assert.equal(r.data.tasks[0].files.length,0);
 r.data.files=[];r.data.trash[0].purgeAt=new Date(Date.now()-1);
 await assert.rejects(r.api.restoreTrash(result.trashId,'staff'),/no longer recoverable/);assert.equal(r.data.trash.length,1);
});
test('task soft delete keeps files; restore clears deletion deadline and leaves content unchanged',async()=>{
 const r=runtime();r.data.files.push(clone(file));r.data.tasks.push(task());const result=await r.api.trashTask(file.taskId,'staff');
 assert.equal(r.data.tasks[0].isDeleted,true);assert.equal(r.data.files.length,1);assert.equal(r.deletedObjects.length,0);
 await r.api.restoreTrash(result.trashId,'staff');assert.equal(r.data.tasks[0].isDeleted,false);assert.equal(r.data.tasks[0].purgeAt,undefined);assert.equal(r.data.tasks[0].files[0].url,file.path);
});
test('automatic cleanup waits for 15-minute deadline then removes original and companion objects',async()=>{
 const r=runtime();r.data.files.push(clone(file));r.data.tasks.push(task());const result=await r.api.trashFile(file,'staff');
 assert.equal(await r.api.purgeTrash(result.trashId),false);assert.equal(r.deletedObjects.length,0);
 r.data.trash[0].purgeAt=new Date(Date.now()-1);await r.api.cleanupTrash();
 assert.deepEqual(r.deletedObjects.sort(),[file.path,file.sourcePath,file.thumbnailPath].sort());assert.equal(r.data.trash.length,0);
});
test('failed permanent storage removal retains metadata, blocks unsafe Undo, and permits retry',async()=>{
 const r=runtime();r.data.files.push(clone(file));r.data.tasks.push(task());const result=await r.api.trashFile(file,'staff');r.data.trash[0].purgeAt=new Date(Date.now()-1);r.failStorage();
 await assert.rejects(r.api.purgeTrash(result.trashId),/metadata retained/);assert.equal(r.data.trash[0].state,'purging');
 await assert.rejects(r.api.restoreTrash(result.trashId,'staff'),/no longer recoverable/);
 r.recoverStorage();r.data.trash[0].purgeLeaseAt=new Date(Date.now()-16*60000);assert.equal(await r.api.purgeTrash(result.trashId),true);assert.equal(r.data.trash.length,0);
});
test('legacy task attachments are recoverable without an existing FileUpload document',async()=>{
 const r=runtime();r.data.tasks.push(task());const result=await r.api.trashTaskAttachment(file.taskId,'embedded','staff');assert.equal(r.data.tasks[0].files.length,0);assert.equal(r.deletedObjects.length,0);
 await r.api.restoreTrash(result.trashId,'staff');assert.equal(r.data.tasks[0].files[0].name,'Artwork.pdf');
});
test('task permanent deletion keeps objects referenced by another recoverable task',async()=>{
 const r=runtime();r.data.files.push(clone(file));r.data.tasks.push(task(),{...task(),_id:'other',isDeleted:true});const result=await r.api.trashTask(file.taskId,'staff');r.data.trash[0].purgeAt=new Date(Date.now()-1);
 await r.api.purgeTrash(result.trashId);assert.equal(r.data.tasks.length,1);assert.ok(!r.deletedObjects.includes(file.path));assert.equal(r.data.files.length,0);
});
