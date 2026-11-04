'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createAssistant}=require('../assistant');
test('tool calls use real search output and preserve bounded chat context',async()=>{
  let calls=[];const assistant=createAssistant({baseUrl:'http://127.0.0.1:11434',model:'example',tools:{searchTasks:async q=>'Found '+q,websiteStatus:async()=>'Online'},fetchImpl:async(_url,opts)=>{let req=JSON.parse(opts.body);calls.push(req);return {ok:true,json:async()=>({message:calls.length===1?{role:'assistant',tool_calls:[{function:{name:'search_tasks',arguments:{query:'alice'}}}]}:{role:'assistant',content:'Found alice'}})}}});
  assert.equal(await assistant.chat('Find alice'),'Found alice');assert.equal(calls[1].messages.at(-1).content,'Found alice');
});
test('model endpoints must be encrypted unless on the loopback interface',()=>{
  assert.throws(()=>createAssistant({baseUrl:'http://remote.example',model:'test',tools:{}}),/HTTPS/);
});
test('image analysis sends bounded image and accepts only structured search terms',async()=>{
  let req;const a=createAssistant({baseUrl:'http://127.0.0.1:11434',model:'vision',tools:{},fetchImpl:async(_url,opts)=>{req=JSON.parse(opts.body);return {ok:true,json:async()=>({message:{content:JSON.stringify({text:'ORDER 12345',description:'Label',search_terms:['12345',3,'x']})}})}}});
  const result=await a.describeImage(Buffer.from('example'));assert.deepEqual(result.searchTerms,['12345']);assert.equal(req.messages[0].images[0],Buffer.from('example').toString('base64'));
});
