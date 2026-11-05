const test=require('node:test'),assert=require('node:assert/strict');
const {resolveDay,taskDayQuery,taskReportIntent,allTaskReport}=require('../task-report');
test('relative days respect Malaysia midnight and reject invalid calendar dates',()=>{
 const now=new Date('2026-11-04T17:00:00Z');assert.equal(resolveDay('today',now),'2026-11-05');assert.equal(resolveDay('yesterday',now),'2026-11-04');
 assert.throws(()=>resolveDay('2026-02-30'));assert.throws(()=>resolveDay('bad'));
});
test('yesterday task question selects all-task report, never Production or upload scope',()=>{
 assert.equal(taskReportIntent('what yesterday task'),'yesterday');assert.equal(taskReportIntent('show all tasks today'),'today');
 assert.equal(taskReportIntent('Production tasks yesterday'),null);assert.equal(taskReportIntent('HARITH uploaded tasks yesterday'),null);
 const q=taskDayQuery('2026-11-04');assert.equal(q.createdAt.$gte.toISOString(),'2026-11-03T16:00:00.000Z');assert.equal(q.createdAt.$lt.toISOString(),'2026-11-04T16:00:00.000Z');assert.equal(q.status,undefined);assert.equal(q.assignee,undefined);
});
test('all-task report includes manual tasks across statuses and sorts alphabetically',async()=>{
 let filter;const db={collection:name=>{assert.equal(name,'tasks');return {find:q=>{filter=q;return {toArray:async()=>[{title:'Z manual',status:'PLACED'},{title:'A website',status:'SHIPPED'}]}}}}};
 const text=await allTaskReport(db,'yesterday',new Date('2026-11-05T06:00:00Z'));
 assert.match(text,/2 tasks/);assert.ok(text.indexOf('A website')<text.indexOf('Z manual'));assert.equal(filter.isDeleted.$ne,true);
});
