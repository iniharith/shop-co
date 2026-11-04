'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {pairBot}=require('../lib/bot-pair.cjs');
const stationId='1'.repeat(24),pairSecret='2'.repeat(64),deviceSecret='3'.repeat(64);
test('bot pairing stores the scan credential and requires separate approval',async()=>{
  const calls=[];let saved;
  const result=await pairBot({stationId,ownerId:'owner',api:async(path,method)=>{calls.push([path,method]);return method==='POST'?{secret:pairSecret}:{phoneName:null}},register:async body=>{assert.deepEqual(body,{stationId,secret:pairSecret,phoneName:'Telegram bot'});return {stationId,deviceSecret}},persist:async value=>{saved=value}});
  assert.deepEqual(result,{stationId,approved:false});assert.deepEqual(saved,{stationId,ownerId:'owner',deviceSecret});assert.equal(calls.length,2);
});
test('bot pairing does not replace a paired phone',async()=>{
  let registrations=0;
  await assert.rejects(()=>pairBot({stationId,api:async()=>({phoneName:'Existing phone'}),register:async()=>{registrations++},persist:async()=>{}}),/already paired/);
  assert.equal(registrations,0);
});
test('malformed pairing responses are rejected before credential storage',async()=>{
  let saved=false;
  await assert.rejects(()=>pairBot({stationId,api:async(_path,method)=>method==='POST'?{secret:pairSecret}:{},register:async()=>({stationId,deviceSecret:'bad'}),persist:async()=>{saved=true}}),/Invalid bot pairing response/);
  assert.equal(saved,false);
});
