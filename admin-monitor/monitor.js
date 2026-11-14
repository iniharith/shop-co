// Run as a separate, single-instance service. Credentials are environment-only.
const dns = require('node:dns').promises;
const { MongoClient, ObjectId } = require('mongodb');
const { createShopCoClient } = require('./shopco-client');
const { createSession } = require('./shopco-session');
const { createAssistant } = require('./assistant');
const { createStationClient } = require('./station-client');
const { searchIndex,readLimited } = require('./image-index');
const { extractSearchCandidates } = require('./image-match');
const { createModelBridge } = require('./model-bridge');
const { createCheckpoint } = require('./update-checkpoint');
const { downloadDesignerReport, sendDesignerReport } = require('./designer-report');

const token = process.env.ADMIN_BOT_TOKEN;
const owner = process.env.ADMIN_TELEGRAM_USER_ID;
const chat = process.env.ADMIN_TELEGRAM_CHAT_ID;
const mongo = process.env.ADMIN_REPORT_MONGO_URI;
const actor = process.env.ADMIN_REPORT_ACTOR_ID;
const urls = (process.env.MONITOR_URLS || 'https://admin.kampungcetak.com/,https://kampungcetak.com/,https://shop-co-production.up.railway.app/health/ready').split(',').map(s => s.trim()).filter(Boolean);
if (!token || !/^\d+$/.test(owner || '') || !/^\d+$/.test(chat || '')) {
  console.error('Set ADMIN_BOT_TOKEN, ADMIN_TELEGRAM_USER_ID and private ADMIN_TELEGRAM_CHAT_ID.');
  process.exit(1);
}
let offset = 0;
const checkpoint=createCheckpoint(process.env.BOT_STATE_PATH);
let lastStatus = null;
let dbClient;
let seenIssues = null;
const shopcoUrl = process.env.SHOPCO_API_URL || 'https://shop-co-production.up.railway.app';
const shopcoSession = createSession({baseUrl:shopcoUrl,email:process.env.SHOPCO_BOT_EMAIL,password:process.env.SHOPCO_BOT_PASSWORD});
const shopco = createShopCoClient({baseUrl:shopcoUrl,...shopcoSession});
const station = createStationClient({baseUrl:shopcoUrl,stationId:process.env.PRODUCTION_STATION_ID,deviceKey:process.env.PRODUCTION_STATION_DEVICE_KEY});
let assistant;
let modelBridge;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body), signal:AbortSignal.timeout(35000)});
  const data = await r.json();
  if (!r.ok || !data.ok) throw new Error(`Telegram ${method} failed (${r.status})`);
  return data.result;
}
async function send(message) {
  for (let i = 0; i < message.length; i += 3500) await api('sendMessage', {chat_id:chat, text:message.slice(i, i + 3500)});
}
async function check() {
  const results = await Promise.all(urls.map(async url => {
    try { const r = await fetch(url, {signal:AbortSignal.timeout(12000), redirect:'follow'}); return {url, ok:r.ok, detail:`HTTP ${r.status}`}; }
    catch { return {url, ok:false, detail:'DNS or connection failed'}; }
  }));
  try { await dns.resolveCname('admin.kampungcetak.com'); results.unshift({url:'Admin DNS',ok:true,detail:'resolves'}); }
  catch { results.unshift({url:'Admin DNS',ok:false,detail:'CNAME lookup failed'}); }
  return results;
}
function formatStatus(results) { return 'Website status\n' + results.map(x => `${x.ok ? '✅' : '❌'} ${x.url}: ${x.detail}`).join('\n'); }
async function report(day) {
  if (!mongo || !ObjectId.isValid(actor || '')) return 'Upload reports are not configured.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(`${day}T00:00:00Z`)) || new Date(`${day}T00:00:00Z`).toISOString().slice(0,10) !== day) return 'Use /uploads YYYY-MM-DD, for example /uploads 2026-10-29.';
  const start = new Date(`${day}T00:00:00+08:00`), end = new Date(start.getTime()+86400000);
  if (!dbClient) { const client = new MongoClient(mongo, {serverSelectionTimeoutMS:10000}); await client.connect(); dbClient = client; }
  const db = dbClient.db(process.env.ADMIN_REPORT_DB || 'shop-co');
  const records = await db.collection('auditlogs').find({actorId:actor,action:'file_add',createdAt:{$gte:start,$lt:end},route:/^\/api\/tasks\/[0-9a-f]{24}/},{projection:{route:1}}).toArray();
  const ids = [...new Set(records.map(x => x.route.match(/^\/api\/tasks\/([0-9a-f]{24})/)[1]))];
  const tasks = await db.collection('tasks').find({_id:{$in:ids.map(id => new ObjectId(id))}},{projection:{title:1}}).toArray();
  tasks.sort((a,b) => String(a.title || '').localeCompare(String(b.title || ''), undefined, {sensitivity:'base'}));
  return `HARITH uploads — ${day} (Malaysia time)\n${ids.length} tasks; ${tasks.length} titles found\n\n` + (tasks.map(t => `• ${t.title || '(untitled)'}`).join('\n') || 'No recorded uploads.');
}
function malaysiaDay() { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
async function searchTasks(query) {
  if (!mongo) return 'Task search is not configured.';
  query = query.trim();
  if (query.length < 2 || query.length > 100) return 'Use /task followed by 2–100 characters, for example /task rohaiskandar533.';
  if (!dbClient) { const client = new MongoClient(mongo, {serverSelectionTimeoutMS:10000}); await client.connect(); dbClient = client; }
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = await dbClient.db(process.env.ADMIN_REPORT_DB || 'shop-co').collection('tasks').find({isDeleted:{$ne:true},$or:[{title:{$regex:escaped,$options:'i'}},{orderId:{$regex:escaped,$options:'i'}},{customerUsername:{$regex:escaped,$options:'i'}}]}, {projection:{title:1,status:1,orderId:1},maxTimeMS:10000}).sort({updatedAt:-1}).limit(11).toArray();
  if (!matches.length) return 'No matching tasks found.';
  const extra = matches.length > 10; if (extra) matches.pop();
  return 'Task search results:\n\n' + matches.map(x => `${x.title || '(untitled)'}\nStatus: ${x.status || 'Unknown'}\nID: ${x._id}`).join('\n\n') + (extra ? '\n\nShowing 10 results; refine your search.' : '');
}
function getAssistant(){
  if((!process.env.MODEL_API_URL && !modelBridge) || !process.env.MODEL_NAME)return null;
  const fetchImpl=modelBridge?async(_url,options)=>new Response(JSON.stringify(await modelBridge.infer(JSON.parse(options.body))),{status:200}):undefined;
  if(!assistant)assistant=createAssistant({baseUrl:process.env.MODEL_API_URL||'http://127.0.0.1:11434',model:process.env.MODEL_NAME,apiToken:process.env.MODEL_API_TOKEN,fetchImpl,tools:{searchTasks,websiteStatus:async()=>formatStatus(await check())}});
  return assistant;
}
async function searchFileText(query){
  if(!mongo||typeof query!=='string'||query.trim().length<2||query.length>100)return '';
  if(!dbClient){const client=new MongoClient(mongo,{serverSelectionTimeoutMS:10000});await client.connect();dbClient=client;}
  const db=dbClient.db(process.env.ADMIN_REPORT_DB||'shop-co');const escaped=query.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const files=await db.collection('fileuploads').find({taskId:{$type:'string'},$or:[{originalName:{$regex:escaped,$options:'i'}},{notes:{$regex:escaped,$options:'i'}}]},{projection:{taskId:1,originalName:1},maxTimeMS:10000}).sort({uploadedAt:-1}).limit(10).toArray();
  const ids=[...new Set(files.map(f=>f.taskId).filter(ObjectId.isValid))].map(id=>new ObjectId(id));
  const tasks=await db.collection('tasks').find({_id:{$in:ids},isDeleted:{$ne:true}},{projection:{title:1}}).toArray();
  const rows=files.flatMap(f=>{const task=tasks.find(t=>String(t._id)===f.taskId);return task?[`• ${f.originalName}\n  ${task.title}`]:[]});
  return rows.length?`Matching filenames or notes:\n${rows.join('\n')}`:'';
}
async function searchPhoto(photo){
  if(!photo?.file_id || (photo.file_size && photo.file_size>10*1024*1024)) return 'Please send an image smaller than 10 MB.';
  const file=await api('getFile',{file_id:photo.file_id});
  if(typeof file.file_path!=='string'||!/^photos\/[\w.-]+$|^documents\/[\w.-]+$/.test(file.file_path)) throw new Error('Invalid Telegram file path');
  const response=await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`,{redirect:'error',signal:AbortSignal.timeout(30000)});
  const bytes=await readLimited(response,10*1024*1024);const sections=[];
  if(process.env.IMAGE_INDEX_PATH){
    try {const result=await searchIndex(bytes,process.env.IMAGE_INDEX_PATH,{limit:10});
      if(!result.indexed) sections.push('Visual index is empty; it must be built first.');
      else if(!result.matches.length)sections.push(`No close visual match among ${result.indexed} indexed files.`);
      else {
        // Index records can become stale; show only files and tasks that still exist.
        if(!dbClient){const client=new MongoClient(mongo,{serverSelectionTimeoutMS:10000});await client.connect();dbClient=client;}
        const db=dbClient.db(process.env.ADMIN_REPORT_DB||'shop-co');
        const ids=result.matches.filter(x=>ObjectId.isValid(x.id)).map(x=>new ObjectId(x.id));
        const current=await db.collection('fileuploads').find({_id:{$in:ids}},{projection:{taskId:1,originalName:1}}).toArray();
        const taskIds=[...new Set(current.map(x=>x.taskId).filter(ObjectId.isValid))].map(x=>new ObjectId(x));
        const tasks=await db.collection('tasks').find({_id:{$in:taskIds},isDeleted:{$ne:true}},{projection:{title:1}}).toArray();
        const rows=result.matches.flatMap(m=>{const file=current.find(f=>String(f._id)===m.id);const task=tasks.find(t=>String(t._id)===file?.taskId);return file&&task?[`• ${file.originalName}\n  ${task.title}\n  Similarity: ${Math.round(m.score*100)}%`]:[];});
        sections.push(rows.length?`Possible visual matches (verify artwork):\n${rows.join('\n')}`:'No matching current task files found.');
      }
    }catch{sections.push('Visual search is unavailable. Check the index and file-read permission.');}
  }else sections.push('Visual search index is not configured.');
  const vision=getAssistant();if(vision){try{const info=await vision.describeImage(bytes);sections.push(`Image reading (verify):\n${info.text||'(No text detected)'}\n${info.description}`);for(const term of extractSearchCandidates(info).slice(0,3)){sections.push(`Search for “${term}”:\n${await searchTasks(term)}`);try{const files=await searchFileText(term);if(files)sections.push(files);}catch{sections.push('Filename search unavailable.');}}}catch{sections.push('Text recognition is unavailable; a vision-capable model is required.');}}
  else sections.push('Text recognition is not configured.');
  return sections.join('\n\n');
}
async function handle(msg) {
  if (!msg || String(msg.from?.id) !== owner || String(msg.chat?.id) !== chat || msg.chat?.type !== 'private') return;
  const photo=Array.isArray(msg.photo)&&msg.photo.length?msg.photo[msg.photo.length-1]:(msg.document?.mime_type?.startsWith('image/')?msg.document:null);
  if(photo)return send(await searchPhoto(photo));
  const text = (msg.text || '').trim();
  if(!checkpoint && /^\/(?:move|update|awb)(?:@\w+)?(?:\s|$)/.test(text)) return send('Task changes and AWB jobs are unavailable until persistent bot state is configured.');
  if (/^\/(start|help)(@\w+)?$/.test(text)) return send('Shop-Co admin monitor\n/status — website and DNS status\n/task QUERY — search tasks\n/move TASK_ID STATUS — move one task\n/update TASK_ID FIELD VALUE — update title, description or dueDate\n/awb TASK_ID — queue a task at the production station\n/awbstatus JOB_ID — check the station result\n/uploads [YYYY-MM-DD] — uploaded tasks\n/designer [YYYY-MM-DD [YYYY-MM-DD]] — daily designer PDF\n/designer week — this week, one A4 per day\nAll report dates use Malaysia time.');
  if (/^\/status(@\w+)?$/.test(text)) return send(formatStatus(await check()));
  const batch = text.match(/^\/production\s+(today|\d{4}-\d{2}-\d{2})\s+([a-z0-9_-]{1,64})$/i) ||
    text.match(/^download (today|\d{4}-\d{2}-\d{2})(?:'s)? production files (?:to|into) ([a-z0-9_-]{1,64}), print (?:the )?drafts four per a4, and move (?:the )?(?:downloaded )?tasks to print awb\.?$/i);
  if (batch) {
    if (!checkpoint) return send('Production batches require persistent bot state.');
    const day = batch[1].toLowerCase() === 'today' ? malaysiaDay() : batch[1];
    const tasks = await shopco.productionTasks(day);
    if (!tasks.length) return send(`No Production tasks for ${day}.`);
    if (tasks.length > 100) return send('This batch exceeds the station limit of 100 tasks.');
    const tokens = [];
    for (const task of tasks) tokens.push(await shopco.getTaskQr(task.id));
    const job = await station.submitBatch(tokens, batch[2], `production-${msg.message_id}`);
    return send(`Queued ${tasks.length} Production tasks for ${day}. Use /awbstatus ${job.id} to check the batch result.`);
  }
  const production = text.match(/^\/production(?:@\w+)?(?:\s+(\d{4}-\d{2}-\d{2}))?$/i);
  if (production) {
    const day = production[1] || malaysiaDay();
    const tasks = await shopco.productionTasks(day);
    const names = tasks.map(task => `• ${task.name}`).join('\n');
    return send(`Production batch preview — ${day} (Malaysia time)\n${tasks.length} tasks${names ? '\n\n' + names : ''}`);
  }
  if (/^\/task(?:@\w+)?(?:\s|$)/.test(text)) return send(await searchTasks(text.replace(/^\/task(?:@\w+)?\s*/, '')));
  if (/^\/move(?:@\w+)?(?:\s|$)/.test(text)) {
    const parts=text.split(/\s+/); if(parts.length!==3) return send('Use /move TASK_ID STATUS, for example /move TASK_ID PRINT_AWB.');
    const task=await shopco.getTask(parts[1]); const updated=await shopco.updateTask(parts[1],{status:parts[2].toUpperCase()},task.updatedAt);
    return send(`Moved: ${updated.title}\nStatus: ${updated.status}\nID: ${updated._id}`);
  }
  if (/^\/update(?:@\w+)?(?:\s|$)/.test(text)) {
    const match=text.match(/^\/update(?:@\w+)?\s+([a-f\d]{24})\s+(title|description|dueDate)\s+([\s\S]+)$/i);
    if(!match)return send('Use /update TASK_ID title|description|dueDate VALUE.');
    const field=match[2].toLowerCase()==='duedate'?'dueDate':match[2].toLowerCase();
    const task=await shopco.getTask(match[1]); const updated=await shopco.updateTask(match[1],{[field]:match[3]},task.updatedAt);
    return send(`Updated ${field}: ${updated.title}\nID: ${updated._id}`);
  }
  if (/^\/awb(?:@\w+)?(?:\s|$)/.test(text)) {
    const parts=text.split(/\s+/);if(parts.length!==2)return send('Use /awb TASK_ID.');
    const task=await shopco.getTask(parts[1]);const qr=await shopco.getTaskQr(parts[1]);let job;
    try { job=await station.submit(qr); } catch (error) { return send(error.message.startsWith('Station submission uncertain.') ? error.message : 'The Production Station is unavailable, unpaired, or did not accept this job. Check the station before retrying.'); }
    return send(`Queued at Production Station: ${task.title}\nJob ID: ${job.id}\nUse /awbstatus ${job.id} to check whether the label was submitted. This does not confirm physical printing.`);
  }
  if (/^\/awbstatus(?:@\w+)?(?:\s|$)/.test(text)) {
    const parts=text.split(/\s+/);if(parts.length!==2)return send('Use /awbstatus JOB_ID.');
    const result=await station.status(parts[1]);return send(`Station: ${result.status}\n${result.message || 'Waiting for PC'}\nPhysical printing is not confirmed.`);
  }
  if (/^\/designer(?:@\w+)?(?:\s|$)/i.test(text)) {
    try {
      const report = await downloadDesignerReport({ argument: text.replace(/^\/designer(?:@\w+)?\s*/i, ''), actorId: actor, baseUrl: shopcoUrl, session: shopcoSession });
      await sendDesignerReport({ report, token, chat });
    } catch (error) { await send(error.message || 'Unable to create the designer report.'); }
    return;
  }
  if (/^\/uploads(?:@\w+)?(?:\s|$)/.test(text)) return send(await report(text.split(/\s+/)[1] || malaysiaDay()));
  if (text && !text.startsWith('/')) {
    const active=getAssistant();if(!active)return send('AI chat is not configured yet. Use /help for available commands.');
    return send(await active.chat(text));
  }
}
async function monitor() {
  try { const results = await check(); const key = results.map(x => x.ok ? '1':'0').join('');
    if (lastStatus === null) { if (results.some(x=>!x.ok)) await send('Monitor started with an outage.\n'+formatStatus(results)); lastStatus = key; }
    else if (key !== lastStatus) { await send('Website status changed.\n'+formatStatus(results)); lastStatus = key; }
  } catch { console.error('Status check or notification failed; will retry.'); }
}
// Poll a Sentry organization's unresolved issues. A baseline avoids flooding on startup.
async function checkIssues() {
  const org = process.env.SENTRY_ORG_SLUG;
  const sentryToken = process.env.SENTRY_READ_TOKEN;
  if (!org || !sentryToken) return;
  if (!/^[a-zA-Z0-9_-]+$/.test(org)) throw new Error('Invalid Sentry organization slug');
  const url = new URL(`https://sentry.io/api/0/organizations/${org}/issues/`);
  url.searchParams.set('query', 'is:unresolved');
  url.searchParams.set('sort', 'date');
  url.searchParams.set('limit', '100');
  const response = await fetch(url, {headers:{Authorization:`Bearer ${sentryToken}`},signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error(`Sentry request failed (${response.status})`);
  const issues = await response.json();
  if (!Array.isArray(issues)) throw new Error('Unexpected Sentry response');
  if (seenIssues === null) { seenIssues = new Set(issues.map(i => String(i.id))); return; }
  // Only mark an issue seen after successful delivery so transient Telegram errors retry it.
  for (const issue of issues.reverse()) {
    const id = String(issue.id);
    if (seenIssues.has(id)) continue;
    const title = String(issue.title || 'Unknown error').replace(/[\r\n]+/g, ' ').slice(0, 300);
    const project = String(issue.project?.slug || 'unknown').slice(0,100);
    await send(`🐛 New Sentry issue\nProject: ${project}\n${title}\nIssue ID: ${id}`);
    seenIssues.add(id);
  }
}
async function pollIssues() { try { await checkIssues(); } catch { console.error('Sentry issue check failed; will retry.'); } }
async function main() {
  if(checkpoint)offset=await checkpoint.read();
  if(process.env.MODEL_BRIDGE_SECRET){modelBridge=createModelBridge({secret:process.env.MODEL_BRIDGE_SECRET});await new Promise((resolve,reject)=>{modelBridge.server.once('error',reject);modelBridge.server.listen(Number(process.env.PORT||3000),'0.0.0.0',resolve)});console.log('Authenticated model bridge started.');}
  await monitor(); await pollIssues(); setInterval(() => void monitor(), 300000).unref(); setInterval(() => void pollIssues(), 300000).unref();
  for (;;) { try { const updates = await api('getUpdates',{offset,timeout:25,allowed_updates:['message']}); for (const u of updates) { const next=u.update_id+1; if(checkpoint)await checkpoint.write(next); offset=next; try { await handle(u.message); } catch { console.error('Command failed.'); try { await send('Could not complete the request. Check the current task or station status before retrying.'); } catch {} } } } catch { console.error('Telegram polling or checkpoint failed; retrying.'); await sleep(5000); } }
}
main().catch(() => { console.error('Monitor stopped.'); process.exit(1); });
