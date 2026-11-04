'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createShopCoClient,validateChanges}=require('../shopco-client');
test('only supported task changes may pass',()=>{
  assert.deepEqual(validateChanges({status:'PRINT_AWB',title:'Example'}),{status:'PRINT_AWB',title:'Example'});
  assert.throws(()=>validateChanges({isDeleted:true}));
  assert.throws(()=>validateChanges({status:'UNKNOWN'}));
  assert.throws(()=>validateChanges({title:''}));
});
test('updates use authenticated API and require the previously read version',async()=>{
  const calls=[]; const client=createShopCoClient({baseUrl:'https://example.test',getAccessToken:async()=> 'token',fetchImpl:async (url,options)=>{calls.push({url:String(url),options});return {ok:true,json:async()=>({task:{title:'Example'}})};}});
  await assert.rejects(()=>client.updateTask('0123456789abcdef01234567',{status:'PRINT_AWB'}));
  await client.updateTask('0123456789abcdef01234567',{status:'PRINT_AWB'},'2026-11-04T00:00:00Z');
  assert.equal(calls[0].options.method,'PUT'); assert.equal(calls[0].options.headers.Authorization,'Bearer token');
  assert.deepEqual(JSON.parse(calls[0].options.body),{status:'PRINT_AWB',expectedUpdatedAt:'2026-11-04T00:00:00Z'});
});
test('a conflict is surfaced rather than retried',async()=>{
  const client=createShopCoClient({baseUrl:'https://example.test',getAccessToken:async()=> 'token',fetchImpl:async()=>({ok:false,status:409,json:async()=>({})})});
  await assert.rejects(()=>client.updateTask('0123456789abcdef01234567',{status:'PRINT_AWB'},'2026-11-04T00:00:00Z'),/changed since/);
});
