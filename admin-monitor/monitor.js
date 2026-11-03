// Run as a separate, single-instance service. Credentials are environment-only.
const dns = require('node:dns').promises;
const { MongoClient, ObjectId } = require('mongodb');

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
let lastStatus = null;
let dbClient;
let seenIssues = null;
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
async function handle(msg) {
  if (!msg || String(msg.from?.id) !== owner || String(msg.chat?.id) !== chat || msg.chat?.type !== 'private') return;
  const text = (msg.text || '').trim();
  if (/^\/(start|help)(@\w+)?$/.test(text)) return send('Shop-Co admin monitor\n/status — website and DNS status\n/uploads — today’s uploaded tasks\n/uploads YYYY-MM-DD — uploaded tasks for a date\nAll report dates use Malaysia time.');
  if (/^\/status(@\w+)?$/.test(text)) return send(formatStatus(await check()));
  if (/^\/uploads(?:@\w+)?(?:\s|$)/.test(text)) return send(await report(text.split(/\s+/)[1] || malaysiaDay()));
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
  await monitor(); await pollIssues(); setInterval(() => void monitor(), 300000).unref(); setInterval(() => void pollIssues(), 300000).unref();
  for (;;) { try { const updates = await api('getUpdates',{offset,timeout:25,allowed_updates:['message']}); for (const u of updates) { offset = u.update_id + 1; try { await handle(u.message); } catch { console.error('Command failed.'); try { await send('Could not complete the request. Please try again.'); } catch {} } } } catch { console.error('Telegram polling failed; retrying.'); await sleep(5000); } }
}
main().catch(() => { console.error('Monitor stopped.'); process.exit(1); });
