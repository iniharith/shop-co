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
