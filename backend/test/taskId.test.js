const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const { isTaskId, uploadTaskId, validateTaskIdParam } = require('../dist/shared/utils/taskId');
const valid = '0123456789abcdef01234567';
const invalid = [undefined, null, 'undefined', 'null', '', ' ', {}, [], '123', '123456789012', 'z'.repeat(24)];

test('task IDs reject missing/stringified values and retain valid database IDs', () => {
  for (const value of invalid) assert.equal(isTaskId(value), false);
  assert.equal(isTaskId(valid), true);assert.equal(isTaskId(valid.toUpperCase()),true);
});

test('task upload rejects tasks/undefined and mismatched scope before database/S3 work', () => {
  assert.equal(uploadTaskId(undefined,undefined),undefined);
  assert.equal(uploadTaskId(undefined,'customer-folder'),undefined);
  assert.equal(uploadTaskId(undefined,`tasks/${valid}`),valid);
  assert.equal(uploadTaskId(valid,`tasks/${valid}`),valid);
  for (const folder of ['tasks/undefined','tasks/null','tasks/','tasks/123']) assert.throws(()=>uploadTaskId(undefined,folder),/Task ID/);
  for (const value of invalid.filter(v=>v!==undefined&&v!==null&&v!=='')) assert.throws(()=>uploadTaskId(value,undefined),/Task ID/);
  assert.throws(()=>uploadTaskId(valid,`tasks/${'a'.repeat(24)}`),/Task ID/);
});

test('task route guard returns clear 400 and stops the handler for invalid IDs', () => {
  for (const value of invalid) {
    let proceeded=false;
    const res={status(code){this.code=code;return this;},json(body){this.body=body;}};
    validateTaskIdParam({},res,()=>{proceeded=true;},value);
    assert.equal(res.code,400);assert.equal(res.body.code,'INVALID_TASK_ID');assert.equal(proceeded,false);
  }
  let proceeded=false;validateTaskIdParam({}, {},()=>{proceeded=true;},valid);assert.equal(proceeded,true);
});

function load(relative, requireModule) {
  const exports={};
  const source=fs.readFileSync(path.join(__dirname,relative),'utf8');
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:requireModule});
  return exports;
}
const taskId = load('../admin/src/utils/taskId.ts',()=>{throw Error('Unexpected dependency');});

test('admin rejects invalid task saves/uploads before HTTP or sending any file bytes', async()=>{
  const calls=[];
  const api=load('../admin/src/api/tasks.ts',name=>{
    if(name==='@/utils/taskId')return taskId;
    if(name==='@/utils/axios')return {default:()=>({get:async(...args)=>{calls.push(['get',...args]);return {data:{success:true}};},put:async(...args)=>{calls.push(['put',...args]);return {data:{success:true}};},post:async(...args)=>{calls.push(['post',...args]);return {data:{success:true}};}})};
    if(name==='@/utils/s3Upload')return {uploadToS3Directly:async()=>{calls.push(['upload']);return {};}};
    throw Error(name);
  });
  for(const value of invalid){
    await assert.rejects(api.updateTask('token',value,{title:'draft'}),/Task ID/);
    await assert.rejects(api.uploadTaskFile('token',value,{name:'art.pdf'}),/Task ID/);
  }
  assert.equal(calls.length,0);
  await api.updateTask('token',valid,{title:'updated'});
  assert.equal(calls[0][1],`/api/tasks/${valid}`);
});

test('generic admin upload catches malformed task folders before requesting upload URLs',async()=>{
  let requests=0;
  const upload=load('../admin/src/utils/s3Upload.ts',name=>{
    if(name==='./taskId')return taskId;
    if(name==='./duplicateUpload')return {requestUploadUrl:async()=>{requests++;throw Error('Must not request');}};
    if(name==='./axios')return {default:()=>{throw Error('Must not request');}};
    throw Error(name);
  });
  await assert.rejects(upload.uploadToS3Directly('token',{name:'art.pdf'},'tasks/undefined'),/Task ID/);
  await assert.rejects(upload.uploadToS3Directly('token',{name:'art.pdf'},undefined,undefined,undefined,{taskId:'undefined'}),/Task ID/);
  assert.equal(requests,0);
});
