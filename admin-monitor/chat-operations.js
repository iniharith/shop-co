'use strict';
const {randomBytes}=require('node:crypto');
const {validateChanges}=require('./shopco-client');

function createChatOperations({shopco,station,report,today,enabled,now=Date.now}) {
  let pending;
  function day(value){return !value||value==='today'?today():value;}
  function prepare(summary,execute){
    if(!enabled())throw new Error('Persistent bot state is required before enabling actions');
    const id=randomBytes(8).toString('hex');
    pending={id,summary,execute,expires:now()+10*60000};
    return `Prepared only; nothing has executed.\n${summary}\nSend /confirm ${id} within 10 minutes, or /cancel. This replaces any previous proposal.`;
  }
  async function run(name,args={}){
    if(name==='upload_report')return report(day(args.day));
    if(name==='production_preview'){
      const date=day(args.day),tasks=await shopco.productionTasks(date);
      return `Production — ${date} (Malaysia time): ${tasks.length} tasks\n`+tasks.map(t=>`${t.name} | ID: ${t.id}`).join('\n');
    }
    if(name==='station_job_status')return JSON.stringify(await station.status(args.jobId));
    if(name==='prepare_task_update'){
      const changes=validateChanges(args.changes),task=await shopco.getTask(args.taskId);
      return prepare(`Update ${task.title} (${task._id}): ${JSON.stringify(changes)}`,async()=>{
        const result=await shopco.updateTask(args.taskId,changes,task.updatedAt);
        return `Updated: ${result.title}\nStatus: ${result.status}\nID: ${result._id}`;
      });
    }
    if(name==='prepare_awb'){
      const task=await shopco.getTask(args.taskId);
      return prepare(`Queue AWB for ${task.title} on the paired Windows PC.`,async()=>{
        const qr=await shopco.getTaskQr(args.taskId),job=await station.submit(qr);
        return `Queued AWB. Job: ${job.id}. Use /awbstatus ${job.id}. Physical printing is not confirmed.`;
      });
    }
    if(name==='prepare_production'){
      if(typeof args.folder!=='string'||!/^[a-z0-9_-]{1,64}$/i.test(args.folder))throw new Error('Choose a simple folder name using letters, digits, underscores or hyphens, under the PC download root');
      const date=day(args.day),folder=args.folder,tasks=await shopco.productionTasks(date);
      if(!tasks.length||tasks.length>100)throw new Error('Production batch must contain 1–100 tasks');
      const ids=tasks.map(t=>t.id).sort();
      const requestId='chat-'+randomBytes(16).toString('hex');
      return prepare(`Production ${date}: ${tasks.length} tasks → ${folder}. Download For Print and DRAFT, print drafts four per A4, and move downloaded tasks to PRINT_AWB.\n${tasks.map(t=>t.name).join('\n')}`,async()=>{
        const current=(await shopco.productionTasks(date)).map(t=>t.id).sort();
        if(JSON.stringify(ids)!==JSON.stringify(current))throw new Error('Production queue changed; request a fresh preview');
        const tokens=[];for(const id of ids)tokens.push(await shopco.getTaskQr(id));
        const job=await station.submitBatch(tokens,folder,requestId);
        return `Queued ${ids.length} tasks. Job: ${job.id}. Use /awbstatus ${job.id}. This is not confirmation of completed downloads or physical printing.`;
      });
    }
    throw new Error('Unsupported operation');
  }
  async function confirm(id){
    if(!pending||pending.id!==id||pending.expires<=now())throw new Error('Proposal expired or does not match; request a new action');
    if(!enabled())throw new Error('Persistent bot state is unavailable');
    const action=pending;pending=null; // Consume before side effects; never retry uncertain print submissions.
    return action.execute();
  }
  return {run,confirm,cancel:()=>{pending=null;return 'Pending action cancelled.';}};
}
module.exports={createChatOperations};
