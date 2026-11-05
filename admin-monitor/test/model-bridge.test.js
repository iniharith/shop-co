'use strict';
const test=require('node:test'),assert=require('node:assert/strict');const {createModelBridge}=require('../model-bridge');
test('authenticated PC worker claims and completes a model request',async()=>{
  const secret='a'.repeat(40),bridge=createModelBridge({secret,timeoutMs:2000});await new Promise(resolve=>bridge.server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${bridge.server.address().port}`;
  try{assert.equal((await fetch(url+'/work')).status,401);let r=await fetch(url+'/work',{headers:{Authorization:`Bearer ${secret}`}});assert.equal((await r.json()).job,null);
    const answer=bridge.infer({model:'example',messages:[]});r=await fetch(url+'/work',{headers:{Authorization:`Bearer ${secret}`}});const {job}=await r.json();assert.equal(job.request.model,'example');
    r=await fetch(url+'/result',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({id:job.id,response:{message:{content:'hello'}}})});assert.equal(r.status,200);assert.equal((await answer).message.content,'hello');
  }finally{await bridge.close()}
});
test('requests fail when no worker has connected',()=>{const b=createModelBridge({secret:'b'.repeat(40)});assert.throws(()=>b.infer({}),/offline/)});
test('PC approvals require an active claimed PC job and accept one decision only',async()=>{
 const secret='c'.repeat(40),seen=[],b=createModelBridge({secret,onPcApproval:async(id,summary)=>seen.push({id,summary}),onPcTool:async name=>'live '+name});
 await new Promise(resolve=>b.server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${b.server.address().port}`,headers={Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};
 const request=(route,body)=>fetch(url+route,{headers,...(body?{method:'POST',body:JSON.stringify(body)}:{})});
 try{
 await request('/work');const result=b.infer({kind:'pc',text:'Inspect folder'});const rejection=assert.rejects(result,/cancelled/);
 const {job}=await (await request('/work')).json();
 assert.equal((await request('/approval',{jobId:'wrong',summary:'Do something'})).status,409);
 const {id}=await (await request('/approval',{jobId:job.id,summary:'Inspect folder'})).json();assert.equal(seen[0].summary,'Inspect folder');
 assert.equal((await (await request('/approval/'+id)).json()).decision,null);
 assert.equal(b.decideApproval(id,true),true);assert.equal(b.decideApproval(id,true),false);
 assert.equal((await (await request('/approval/'+id)).json()).decision,'accept');
 assert.equal((await (await request('/tool',{jobId:job.id,operation:'task_report'})).json()).result,'live task_report');
 b.cancelPc();await rejection;
 assert.equal((await (await request('/state/'+job.id)).json()).active,false);
 assert.equal((await request('/approval/'+id)).status,410);
 assert.equal((await request('/tool',{jobId:job.id,operation:'task_report'})).status,409);
 }finally{await b.close();}
});
