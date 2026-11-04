'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createStationClient}=require('../station-client');
const options={baseUrl:'https://example.test',stationId:'a'.repeat(24),deviceKey:'b'.repeat(64)};
test('station requests are paired, checked for availability, and idempotent per request ID',async()=>{
  let calls=[];const client=createStationClient({...options,fetchImpl:async(url,opts)=>{calls.push({url:String(url),opts});return {ok:true,json:async()=>calls.length===1?{approved:true,pcOnline:true}:{id:'c'.repeat(24),status:'queued'}};}});
  const result=await client.submit('d'.repeat(48),'test-request-123');assert.equal(result.id,'c'.repeat(24));assert.equal(JSON.parse(calls[1].opts.body).requestId,'test-request-123');assert.equal(calls[1].opts.headers['X-Phone-Key'],options.deviceKey);
});
test('offline workstation never receives a job',async()=>{
  let calls=0;const client=createStationClient({...options,fetchImpl:async()=>{calls++;return {ok:true,json:async()=>({approved:true,pcOnline:false})}}});
  await assert.rejects(()=>client.submit('d'.repeat(48)),/offline/);assert.equal(calls,1);
});
test('an ambiguous submission error includes its request ID and is not retried',async()=>{
  let calls=0;const client=createStationClient({...options,fetchImpl:async()=>{if(++calls===1)return {ok:true,json:async()=>({approved:true,pcOnline:true})};throw new Error('network');}});
  await assert.rejects(()=>client.submit('d'.repeat(48),'test-request-123'),/uncertain.*test-request-123/);assert.equal(calls,2);
});
