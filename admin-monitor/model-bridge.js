'use strict';
const http=require('node:http');const crypto=require('node:crypto');
const MAX_BODY=16*1024*1024;
function createModelBridge({secret,timeoutMs=180000,maxPending=4,onPcApproval,onPcTool}){
  if(typeof secret!=='string'||secret.length<32)throw new Error('Model bridge secret must be at least 32 characters');
  const pending=new Map(),approvals=new Map();let lastWorkerAt=0,lastWorkerId=null;
  function authorized(value){const expected=Buffer.from(`Bearer ${secret}`),actual=Buffer.from(value||'');return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual);}
  async function body(req){let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw new Error('Body too large');chunks.push(chunk)}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
  function send(res,status,data){const out=JSON.stringify(data);res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(out);}
  const server=http.createServer(async(req,res)=>{
    if(!authorized(req.headers.authorization))return send(res,401,{error:'Unauthorized'});
    try {
      if(req.method==='GET'&&req.url==='/health')return send(res,200,{ok:true,...workerStatus()});
      if(req.method==='GET'&&req.url==='/work'){
        const workerId=String(req.headers['x-worker-id']||'legacy').slice(0,100);
        if(lastWorkerId!==null&&lastWorkerId!==workerId){
          for(const [id,job]of pending)if(job.claimed&&job.workerId!==workerId){
            pending.delete(id);clearTimeout(job.timer);
            for(const [approvalId,a]of approvals)if(a.jobId===id)approvals.delete(approvalId);
            job.reject(new Error('PC worker restarted; the previous task was interrupted. Check for partial side effects before retrying.'));
          }
        }
        lastWorkerId=workerId;lastWorkerAt=Date.now();const entry=[...pending.values()].find(x=>!x.claimed);
        if(!entry)return send(res,200,{job:null});entry.claimed=true;entry.workerId=workerId;return send(res,200,{job:{id:entry.id,request:entry.request}});
      }
      if(req.method==='POST'&&req.url==='/tool'){
        const data=await body(req),job=pending.get(data.jobId);
        if(!job?.claimed||job.request.kind!=='pc'||!onPcTool)return send(res,409,{error:'No active PC job'});
        const result=await onPcTool(data.operation,data.arguments||{});
        return send(res,200,{result});
      }
      if(req.method==='POST'&&req.url==='/approval'){
        const data=await body(req),job=pending.get(data.jobId);
        if(!job?.claimed||job.request.kind!=='pc'||!onPcApproval)return send(res,409,{error:'No active PC job'});
        const id=crypto.randomBytes(12).toString('hex');
        if([...approvals.values()].filter(a=>a.jobId===data.jobId).length>=4)return send(res,429,{error:'Approval queue full'});
        const summary=String(data.summary||'PC action').slice(0,4000);
        approvals.set(id,{jobId:data.jobId,decision:null});
        try{await onPcApproval(id,summary);}catch{approvals.delete(id);return send(res,503,{error:'Could not deliver approval'});}
        return send(res,200,{id});
      }
      if(req.method==='GET'&&/^\/approval\/[a-f0-9]{24}$/.test(req.url)){
        const id=req.url.split('/').pop(),entry=approvals.get(id);
        if(!entry||!pending.has(entry.jobId))return send(res,410,{error:'Approval expired'});
        return send(res,200,{decision:entry.decision});
      }
      if(req.method==='GET'&&req.url.startsWith('/state/')){lastWorkerAt=Date.now();return send(res,200,{active:pending.has(req.url.slice(7))});}
      if(req.method==='POST'&&req.url==='/result'){
        const result=await body(req);const entry=pending.get(result.id);
        if(!entry||!entry.claimed)return send(res,404,{error:'Job expired'});
        pending.delete(result.id);clearTimeout(entry.timer);for(const [id,a]of approvals)if(a.jobId===result.id)approvals.delete(id);
        if(result.error)entry.reject(new Error('Local model worker failed'));else if(!result.response||typeof result.response!=='object')entry.reject(new Error('Invalid local model response'));else entry.resolve(result.response);
        return send(res,200,{ok:true});
      }
      return send(res,404,{error:'Not found'});
    }catch{return send(res,400,{error:'Invalid request'});}
  });
  function infer(request){
    if(!lastWorkerAt||Date.now()-lastWorkerAt>30000)throw new Error('Local model worker is offline');
    if(pending.size>=maxPending)throw new Error('Local model queue is busy');
    if(Buffer.byteLength(JSON.stringify(request))>MAX_BODY)throw new Error('Model request too large');
    const id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Local model timed out'));},request.kind==='pc'?900000:timeoutMs);pending.set(id,{id,request,resolve,reject,timer,claimed:false});});
  }
  function close(){for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(new Error('Model bridge stopped'));}pending.clear();return new Promise(resolve=>server.close(resolve));}
  function decideApproval(id,accept){const a=approvals.get(id);if(!a||!pending.has(a.jobId)||a.decision!==null)return false;a.decision=accept?'accept':'decline';return true;}
  function cancelPc(){for(const [id,e]of pending)if(e.request.kind==='pc'){pending.delete(id);clearTimeout(e.timer);e.reject(new Error('PC task cancelled. Check the PC before retrying any side effect.'));}}
  function workerStatus(){return {online:!!lastWorkerAt&&Date.now()-lastWorkerAt<30000,lastSeenAt:lastWorkerAt||null};}
  return {server,infer,close,decideApproval,cancelPc,workerStatus};
}
module.exports={createModelBridge};
