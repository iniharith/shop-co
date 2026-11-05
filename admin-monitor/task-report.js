'use strict';
function malaysiaDay(now=new Date()) {return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
function resolveDay(value='today',now=new Date()){
 const text=String(value).trim().toLowerCase(),today=malaysiaDay(now);
 if(['today','hari ini'].includes(text))return today;
 if(['yesterday','semalam'].includes(text))return malaysiaDay(new Date(Date.parse(today+'T00:00:00+08:00')-86400000));
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text)||!Number.isFinite(Date.parse(text+'T00:00:00Z'))||new Date(text+'T00:00:00Z').toISOString().slice(0,10)!==text)throw Error('Use today, yesterday, or YYYY-MM-DD');
 return text;
}
function taskDayQuery(day){const start=new Date(resolveDay(day)+'T00:00:00+08:00');return {isDeleted:{$ne:true},createdAt:{$gte:start,$lt:new Date(+start+86400000)}};}
function taskReportIntent(text){
 if(!/\b(?:tasks?|tugas)\b/i.test(text)||/\b(?:production|uploads?|uploaded|muat naik)\b/i.test(text))return null;
 return text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0]||text.match(/\b(?:yesterday|today|semalam|hari ini)\b/i)?.[0]||null;
}
async function allTaskReport(db,value,now=new Date()){
 const day=resolveDay(value,now);
 const tasks=await db.collection('tasks').find(taskDayQuery(day),{projection:{title:1,status:1},maxTimeMS:10000}).toArray();
 tasks.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),undefined,{sensitivity:'base'}));
 return `All tasks created on ${day} (Malaysia time)\n${tasks.length} tasks · all statuses · alphabetical\n\n`+(tasks.map(t=>`• ${t.title||'(untitled)'} — ${t.status||'Unknown'}`).join('\n')||'No tasks were created on this date.');
}
function completedDayQuery(actor,day){
 const window=taskDayQuery(day).createdAt;
 return {activities:{$elemMatch:{userId:actor,createdAt:window,action:/^changed status from .+ to DONE DESIGN$/}}};
}
async function completedTaskReport(db,actor,value='today',now=new Date()){
 const day=resolveDay(value,now);
 const tasks=await db.collection('tasks').find(completedDayQuery(actor,day),{projection:{title:1,status:1,isDeleted:1},maxTimeMS:10000}).toArray();
 tasks.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),undefined,{sensitivity:'base'}));
 return `HARITH completed designs — ${day} (Malaysia time)\n${tasks.length} distinct tasks · all current statuses · alphabetical\nCounted when HARITH moved the task to DONE DESIGN on this date, including tasks created earlier.\n\n`+(tasks.map(t=>`• ${t.title||'(untitled)'} — ${t.status||'Unknown'}${t.isDeleted?' (in Trash)':''}`).join('\n')||'No recorded design completions on this date.');
}
module.exports={resolveDay,taskDayQuery,taskReportIntent,allTaskReport,completedDayQuery,completedTaskReport};
