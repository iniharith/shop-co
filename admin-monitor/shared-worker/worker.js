'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {CodexPc}=require('./codex-pc');
const configDir=process.env.OWNER_CHAT_CONFIG_DIR||'C:/ProgramData/KampungCetak/SharedAssistant';
const config=JSON.parse(fs.readFileSync(path.join(configDir,'settings.json'),'utf8'));
const psEnv={...process.env};delete psEnv.PSModulePath;
const secret=execFileSync('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop'; $s=(Get-Content -LiteralPath 'C:\\ProgramData\\KampungCetak\\SharedAssistant\\secret.dpapi' -Raw).Trim() | ConvertTo-SecureString; $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try { [Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }"],{encoding:'utf8',windowsHide:true,env:psEnv,stdio:['ignore','pipe','pipe']});
if(!secret||secret.length<32||new URL(config.baseUrl).protocol!=='https:')throw Error('Invalid shared assistant configuration');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function health(state){fs.writeFileSync(path.join(configDir,'health.json'),JSON.stringify({updatedAt:new Date().toISOString(),pid:process.pid,state}));}
async function api(endpoint,body){const response=await fetch(new URL('/api/owner-chat'+endpoint,config.baseUrl),{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Assistant API returned '+response.status);return response.json();}
const pc=new CodexPc({executable:config.codexExecutable,cwd:config.cwd,stateFile:path.join(configDir,'codex-session.json')});
async function saveHandoff(){const result=await api('/');fs.mkdirSync(path.dirname(config.handoffPath),{recursive:true});fs.writeFileSync(config.handoffPath,'# Shared Website / Telegram conversation\n\nUpdated '+new Date().toISOString()+'\n\nCodex thread: '+(result.codexThreadId||'(not started)')+'\n\n'+result.messages.map(m=>`## ${m.role} · ${m.source} · ${m.status}\n\n${m.text}`).join('\n\n'));}
async function main(){
 let idleHeartbeat=0;
 for(;;){try{
  if(Date.now()-idleHeartbeat>10000){await api('/worker/heartbeat',{});idleHeartbeat=Date.now();health('connected');}
  const {job}=await api('/worker/claim');if(!job){await sleep(2500);continue;}
  const controller=new AbortController(),identity={messageId:String(job._id),leaseToken:job.leaseToken};health('working');
  let renewing=false;
  const renewal=setInterval(()=>{if(renewing)return;renewing=true;void api('/worker/heartbeat',identity).then(r=>{health('working');if(!r.active)controller.abort();}).catch(()=>controller.abort()).finally(()=>{renewing=false;});},10000);
  const timeout=setTimeout(()=>controller.abort(),20*60000);
  let result;
  try{
   const answer=await pc.run(job.text,{signal:controller.signal,onTool:async request=>(await api('/worker/tool',{...identity,...request})).result,onApproval:async request=>{
    const prompt=[request.method,request.reason,request.command,request.cwd,request.grantRoot,request.changes?JSON.stringify(request.changes):''].filter(Boolean).join('\n').slice(0,12000);
    const {message}=await api('/worker/approval',{...identity,prompt,approvalId:require('node:crypto').randomUUID()});
    for(;;){if(controller.signal.aborted)return false;const state=await api('/worker/state',{...identity,approvalMessageId:String(message._id)});if(!state.active){controller.abort();return false;}if(state.decision)return state.decision==='accept';await sleep(1500);}
   }});
   result={...identity,text:answer.slice(0,30000),codexThreadId:pc.threadId};
  }catch{result={...identity,failed:true,text:'The PC request failed or was cancelled. Check any work already performed before retrying.',codexThreadId:pc.threadId};}
  try{await api('/worker/result',result);await saveHandoff();}catch{console.error('Could not confirm result delivery. The request will not be automatically repeated.');}
  finally{clearInterval(renewal);clearTimeout(timeout);health('connected');}
 }catch{health('reconnecting');console.error('Shared assistant connection unavailable; retrying.');await sleep(5000);}}
}
process.on('SIGTERM',()=>{pc.close();process.exit(0);});
process.on('SIGINT',()=>{pc.close();process.exit(0);});
main().catch(()=>{pc.close();health('stopped');process.exit(1);});
