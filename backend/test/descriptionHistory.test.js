const test=require('node:test'),assert=require('node:assert/strict');
const {MongoMemoryReplSet}=require('mongodb-memory-server-core');
const mongoose=require('mongoose'),express=require('express'),jwt=require('jsonwebtoken'),{Readable}=require('node:stream'),{pipeline}=require('node:stream/promises'),{Writable}=require('node:stream'),{createHash,randomBytes}=require('node:crypto');
process.env.JWT_ACCESS_SECRET='isolated-history-access-test';process.env.JWT_REFRESH_SECRET='isolated-history-refresh-test';process.env.JWT_TOKEN='isolated-history-token-test';
const {Task}=require('../dist/domain/entities/Task');
const {TaskDescriptionRevision:Revision}=require('../dist/domain/entities/TaskDescriptionRevision');
const {DatabaseBackup,DatabaseBackupLock}=require('../dist/domain/entities/DatabaseBackup');
const {TaskRepository,TaskStatusConflictError}=require('../dist/infrastructure/repositories/TaskRepository');
const historyRouter=require('../dist/presentation/routes/taskDescriptionHistoryRoutes').default;
const backupRouter=require('../dist/presentation/routes/automaticBackupRoutes').default;
const backupService=require('../dist/infrastructure/services/AutomaticDatabaseBackupService');
const dumpService=require('../dist/infrastructure/services/DatabaseBackupService');
const {s3Client}=require('../dist/infrastructure/config/s3');

