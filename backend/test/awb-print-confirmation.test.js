const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePrintPlan, validatePrintReceipts, confirmAwbPrintJob, hashPrintSecret } = require('../dist/shared/utils/awbPrintConfirmation');
const { Task } = require('../dist/domain/entities/Task');
const { AwbPrintJob } = require('../dist/domain/entities/AwbPrintJob');
const tag = '0123456789abcdef', token = 'a'.repeat(48), id = 'b'.repeat(24), secret = 'c'.repeat(48);
const receipt = `{00,00001,${tag}}`;
const manifest = { labels: [{ id: 'label1', version: 'v1' }, { id: 'label2', version: 'v2' }] };
const valid = [{ id: 'label1', version: 'v1', pages: 2 }, { id: 'label2', version: 'v2', pages: 1 }];

test('print plan requires all current AWBs and valid page counts', () => {
  assert.deepEqual(validatePrintPlan(manifest, valid), valid);
  for (const invalid of [[], valid.slice(0,1), [valid[0], valid[0]], [{...valid[0], pages:0}, valid[1]], [{...valid[0], pages:1.1}, valid[1]]])
    assert.throws(() => validatePrintPlan(manifest, invalid));
  assert.throws(() => validatePrintPlan(manifest, [{...valid[0],version:'old'},valid[1]]), /changed/);
});
test('all pages require matching successful completion receipts', () => {
  assert.deepEqual(validatePrintReceipts([tag],[receipt]),[receipt]);
  for (const bad of [[], ['ready'], ['OK'], ['sent'], ['{00,00001,ffffffffffffffff}'], [`{04,00001,${tag}}`], [`{00,00000,${tag}}`], [`{00,00002,${tag}}`]])
    assert.throws(() => validatePrintReceipts([tag],bad));
  assert.throws(() => validatePrintReceipts([tag,'ffffffffffffffff'],[receipt]), /Every/);
});

test('unconfirmed printer output cannot invoke a task update', async () => {
  const originalTaskFind=Task.findOne, originalJobFind=AwbPrintJob.findOne, originalUpdate=Task.findOneAndUpdate;
  let updates=0;
  Task.findOne=()=>({select(){return this;},lean:async()=>({_id:'task1',status:'PACKAGING'})});
  AwbPrintJob.findOne=()=>({select(){return this;},lean:async()=>({secretHash:hashPrintSecret(secret),pages:[tag],state:'pending'})});
  Task.findOneAndUpdate=()=>{updates++;throw new Error('Must not update');};
  try {
    for (const receipts of [[],['ready'],[`{04,00001,${tag}}`]])
      await assert.rejects(confirmAwbPrintJob(token,id,{secret,receipts}));
    assert.equal(updates,0);
  } finally {Task.findOne=originalTaskFind;AwbPrintJob.findOne=originalJobFind;Task.findOneAndUpdate=originalUpdate;}
});
test('completion retry after an already-applied task update never ships twice or revalidates changed files', async () => {
  const originalTaskFind=Task.findOne, originalJobFind=AwbPrintJob.findOne, originalJobUpdate=AwbPrintJob.updateOne, originalUpdate=Task.findOneAndUpdate;
  let writes=0, jobWrites=0;
  Task.findOne=query=>({select(){return this;},lean:async()=>query.awbPrintJobIds?{status:'IN_TRANSIT'}:{_id:'task1',status:'IN_TRANSIT'}});
  AwbPrintJob.findOne=()=>({select(){return this;},lean:async()=>({secretHash:hashPrintSecret(secret),pages:[tag],state:'pending'})});
  AwbPrintJob.updateOne=async()=>{jobWrites++;};
  Task.findOneAndUpdate=()=>{writes++;throw new Error('Must not regress status');};
  try {
    const result=await confirmAwbPrintJob(token,id,{secret,receipts:[receipt]});
    assert.equal(result.status,'IN_TRANSIT');assert.equal(result.alreadyConfirmed,true);assert.equal(writes,0);assert.equal(jobWrites,1);
  } finally {Task.findOne=originalTaskFind;AwbPrintJob.findOne=originalJobFind;AwbPrintJob.updateOne=originalJobUpdate;Task.findOneAndUpdate=originalUpdate;}
});
test('confirmed jobs are idempotent and cancelled tasks cannot be shipped', async () => {
  const originalTaskFind=Task.findOne, originalJobFind=AwbPrintJob.findOne, originalUpdate=Task.findOneAndUpdate;
  let state='confirmed', updates=0;
  Task.findOne=query=>({select(){return this;},lean:async()=>query.awbPrintJobIds?null:{_id:'task1',status:'CANCELLED'}});
  AwbPrintJob.findOne=()=>({select(){return this;},lean:async()=>({secretHash:hashPrintSecret(secret),pages:[tag],state})});
  Task.findOneAndUpdate=()=>{updates++;throw new Error('Must not update');};
  try {
    assert.equal((await confirmAwbPrintJob(token,id,{secret,receipts:[receipt]})).alreadyConfirmed,true);
    state='pending';await assert.rejects(confirmAwbPrintJob(token,id,{secret,receipts:[receipt]}), /changed/);
    assert.equal(updates,0);
  } finally {Task.findOne=originalTaskFind;AwbPrintJob.findOne=originalJobFind;Task.findOneAndUpdate=originalUpdate;}
});

test('complete current AWB proof atomically records SHIPPED, history and audit evidence', async () => {
  const originals={find:Task.findOne,update:Task.findOneAndUpdate,jobFind:AwbPrintJob.findOne,jobUpdate:AwbPrintJob.updateOne};
  let mutation, marked;
  Task.findOne=query=>({select(){return this;},lean:async()=>query.awbPrintJobIds?null:{_id:'task1',status:'PACKAGING'}});
  AwbPrintJob.findOne=()=>({select(){return this;},lean:async()=>({secretHash:hashPrintSecret(secret),pages:[tag],labels:[{id:'label1',version:'v1',pages:1}],printer:'1324D',state:'pending'})});
  Task.findOneAndUpdate=(filter,pipeline)=>{mutation={filter,pipeline};return {lean:async()=>({_id:'task1',status:'SHIPPED'})};};
  AwbPrintJob.updateOne=async(filter,update)=>{marked=update.$set;};
  try {
    const result=await confirmAwbPrintJob(token,id,{secret,receipts:[receipt]},async()=>({labels:[{id:'label1',version:'v1'}]}));
    assert.equal(result.status,'SHIPPED');assert.equal(result.changed,true);
    assert.equal(mutation.filter.awbPrintJobIds.$ne,id);
    assert.ok(mutation.filter.status.$nin.includes('CANCELLED'));
    const data=mutation.pipeline[0].$set;
    assert.equal(data.status,'SHIPPED');assert.ok(data.awbPrintedAt instanceof Date);
    assert.deepEqual(data.awbPrintJobIds.$concatArrays[1],[id]);
    assert.equal(data.statusHistory.$concatArrays[1].$cond[2][0].toStatus,'SHIPPED');
    assert.equal(data.activities.$concatArrays[1][0].action,'AWB_PRINT_CONFIRMED');
    assert.equal(marked.state,'confirmed');assert.deepEqual(marked.receipts,[receipt]);
  } finally {Task.findOne=originals.find;Task.findOneAndUpdate=originals.update;AwbPrintJob.findOne=originals.jobFind;AwbPrintJob.updateOne=originals.jobUpdate;}
});
