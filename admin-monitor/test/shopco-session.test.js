'use strict';
const test=require('node:test'); const assert=require('node:assert/strict');
const {createSession}=require('../shopco-session');
test('concurrent first requests share a single login and refresh rotates tokens',async()=>{
  let calls=[]; const s=createSession({baseUrl:'https://example.test',email:'bot@example.test',password:'secret',fetchImpl:async(url,opts)=>{calls.push({url:String(url),body:JSON.parse(opts.body)});return {ok:true,json:async()=>({accessToken:'access'+calls.length,refreshToken:'refresh'+calls.length})};}});
  assert.deepEqual(await Promise.all([s.getAccessToken(),s.getAccessToken()]),['access1','access1']);
  assert.equal(calls.length,1); await s.refreshAccessToken(); assert.equal(await s.getAccessToken(),'access2');
  assert.equal(calls[1].body.refreshToken,'refresh1');
});
test('missing credentials fail before a request',async()=>{
  let called=false;const s=createSession({baseUrl:'https://example.test',fetchImpl:async()=>{called=true}});
  await assert.rejects(()=>s.getAccessToken(),/not configured/);assert.equal(called,false);
});
