const test=require('node:test'),assert=require('node:assert/strict');
const {resolveDay,taskDayQuery,taskReportIntent,allTaskReport}=require('../task-report');
const {completedDayQuery,completedTaskReport}=require('../task-report');
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
test('work report counts actor design completions instead of task creation date or current status',async()=>{
 const actor='harith',time=new Date('2026-11-05T04:00:00Z');
 const tasks=[
 {title:'Z earlier task',createdAt:new Date('2026-10-01'),status:'PRINT_AWB',activities:[{userId:actor,createdAt:time,action:'changed status from IN DESIGN to DONE DESIGN'},{userId:actor,createdAt:time,action:'changed status from PEMBETULAN to DONE DESIGN'}]},
 {title:'A manual task',status:'IN_PRODUCTION',activities:[{userId:actor,createdAt:time,action:'changed status from IN DESIGN to DONE DESIGN'}]},
 {title:'Other staff',activities:[{userId:'other',createdAt:time,action:'changed status from IN DESIGN to DONE DESIGN'}]},
 {title:'Created today only',createdAt:time,activities:[]}
 ];
 const db={collection:()=>({find:q=>({toArray:async()=>tasks.filter(t=>t.activities.some(a=>{const m=q.activities.$elemMatch;return a.userId===m.userId&&a.createdAt>=m.createdAt.$gte&&a.createdAt<m.createdAt.$lt&&m.action.test(a.action)}))})})};
 const report=await completedTaskReport(db,actor,'2026-11-05');
 assert.match(report,/2 distinct tasks/);assert.ok(report.indexOf('A manual')<report.indexOf('Z earlier'));assert.ok(!report.includes('Created today only'));assert.ok(!report.includes('Other staff'));
 const q=completedDayQuery(actor,'2026-11-05');assert.equal(q.createdAt,undefined);assert.equal(q.status,undefined);
});