test('full description history and encrypted backups on an isolated replica set',async t=>{
 const repl=await MongoMemoryReplSet.create({replSet:{count:1}});let server;
 const originalCreate=Revision.create,originalDump=dumpService.startDatabaseBackup,originalSend=s3Client.send;
 try{
 await mongoose.connect(repl.getUri(),{dbName:'history-isolated'});
 await Promise.all([Task.init(),Revision.init(),DatabaseBackup.init(),DatabaseBackupLock.init()]);
 const userId=new mongoose.Types.ObjectId(),customerId=new mongoose.Types.ObjectId();
 await mongoose.connection.db.collection('users').insertMany([{_id:userId,name:'History Admin',email:'admin@isolated.invalid',role:'admin'},{_id:customerId,name:'Customer',email:'client@isolated.invalid',role:'client'}]);
 const token=jwt.sign({userId:String(userId)},process.env.JWT_ACCESS_SECRET),customer=jwt.sign({userId:String(customerId)},process.env.JWT_ACCESS_SECRET);
 const app=express();app.use(express.json());app.use('/api/tasks/:id/description-history',historyRouter);app.use('/api/tools/database-backups',backupRouter);
 server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const base='http://127.0.0.1:'+server.address().port;
 const req=(url,auth=token,method='GET')=>fetch(base+url,{method,headers:auth?{Authorization:'Bearer '+auth}:{}});
 const repo=new TaskRepository(),actor={id:String(userId),name:'History Admin'};
 const initial='<div>'+('Original artwork text '.repeat(100))+'80 pages — 文字</div>';
 let task=await repo.create({title:'History task',description:initial},actor);const id=String(task._id);
 const after='<div>'+('New artwork text '.repeat(100))+'90 pages &amp; full note</div>';
 await t.test('full before/after text is preserved beyond 80 characters',async()=>{
 task=await repo.update(id,{description:after},undefined,undefined,actor);
 const r=await Revision.findOne({taskId:id,kind:'edit'}).lean();assert.equal(r.beforeHtml,initial);assert.equal(r.afterHtml,after);assert.equal(r.actorName,actor.name);
 await repo.update(id,{description:after},undefined,undefined,actor);assert.equal(await Revision.countDocuments({taskId:id,kind:'edit'}),1);
 });
 await t.test('failed revision insertion rolls back the description change',async()=>{
 Revision.create=async()=>{throw Error('Simulated history storage failure')};
 try{await assert.rejects(repo.update(id,{description:'must not survive'},undefined,undefined,actor),/Simulated/);}finally{Revision.create=originalCreate;}
 assert.equal((await Task.findById(id)).description,after);assert.equal(await Revision.countDocuments({taskId:id,kind:'edit'}),1);
 });
 await t.test('concurrent edits retain the true previous version and stale versions cannot overwrite',async()=>{
 await Promise.all([repo.update(id,{description:'concurrent A'},undefined,undefined,actor),repo.update(id,{description:'concurrent B'},undefined,undefined,actor)]);
 const changes=await Revision.find({taskId:id,kind:'edit'}).sort({_id:1}).lean();assert.equal(changes.length,3);assert.equal(changes[1].beforeHtml,after);assert.equal(changes[2].beforeHtml,changes[1].afterHtml);
 const current=(await Task.findById(id)).description;await assert.rejects(repo.update(id,{description:'stale'},'2000-01-01T00:00:00.000Z',undefined,actor),TaskStatusConflictError);assert.equal((await Task.findById(id)).description,current);
 });
 const vm=require('node:vm'),fs=require('node:fs'),{createRequire}=require('node:module');
 const trashPath=require.resolve('../dist/shared/utils/trash'),trashRequire=createRequire(trashPath),trashExports={};
 vm.runInNewContext(fs.readFileSync(trashPath,'utf8'),{exports:trashExports,require:name=>name.endsWith('/FileUploadRepository')?{notifyFileClients:()=>{}}:name.endsWith('/taskBroadcast')?{emitTaskUpdated:async()=>{}}:trashRequire(name),Date,Set,URL,console,setInterval,clearInterval});
 await t.test('Trash snapshots preserve full descriptions before permanent deletion',async()=>{
   const before=(await Task.findById(id)).description;
   await trashExports.trashTask(id,actor.id,actor.name);
   const snapshot=await Revision.findOne({taskId:id,kind:'trash'});assert.equal(snapshot.afterHtml,before);assert.equal(snapshot.actorName,actor.name);
 });
 await t.test('history API requires staff auth, exports complete text, and remains after deletion',async()=>{
 const route='/api/tasks/'+id+'/description-history';assert.equal((await req(route,null)).status,401);assert.equal((await req(route,customer)).status,401);
 const response=await req(route);assert.equal(response.status,200);const body=await response.json();assert.ok(body.revisions.some(r=>r.beforeHtml===initial&&r.afterHtml===after));
 const json=await (await req(route+'/export')).json();assert.equal(json.revisions[0].afterHtml,initial);
 const text=await (await req(route+'/export?format=text')).text();assert.ok(text.includes('90 pages & full note'));
 await Task.deleteOne({_id:id});const archived=await (await req(route)).json();assert.equal(archived.taskDeleted,true);assert.equal(archived.currentHtml,null);assert.equal(archived.revisions.length,5);
 });
 await t.test('baseline capture is idempotent and includes soft-deleted descriptions',async()=>{
 await Task.create({title:'Previously deleted',description:'full description before feature',isDeleted:true});
 await backupService.captureDescriptionBaselines();await backupService.captureDescriptionBaselines();assert.equal(await Revision.countDocuments({kind:'baseline'}),1);
 const snapshot=await Revision.findOne({kind:'baseline'});assert.equal(snapshot.afterHtml,'full description before feature');
 });
 await t.test('automatic backup is encrypted, downloadable, integrity checked and mutually exclusive',async()=>{
 process.env.DATABASE_BACKUP_ENCRYPTION_KEY=randomBytes(32).toString('base64');process.env.AWS_ACCESS_KEY_ID='isolated-test';process.env.AWS_SECRET_ACCESS_KEY='isolated-test';process.env.MONGO_URI='mongodb://isolated-test';
 const archive=Buffer.from('simulated restorable archive bytes '.repeat(1000));let encrypted, manifest;
 dumpService.startDatabaseBackup=async()=>({stream:Readable.from([archive]),completion:Promise.resolve(),cancel(){}});
 s3Client.send=async command=>{if(command.constructor.name==='PutObjectCommand'){if(command.input.Key.endsWith('.json')){manifest=JSON.parse(command.input.Body);return{};}const parts=[];for await(const part of command.input.Body)parts.push(Buffer.from(part));encrypted=Buffer.concat(parts);return{};}return {Body:Readable.from([encrypted])};};
 const record=await backupService.queueDatabaseBackup('daily:2026-11-07');
 const deadline=Date.now()+10000;while((await DatabaseBackup.findById(record._id)).status==='running'&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));
 const saved=await DatabaseBackup.findById(record._id);assert.equal(saved.status,'completed');assert.notDeepEqual(encrypted,archive);assert.equal(manifest.authTag,saved.authTag);assert.equal(manifest.sha256,saved.sha256);assert.equal(saved.sha256,createHash('sha256').update(archive).digest('hex'));
 const download=await backupService.openBackupDownload(String(saved._id)),parts=[];await pipeline(download.encrypted,download.decipher,new Writable({write(chunk,_encoding,done){parts.push(Buffer.from(chunk));done()}}));assert.deepEqual(Buffer.concat(parts),archive);
 const response=await req('/api/tools/database-backups/'+saved._id+'/download');assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),archive);
 assert.equal((await req('/api/tools/database-backups',customer)).status,401);
 await DatabaseBackupLock.create({_id:'full-database-backup',owner:'other',leaseUntil:new Date(Date.now()+60000)});await assert.rejects(backupService.queueDatabaseBackup(),/already running/);await DatabaseBackupLock.deleteMany({});
 encrypted[0]^=1;const bad=await backupService.openBackupDownload(String(saved._id));await assert.rejects(pipeline(bad.encrypted,bad.decipher,new Writable({write(_c,_e,done){done()}})));
 assert.equal(backupService.backupDay(new Date('2026-11-06T18:59:00Z')),'2026-11-06');assert.equal(backupService.backupDay(new Date('2026-11-06T19:00:00Z')),'2026-11-07');
 });
 }finally{Revision.create=originalCreate;dumpService.startDatabaseBackup=originalDump;s3Client.send=originalSend;if(server)await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();await repl.stop();}
});
