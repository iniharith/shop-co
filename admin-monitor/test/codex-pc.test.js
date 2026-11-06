const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events'),{PassThrough,Writable}=require('node:stream'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {CodexPc}=require('../codex-pc');
const {resolveExecutable}=require('../codex-pc');
test('Codex app update recovers an executable whose old version directory was removed',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kc-codex-bin-'));
 try{const current=path.join(root,'new-version');fs.mkdirSync(current);const exe=path.join(current,'codex.exe');fs.writeFileSync(exe,'test');
 assert.equal(resolveExecutable(path.join(root,'removed-version','codex.exe')),exe);
 assert.equal(resolveExecutable(exe),exe);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
function fixture(){
 const proc=new EventEmitter();proc.stdout=new PassThrough();proc.stderr=new PassThrough();proc.kill=()=>proc.emit('exit');
 const sent=[];const emit=m=>proc.stdout.write(JSON.stringify(m)+'\n');
 proc.stdin=new Writable({write(chunk,_encoding,done){const m=JSON.parse(chunk);sent.push(m);if(m.method==='initialize')emit({id:m.id,result:{}});if(m.method==='thread/start')emit({id:m.id,result:{thread:{id:'thread'}}});if(m.method==='turn/start')emit({id:m.id,result:{turn:{id:'turn'}}});if(m.method==='turn/interrupt')emit({id:m.id,result:{}});done();}});
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kc-codex-test-'));
 const pc=new CodexPc({executable:'mock',cwd:dir,stateFile:path.join(dir,'session.json'),spawnImpl:()=>proc});
 return {pc,emit,sent,cleanup:()=>{pc.close();fs.rmSync(dir,{recursive:true,force:true});}};
}
const ready=()=>new Promise(resolve=>setImmediate(resolve));
test('PC session preserves sandbox and relays approval rather than auto-accepting',async()=>{
 const r=fixture();try{
 let approve;const result=r.pc.run('Inspect a folder',{onApproval:()=>new Promise(resolve=>approve=resolve)});await ready();
 const start=r.sent.find(m=>m.method==='thread/start');assert.equal(start.params.sandbox,'workspace-write');assert.equal(start.params.approvalPolicy,'on-request');assert.equal(start.params.approvalsReviewer,'user');
 r.emit({id:100,method:'item/commandExecution/requestApproval',params:{threadId:'thread',command:'outside command'}});await ready();
 assert.equal(r.sent.find(m=>m.id===100),undefined);approve(false);await ready();assert.equal(r.sent.find(m=>m.id===100).result.decision,'decline');
 r.emit({method:'item/completed',params:{threadId:'thread',item:{type:'agentMessage',text:'Finished checking.'}}});r.emit({method:'turn/completed',params:{threadId:'thread',turn:{status:'completed'}}});assert.equal(await result,'Finished checking.');
 }finally{r.cleanup();}
});
test('PC cancellation interrupts the active turn and rejects the job',async()=>{
 const r=fixture();try{const c=new AbortController(),result=r.pc.run('Work',{signal:c.signal,onApproval:async()=>false});await ready();c.abort();await assert.rejects(result,/cancelled/);assert.ok(r.sent.some(m=>m.method==='turn/interrupt'));}finally{r.cleanup();}
});
test('Shop-Co tool returns live callback data without sharing account credentials',async()=>{
 const r=fixture();try{const result=r.pc.run('Find tasks',{onApproval:async()=>false,onTool:async args=>'Result '+args.operation});await ready();
 r.emit({id:101,method:'item/tool/call',params:{threadId:'thread',tool:'shopco',arguments:{operation:'task_report',arguments:{day:'yesterday'}}}});await ready();
 assert.equal(r.sent.find(m=>m.id===101).result.contentItems[0].text,'Result task_report');
 r.emit({method:'turn/completed',params:{threadId:'thread',turn:{status:'completed'}}});await result;
 }finally{r.cleanup();}
});
