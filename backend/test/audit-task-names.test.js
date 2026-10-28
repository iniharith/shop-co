const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),express=require('express'),asyncHandler=require('express-async-handler');
const source=name=>ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,'../src/presentation',name),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
function load(name, modules){const exports={};vm.runInNewContext(source(name),{exports,require:key=>{if(key in modules)return modules[key];throw Error('Unexpected dependency '+key);},console});return exports;}
const id='0123456789abcdef01234567',missing='abcdefabcdefabcdefabcdef',other='fedcbafedcbafedcbafedcba';
const tasks=[{_id:id,title:'Design A+B (Poster)'},{_id:other,title:'Other task'}];
function matches(log,filter){return Object.entries(filter).every(([key,value])=>{
 if(key==='$or')return value.some(v=>matches(log,v));
 if(key==='$and')return value.every(v=>matches(log,v));
 if(key==='$expr'){const field=value.$eq[1].$concat[1]==='$entityType'?'entityType':'entityId';return log.summary===`status change: ${log[field]}`;}
 if(value&&typeof value==='object'&&value.$in)return value.$in.includes(log[key]);
 if(value&&typeof value==='object'&&value.$regex!==undefined)return new RegExp(value.$regex,value.$options).test(log[key]||'');
 return log[key]===value;
});}
function models(){
 let records=[
 {_id:'1',action:'status_change',entityType:'tasks',entityId:id,summary:`status change: ${id}`,actorName:'Staff'},
 {_id:'2',action:'status_change',entityType:'tasks',entityId:id,summary:'status change: Original Name',actorName:'Staff'},
 {_id:'3',action:'status_change',entityType:'tasks',entityId:missing,summary:`status change: ${missing}`,actorName:'Staff'},
 {_id:'4',action:'file_add',entityType:'files',entityId:other,summary:'file add: A+B (Poster)',actorName:'Other'},
 {_id:'5',action:'status_change',entityType:id,summary:`status change: ${id}`,route:`/api/tasks/${id}`,actorName:'Staff'},
 {_id:'6',action:'status_change',entityType:id,summary:`status change: ${id}`,route:`/api/orders/${id}`,actorName:'Staff'},
 ];
 const task={find(filter){let data;if(filter.title){const pattern=new RegExp(filter.title.$regex,filter.title.$options);data=tasks.filter(t=>pattern.test(t.title));}else data=tasks.filter(t=>filter._id.$in.includes(t._id));return {select(){return this},read(){return this},lean:async()=>data}}};
 const audit={find(filter){const selected=records.filter(r=>matches(r,filter));let offset=0,limit=100;return {sort(){return this},skip(n){offset=n;return this},limit(n){limit=n;return this},collation(){return this},lean:async()=>selected.slice(offset,offset+limit)}},countDocuments(filter){const count=records.filter(r=>matches(r,filter)).length;return {collation(){return this},then(resolve,reject){return Promise.resolve(count).then(resolve,reject)}}}};
 return {task,audit};
}
async function getLogs(q, entityType){
 const {task,audit}=models();
 const auth={__esModule:true,default:(_req,_res,next)=>next(),authorizeRoles:()=>((_req,_res,next)=>next())};
 const mod=load('routes/auditRoutes.ts',{'express':express,'express-async-handler':asyncHandler,'../../domain/entities/AuditLog':{AuditLog:audit},'../../domain/entities/Task':{Task:task},'../middlewares/auth.middileware':auth});
 const app=express();app.use('/api/audit-logs',mod.default);const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 try{const response=await fetch(`http://127.0.0.1:${server.address().port}/api/audit-logs?${new URLSearchParams({...(q?{q}:{}),...(entityType?{entityType}:{})})}`);assert.equal(response.status,200);return await response.json();}finally{await new Promise(resolve=>server.close(resolve));}
}

test('older task status logs show current task title; historical named summaries and missing tasks remain unchanged',async()=>{
 const result=await getLogs('');assert.equal(result.data[0].summary,'status change: Design A+B (Poster)');
 assert.equal(result.data[1].summary,'status change: Original Name');assert.equal(result.data[2].summary,`status change: ${missing}`);assert.equal(result.data[3].summary,'file add: A+B (Poster)');assert.equal(result.data[4].summary,'status change: Design A+B (Poster)');assert.equal(result.data[5].summary,`status change: ${id}`);
});
test('task name search finds legacy logs before pagination and treats punctuation literally',async()=>{
 const result=await getLogs('A+B (Poster)');assert.deepEqual(result.data.map(r=>r._id),['1','4','5']);assert.equal(result.pagination.total,3);
});
test('task ID and historical titles remain searchable',async()=>{
 const byId=await getLogs(id);assert.deepEqual(byId.data.map(r=>r._id),['1','2','5','6']);
 const old=await getLogs('Original Name');assert.deepEqual(old.data.map(r=>r._id),['2']);
});
test('new task status log captures task name and a failed lookup falls back to its ID',async()=>{
 for(const fail of [false,true]){
  const writes=[];const Task={findById:()=>({select(){return this},read(){return this},lean:async()=>{if(fail)throw Error('lookup unavailable');return tasks[0]}})};
  const {auditMiddleware}=load('middlewares/audit.middleware.ts',{'../../domain/entities/AuditLog':{AuditLog:{create:async value=>writes.push(value)}},'../../domain/entities/Task':{Task}});
  let finish;const req={method:'PUT',path:`/${id}`,originalUrl:`/api/tasks/${id}`,body:{status:'PACKAGING'},userId:'staff',get:()=>''};
  auditMiddleware(req,{statusCode:200,on(event,fn){finish=fn}},()=>{});finish();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(writes.length,1);assert.equal(writes[0].entityId,id);assert.equal(writes[0].entityType,'tasks');assert.equal(writes[0].summary,fail?`status change: ${id}`:'status change: Design A+B (Poster)');
 }
});


test('task entity filter includes legacy task routes without matching order routes',async()=>{
 const result=await getLogs('A+B (Poster)','tasks');assert.deepEqual(result.data.map(r=>r._id),['1','5']);assert.equal(result.pagination.total,2);
});
