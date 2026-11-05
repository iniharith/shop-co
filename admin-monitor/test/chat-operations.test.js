const test=require('node:test'),assert=require('node:assert/strict');
const {createChatOperations}=require('../chat-operations');
function fixture(){
 let time=0,writes=0,submissions=0,changed=false;
 const task={_id:'a'.repeat(24),title:'Customer task',status:'IN_PRODUCTION',updatedAt:'2026-11-05T01:00:00Z'};
 const ops=createChatOperations({enabled:()=>true,today:()=> '2026-11-05',now:()=>time,
 report:async date=>'Report '+date,
 shopco:{getTask:async()=>task,updateTask:async(id,changes,version)=>{assert.equal(version,task.updatedAt);writes++;return {...task,...changes}},productionTasks:async()=>changed?[]:[{id:task._id,name:task.title}],getTaskQr:async()=> 'b'.repeat(48)},
 station:{submit:async()=>{submissions++;return{id:'job'}},submitBatch:async()=>{submissions++;return{id:'job'}},status:async()=>({status:'sent'})}});
 return {ops,task,counts:()=>({writes,submissions}),expire:()=>time=600001,change:()=>changed=true};
}
const code=result=>result.match(/\/confirm ([a-f0-9]{16})/)[1];
test('chat task edits require confirmation and preserve optimistic version',async()=>{
 const r=fixture(),proposal=await r.ops.run('prepare_task_update',{taskId:r.task._id,changes:{status:'PRINT_AWB'}});
 assert.equal(r.counts().writes,0);await assert.rejects(r.ops.confirm('wrong'));
 await r.ops.confirm(code(proposal));assert.equal(r.counts().writes,1);
 await assert.rejects(r.ops.confirm(code(proposal)));assert.equal(r.counts().writes,1);
});
test('production confirms once and refuses changed queues',async()=>{
 const r=fixture(),p=await r.ops.run('prepare_production',{folder:'Today'});
 assert.equal(r.counts().submissions,0);r.change();await assert.rejects(r.ops.confirm(code(p)),/queue changed/);
 assert.equal(r.counts().submissions,0);
 const s=fixture(),q=await s.ops.run('prepare_production',{folder:'Today'});await s.ops.confirm(code(q));
 await assert.rejects(s.ops.confirm(code(q)));assert.equal(s.counts().submissions,1);
});
test('cancelled, expired and superseded proposals cannot print',async()=>{
 const r=fixture(),a=await r.ops.run('prepare_awb',{taskId:r.task._id});r.ops.cancel();await assert.rejects(r.ops.confirm(code(a)));
 const b=await r.ops.run('prepare_awb',{taskId:r.task._id});r.expire();await assert.rejects(r.ops.confirm(code(b)));
 const c=await r.ops.run('prepare_awb',{taskId:r.task._id});await r.ops.run('prepare_awb',{taskId:r.task._id});await assert.rejects(r.ops.confirm(code(c)));
 assert.equal(r.counts().submissions,0);
});
test('reports are live and do not require action confirmation',async()=>{
 const r=fixture();assert.equal(await r.ops.run('upload_report',{}),'Report 2026-11-05');
 assert.match(await r.ops.run('production_preview',{}),/Customer task/);
 await assert.rejects(r.ops.run('prepare_production',{folder:'../outside'}));
 await assert.rejects(r.ops.run('prepare_task_update',{taskId:r.task._id,changes:{isDeleted:true}}));
});
