const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {Task}=require('../dist/domain/entities/Task');
const {TaskRepository,TaskStatusConflictError}=require('../dist/infrastructure/repositories/TaskRepository');

test('task Undo rejects an intervening edit before issuing any database write',async()=>{
 const old={find:Task.findById,update:Task.findOneAndUpdate};let writes=0;
 Task.findById=()=>({select(){return this;},read(){return this;},lean:async()=>({status:'SHIPPED',isDone:false,updatedAt:new Date('2026-10-17T02:01:00Z')})});
 Task.findOneAndUpdate=()=>{writes++;throw Error('Must not write');};
 try{await assert.rejects(new TaskRepository().update('task',{status:'PACKAGING'},'2026-10-17T02:00:00Z'),TaskStatusConflictError);assert.equal(writes,0);}
 finally{Task.findById=old.find;Task.findOneAndUpdate=old.update;}
});
test('task Undo atomically guards the applied version and records the reverse status transition',async()=>{
 const old={find:Task.findById,update:Task.findOneAndUpdate};let write;
 const version=new Date('2026-10-17T02:00:00Z');
 Task.findById=()=>({select(){return this;},read(){return this;},lean:async()=>({status:'SHIPPED',isDone:false,updatedAt:version})});
 Task.findOneAndUpdate=(filter,change)=>{write={filter,change};return Promise.resolve({_id:'task',status:'PACKAGING'});};
 try{
  const result=await new TaskRepository().update('task',{status:'PACKAGING'},version.toISOString());
  assert.equal(result.status,'PACKAGING');assert.equal(result.$locals.previousWorkflow.status,'SHIPPED');assert.equal(+write.filter.updatedAt,+version);assert.equal(write.filter.status,'SHIPPED');
  assert.equal(write.change.$push.statusHistory.fromStatus,'SHIPPED');assert.equal(write.change.$push.statusHistory.toStatus,'PACKAGING');
 }finally{Task.findById=old.find;Task.findOneAndUpdate=old.update;}
});

function loadHook({failMove=false,failUndo=false,laterResponse=false}={}){
 const messages=[],requests=[],state=new Map([['a',{status:'PACKAGING',version:'v1'}],['b',{status:'IN_PRODUCTION',version:'v2'}]]);
 const api={updateTask:async(token,id,input)=>{
  requests.push({id,...input});const current=state.get(id);
  if(failMove&&id==='b'&&!input.expectedUpdatedAt&&!input.expectedWorkflowVersion)throw Error('Move rejected');
  if((input.expectedWorkflowVersion||input.expectedUpdatedAt)&&(failUndo||(input.expectedWorkflowVersion||input.expectedUpdatedAt)!==current.version))throw Error('Task changed again');
  const previous={status:current.status};current.status=input.status;current.version+='+';
  const appliedVersion=current.version;
  if(laterResponse&&!input.expectedWorkflowVersion){current.status='DELIVERED';current.version+='-teammate';}
  return {previous,undoVersion:appliedVersion,task:{status:current.status,updatedAt:current.version}};
 }};
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,'../admin/src/hooks/useUndoableMoves.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:name=>{
  if(name==='react')return {useRef:value=>({current:value}),useState:value=>[value,()=>{}]};
  if(name==='next-auth/react')return {useSession:()=>({data:{user:{token:'test'}}})};
  if(name==='@tanstack/react-query')return {useQueryClient:()=>({invalidateQueries:async()=>{}})};
  if(name==='@/api/tasks')return api;if(name==='@/api/orders')return {};
  if(name==='sonner')return {toast:{success:(text,options)=>messages.push({text,options}),error:text=>messages.push({error:text}),info:text=>messages.push({info:text})}};
  if(name==='./useTrashUndo')return {UNDO_DURATION:900000};throw Error(name);
 },Map,Date,Promise});
 return {hook:exports.useUndoableMoves(),messages,requests,state};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('bulk move offers one 15-minute Undo and restores each task to its own previous status',async()=>{
 const r=loadHook();await r.hook.move([{id:'a',kind:'task'},{id:'b',kind:'task'}],'SHIPPED');
 assert.equal(r.messages[0].options.duration,900000);assert.equal(r.messages[0].options.action.label,'Undo');
 r.messages[0].options.action.onClick();await flush();await flush();
 assert.equal(r.state.get('a').status,'PACKAGING');assert.equal(r.state.get('b').status,'IN_PRODUCTION');
 assert.equal(r.requests[2].expectedWorkflowVersion,'v1+');assert.equal(r.requests[3].expectedWorkflowVersion,'v2+');
});
test('partial bulk failure only counts successful moves and Undo never touches the failed task',async()=>{
 const r=loadHook({failMove:true});await r.hook.move([{id:'a',kind:'task'},{id:'b',kind:'task'}],'SHIPPED');
 assert.match(r.messages[0].text,/Moved 1/);assert.match(r.messages[1].error,/1 item/);
 r.messages[0].options.action.onClick();await flush();await flush();assert.equal(r.requests.filter(request=>request.id==='b').length,1);assert.equal(r.state.get('a').status,'PACKAGING');
});
test('bulk Undo reports a conflict and does not replace a newer status',async()=>{
 const r=loadHook({failUndo:true});await r.hook.move([{id:'a',kind:'task'}],'SHIPPED');
 r.state.get('a').status='DELIVERED';r.messages[0].options.action.onClick();await flush();await flush();
 assert.equal(r.state.get('a').status,'DELIVERED');assert.ok(r.messages.some(message=>message.error?.includes('changed again')));
});


test('Undo uses the applied workflow version even when a newer task is returned in the response',async()=>{
 const r=loadHook({laterResponse:true});await r.hook.move([{id:'a',kind:'task'}],'SHIPPED');
 r.messages[0].options.action.onClick();await flush();await flush();
 assert.equal(r.requests[1].expectedWorkflowVersion,'v1+');
 assert.equal(r.state.get('a').status,'DELIVERED');assert.ok(r.messages.some(message=>message.error?.includes('changed again')));
});

test('workflow guard rejects a task that moved away and back again',async()=>{
 const old={find:Task.findById,update:Task.findOneAndUpdate};let writes=0;
 Task.findById=()=>({select(){return this;},read(){return this;},lean:async()=>({status:'SHIPPED',isDone:false,updatedAt:new Date(),workflowVersion:'later-workflow'})});
 Task.findOneAndUpdate=()=>{writes++;throw Error('Must not write');};
 try{await assert.rejects(new TaskRepository().update('task',{status:'PACKAGING'},undefined,'original-workflow'),TaskStatusConflictError);assert.equal(writes,0);}
 finally{Task.findById=old.find;Task.findOneAndUpdate=old.update;}
});
