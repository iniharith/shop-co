'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {pairBot}=require('../lib/bot-pair.cjs');
const stationId='1'.repeat(24),pairSecret='2'.repeat(64),deviceSecret='3'.repeat(64);
test('bot pairing stores the scan credential and requires separate approval',async()=>{
  const calls=[];let saved;
  const result=await pairBot({stationId,ownerId:'owner',api:async(path,method)=>{calls.push([path,method]);return method==='POST'?{secret:pairSecret}:{phoneName:'existing',supportsSeparateBot:true}},register:async body=>{assert.deepEqual(body,{stationId,secret:pairSecret,phoneName:'Telegram bot'});return {stationId,deviceSecret}},persist:async value=>{saved=value}});
  assert.deepEqual(result,{stationId,approved:false});assert.deepEqual(saved,{stationId,ownerId:'owner',deviceSecret});assert.equal(calls.length,2);
});
test('bot pairing does not replace an existing bot',async()=>{
  let registrations=0;
  await assert.rejects(()=>pairBot({stationId,api:async()=>({phoneName:'Existing phone',botPaired:true,supportsSeparateBot:true}),register:async()=>{registrations++},persist:async()=>{}}),/already paired/);
  assert.equal(registrations,0);
});
test('older single-device backends fail closed before any pairing request',async()=>{
  let calls=0;
  await assert.rejects(()=>pairBot({stationId,api:async()=>{calls++;return {phoneName:'Existing phone'}},register:async()=>{throw new Error('unexpected')},persist:async()=>{}}),/updated/);
  assert.equal(calls,1);
});
test('malformed pairing responses are rejected before credential storage',async()=>{
  let saved=false;
  await assert.rejects(()=>pairBot({stationId,api:async(_path,method)=>method==='POST'?{secret:pairSecret}:{supportsSeparateBot:true},register:async()=>({stationId,deviceSecret:'bad'}),persist:async()=>{saved=true}}),/Invalid bot pairing response/);
  assert.equal(saved,false);
});
