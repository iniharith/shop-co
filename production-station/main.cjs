const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage, Tray, Menu, clipboard } = require('electron');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const QRCode = require('qrcode');
const { print } = require('pdf-to-printer');
const { buildSheet, imagePdf } = require('./lib/layout.cjs');
const { tokenFromScan, safeName, fileKey, atomicWrite, loadState } = require('./lib/core.cjs');
const { download } = require('./lib/download.cjs');
const { pairBot } = require('./lib/bot-pair.cjs');

const DEFAULT_BACKEND = 'https://shop-co-production.up.railway.app';
let win, tray, quitting = false, state, settings, session = null, storePath, settingsPath, credentialsPath;
let processing = false, polling = false, printing = false, pollTimer;
let refreshing = null;
const trustedRenderer = pathToFileURL(path.join(__dirname, 'ui/index.html')).href;
// This print workspace needs deterministic 2D PDF rendering, not GPU acceleration.
app.disableHardwareAcceleration();

function save() { atomicWrite(storePath, state); }
function saveSettings() { atomicWrite(settingsPath, settings); }
function publicState() {
  return { ...state, settings, user: session?.user || null, connected: !!session, processing, printing,
    jobs: state.jobs.map(({ token, ...job }) => job), assets: state.assets.map(({ path: _path, ...asset }) => asset),
    sheets: state.sheets.map(({ path: _path, ...sheet }) => sheet), printed: state.printed };
}
function notify() { if (win && !win.isDestroyed()) win.webContents.send('station:update', publicState()); }
function saveSession() {
  if (!session) { fs.rmSync(credentialsPath, { force: true }); return; }
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows credential encryption is unavailable');
  fs.writeFileSync(credentialsPath, safeStorage.encryptString(JSON.stringify(session)));
}
async function api(endpoint, method = 'GET', body, retry = true) {
  if (!session) throw new Error('Sign in to Shop-Co first');
  const response = await fetch(settings.backend + endpoint, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  if (response.status === 401 && retry) {
    if (!refreshing) refreshing = (async () => {
      const refresh = await fetch(settings.backend + '/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: session.refreshToken }), signal: AbortSignal.timeout(15000) });
      if (!refresh.ok) { session = null; saveSession(); notify(); throw new Error('Session expired. Sign in again.'); }
      const data = await refresh.json();
      session.accessToken = data.accessToken; session.refreshToken = data.refreshToken; saveSession();
    })().finally(() => { refreshing = null; });
    await refreshing;
    return api(endpoint, method, body, false);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Shop-Co returned ${response.status}`);
  return data;
}
function assetById(id) { const asset = state.assets.find(item => item.id === id); if (!asset) throw new Error('Draft not found'); return asset; }
function sheetItems(slots) {
  if (!Array.isArray(slots) || slots.length !== 4) throw new Error('A4 template has exactly four slots');
  return slots.map(slot => {
    if (!slot) return null;
    const asset = assetById(slot.id);
    if (![0, 90, 180, 270].includes(slot.rotation || 0)) throw new Error('Invalid rotation');
    return { path: asset.path, page: asset.page, rotation: slot.rotation || 0 };
  });
}
async function addDraft(filename, metadata = {}) {
  const bytes = await fsp.readFile(filename);
  const key = metadata.key || crypto.createHash('sha256').update(bytes).digest('hex');
  const exists = state.assets.some(asset => asset.key === key);
  if (exists) return;
  let pages = 1, type = 'image', width, height, angles;
  if (bytes.subarray(0, 5).toString() === '%PDF-') {
    const document = await PDFDocument.load(bytes); type = 'pdf'; pages = document.getPageCount();
    if (pages > 200) throw new Error('Draft PDF exceeds 200 pages');
    angles = document.getPages().map(page => page.getRotation().angle);
    width = document.getPages().map(page => page.getWidth()); height = document.getPages().map(page => page.getHeight());
  } else {
    const info = await sharp(bytes, { limitInputPixels: 100000000 }).metadata();
    if (!['jpeg', 'png', 'webp', 'tiff', 'gif', 'heif', 'avif'].includes(info.format)) throw new Error('Draft must be PDF or an image');
    width = [info.width]; height = [info.height];
  }
  for (let page = 0; page < pages; page++) {
    state.assets.push({ id: `${key}:${page}`, key, path: filename, page, type, width: width[type === 'pdf' ? page : 0], height: height[type === 'pdf' ? page : 0], angle: angles?.[page] || 0, name: metadata.name || path.basename(filename), taskTitle: metadata.taskTitle || 'Imported draft', jobId: metadata.jobId || null, addedAt: new Date().toISOString(), printedAt: null });
  }
}
async function enqueue(code, source = 'PC') {
  const token = tokenFromScan(code);
  if (token === '0'.repeat(48)) { state.lastTest = { source, at: new Date().toISOString() }; save(); notify(); return { test: true }; }
  const existing = state.jobs.find(job => job.token === token && !job.archived);
  if (existing) { state.lastNotice = 'Task already in the queue. Use Refresh Files or Reprint AWB on its job card.'; notify(); return { id: existing.id, duplicate: true }; }
  if (!session) throw new Error('Sign in before scanning jobs');
  const job = { id: crypto.randomUUID(), token, source, status: 'queued', createdAt: new Date().toISOString(), title: 'Resolving task…', files: [], labels: [], warnings: [] };
  state.jobs.unshift(job); save(); notify(); void processQueue(); return { id: job.id };
}
async function printLabel(label, explicit = false) {
  const key = label.key;
  const prior = state.printed[key];
  if (prior && !explicit) return;
  if (!settings.awbPrinter) { label.printStatus = 'Printer not configured'; return; }
  const printerName = settings.awbPrinter === '@windows-default'
    ? (await win.webContents.getPrintersAsync()).find(printer => printer.isDefault)?.name
    : settings.awbPrinter;
  if (!printerName) { label.printStatus = 'Windows default printer not available'; return; }
  if (printing) throw new Error('Printer queue is busy. Try again shortly.');
  printing = true;
  state.printed[key] = { status: 'submitting', at: new Date().toISOString(), name: label.name, printer: printerName, attempts: (prior?.attempts || 0) + 1 };
  save(); notify();
  try {
    const pdf = await imagePdf(label.path, settings.awbPaper);
    const printPath = path.join(path.dirname(label.path), safeName(label.name) + '.print.pdf');
    await fsp.writeFile(printPath, pdf);
    await print(printPath, { printer: printerName, paperSize: settings.awbPaper === '100x150' ? '100x150mm' : settings.awbPaper, scale: 'fit', orientation: 'portrait', copies: 1, printDialog: false, silent: true, side: 'simplex' });
    state.printed[key].status = 'sent'; label.printStatus = 'Sent to printer';
  } catch (error) { state.printed[key].status = 'uncertain'; state.printed[key].error = error.message; label.printStatus = 'Check printer before reprinting'; throw error; }
  finally { printing = false; save(); notify(); }
}
async function runJob(job, batchRoot) {
  job.status = 'downloading'; job.error = null; job.finishedAt = null; save(); notify();
  try {
    const manifest = await api('/api/production/manifest/' + job.token);
    if (batchRoot && manifest.task.status !== 'IN_PRODUCTION') throw new Error('Task is no longer in Production');
    job.title = manifest.task.title; job.task = manifest.task; job.warnings = manifest.warnings;
    const root = batchRoot || job.folder || path.join(settings.downloadRoot, safeName(`${manifest.task.orderId || 'MANUAL'}_${manifest.task.id.slice(-8)}`));
    job.folder = root; await fsp.mkdir(root, { recursive: true });
    const selectedFiles = manifest.files.filter(file => file.tag === 'for_print' ? batchRoot || settings.downloadToPrint : file.tag === 'draft' && (batchRoot || settings.downloadDrafts));
    if (batchRoot && !selectedFiles.length) throw new Error('No Draft or For Print files found');
    const all = batchRoot ? selectedFiles : [...selectedFiles, ...manifest.labels.map(label => ({ ...label, tag: 'awb' }))];
    if (all.length > 500) throw new Error('Task exceeds 500 files');
    const downloaded = [];
    for (const file of all) {
      const key = fileKey(file);
      const folder = batchRoot && file.tag === 'for_print' ? root : path.join(root, file.tag === 'for_print' ? 'TO PRINT' : file.tag === 'draft' ? 'DRAFT' : 'AWB');
      await fsp.mkdir(folder, { recursive: true });
      const filename = path.join(folder, `${key.slice(0, 10)}_${safeName(file.name)}`);
      if (!fs.existsSync(filename)) await download(file.url, filename, file.size);
      downloaded.push({ id: file.id, key, name: file.name, tag: file.tag, path: filename, format: file.format || null });
      job.progress = `${downloaded.length} / ${all.length} files`; notify();
      if (file.tag === 'draft') {
        try { await addDraft(filename, { key, name: file.name, taskTitle: job.title, jobId: job.id }); }
        catch (error) { job.warnings.push(`${file.name}: downloaded, but cannot enter A4 layout — ${error.message}`); }
      }
      save();
    }
    job.files = downloaded.filter(file => file.tag !== 'awb'); job.labels = downloaded.filter(file => file.tag === 'awb');
    job.status = 'downloaded'; save(); notify();
    if (settings.autoAwb) for (const label of job.labels) {
      try { await printLabel(label); } catch (error) { job.warnings.push(`AWB: ${error.message}`); }
    }
  } catch (error) { job.status = 'error'; job.error = error.message; }
  job.finishedAt = new Date().toISOString(); save(); notify();
}
async function runProductionBatch(batch) {
  if (!/^[a-z0-9_-]{1,64}$/i.test(batch.folder) || safeName(batch.folder) !== batch.folder) throw new Error('Invalid batch folder name');
  const root = path.join(settings.downloadRoot, batch.folder);
  const completed = [];
  let failed = 0;
  for (const token of batch.tokens) {
    const job = { id: crypto.randomUUID(), token, title: 'Production batch task', files: [], labels: [], warnings: [] };
    await runJob(job, root);
    if (job.status === 'downloaded') completed.push(job);
    else failed++;
  }
  const draftKeys = new Set(completed.flatMap(job => job.files.filter(file => file.tag === 'draft').map(file => file.key)));
  const assets = state.assets.filter(asset => draftKeys.has(asset.key) && !asset.printedAt);
  if ([...draftKeys].some(key => !state.assets.some(asset => asset.key === key))) throw new Error('A downloaded draft could not be arranged. Check the batch folder before retrying.');
  if (state.sheets.some(sheet => sheet.status === 'uncertain' && sheet.assetIds.some(id => assets.some(asset => asset.id === id)))) throw new Error('A prior draft print is uncertain. Check the printer before retrying.');
  for (let index = 0; index < assets.length; index += 4) {
    const slots = assets.slice(index, index + 4).map(asset => ({ id: asset.id }));
    while (slots.length < 4) slots.push(null);
    await submitDraftSheet({ slots, margin: 5, gap: 3 });
  }
  let moved = 0;
  for (const job of completed) {
    try {
      if (!job.task.updatedAt) throw new Error('Task version unavailable');
      await api('/api/tasks/' + job.task.id, 'PUT', { status: 'PRINT_AWB', expectedUpdatedAt: job.task.updatedAt });
      moved++;
    } catch { failed++; }
  }
  return { status: failed ? 'error' : 'ready', message: `${completed.length} tasks downloaded, ${Math.ceil(assets.length / 4)} A4 sheets submitted, ${moved} moved to Print AWB, ${failed} need attention. Folder: ${batch.folder}` };
}
async function processQueue() {
  if (processing || !session) return;
  processing = true; notify();
  try { for (;;) { const job = [...state.jobs].reverse().find(item => item.status === 'queued'); if (!job || !session) break; await runJob(job); } }
  finally { processing = false; notify(); }
}
async function poll() {
  if (polling || !session || !settings.stationId) return;
  polling = true;
  try {
    state.phone = await api(`/api/production/stations/${settings.stationId}`);
    const { scans } = await api(`/api/production/stations/${settings.stationId}/scans`);
    for (const scan of scans) {
      if (scan.batch) {
        if (processing || printing) break;
        state.batchResults ||= {};
        const id = String(scan._id);
        if (!state.batchResults[id]) {
          state.batchResults[id] = { status: 'error', message: 'Batch interrupted. Check files, printer and task statuses before retrying.' };
          save();
          processing = true;
          try { state.batchResults[id] = await runProductionBatch(scan.batch); }
          catch (error) { state.batchResults[id] = { status: 'error', message: error.message }; }
          finally { processing = false; save(); notify(); void processQueue(); }
        }
        await api(`/api/production/stations/${settings.stationId}/scans/${id}/ack`, 'POST', state.batchResults[id]);
        continue;
      }
      let message = 'Job received by PC', status = 'received';
      if (!state.receipts.includes(String(scan._id))) {
        try {
          if (scan.test) { state.lastTest = { source: scan.source === 'bot' ? 'Telegram bot' : state.phone.phoneName || 'Phone', at: new Date().toISOString() }; message = 'Test scan received by PC'; }
          else {
            const result = await enqueue(scan.token, scan.source === 'bot' ? 'Telegram bot' : state.phone.phoneName || 'Phone');
            const job = state.jobs.find(item => item.id === result.id);
            if (result.duplicate) {
              status = 'ready';
              message = 'Task is already in the PC queue. No new AWB was printed; check the job before reprinting.';
            } else if (job) { job.remoteScans ||= []; job.remoteScans.push({ id: String(scan._id), stationId: settings.stationId, completed: false }); }
          }
          state.receipts.push(String(scan._id)); save();
        } catch (error) { message = error.message; status = 'error'; }
      }
      await api(`/api/production/stations/${settings.stationId}/scans/${scan._id}/ack`, 'POST', { status, message });
    }
    for (const job of state.jobs.filter(item => item.status === 'error' || (item.status === 'downloaded' && item.finishedAt))) {
      for (const scan of (job.remoteScans || []).filter(item => !item.completed && item.stationId === settings.stationId)) {
        const uncertain = job.labels.some(label => state.printed[label.key]?.status === 'uncertain');
        const submitted = job.labels.filter(label => state.printed[label.key]?.status === 'sent').length;
        const message = job.status === 'error' ? `Download needs attention: ${job.error}` : `${job.files.length} files downloaded. ${submitted} AWB(s) submitted${uncertain ? '; check printer' : !job.labels.length ? '; AWB unavailable' : !submitted ? '; AWB waiting for PC action' : ''}.`;
        await api(`/api/production/stations/${settings.stationId}/scans/${scan.id}/ack`, 'POST', { status: job.status === 'error' ? 'error' : 'ready', message });
        scan.completed = true; save();
      }
    }
    state.connectionError = null;
  } catch (error) { state.connectionError = error.message; }
  finally { polling = false; notify(); }
}

function handle(name, action) {
  ipcMain.handle('station:' + name, async (event, ...args) => {
    if (event.sender !== win?.webContents || event.senderFrame?.url !== trustedRenderer) throw new Error('Untrusted window');
    try { return { ok: true, value: await action(...args) }; }
    catch (error) { return { ok: false, error: error.message }; }
  });
}
async function submitDraftSheet({ slots, margin, gap }) {
  if (!settings.draftPrinter) throw new Error('Select a draft printer in Settings');
  if (printing) throw new Error('Printer queue is busy');
  printing = true;
  let sheet;
  try {
    const pdf = await buildSheet(sheetItems(slots), { margin: Number(margin), gap: Number(gap) });
    const folder = path.join(settings.downloadRoot, 'Printed sheets');
    await fsp.mkdir(folder, { recursive: true });
    const id = crypto.randomUUID();
    sheet = { id, at: new Date().toISOString(), assetIds: slots.filter(Boolean).map(slot => slot.id), status: 'submitting', printer: settings.draftPrinter, path: path.join(folder, `${id}-A4.pdf`) };
    await fsp.writeFile(sheet.path, pdf);
    state.sheets.unshift(sheet);
    save(); notify();
    await print(sheet.path, { printer: settings.draftPrinter, paperSize: 'A4', scale: 'noscale', orientation: 'portrait', copies: 1, silent: true, printDialog: false, side: 'simplex' });
    sheet.status = 'sent'; for (const id of sheet.assetIds) assetById(id).printedAt = sheet.at;
  } catch (error) {
    if (sheet && state.sheets.includes(sheet)) { sheet.status = 'uncertain'; sheet.error = error.message; }
    throw error;
  }
  finally { printing = false; save(); notify(); }
  return sheet.id;
}

function registerHandlers() {
  handle('state', () => publicState());
  handle('login', async ({ email, password }) => {
    if (processing || printing || polling) throw new Error('Wait for the current operation before changing account');
    email = String(email || '').trim();
    if (!email || typeof password !== 'string' || !password) throw new Error('Enter your KC Admin email and password');
    const response = await fetch(settings.backend + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(20000) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = response.status >= 500
        ? 'KC server could not complete sign-in. Check that these credentials work in KC Admin; the server also currently reports incorrect credentials as a server error.'
        : data.message || `Sign-in failed (HTTP ${response.status})`;
      throw new Error(message + (data.requestId ? ` Reference: ${data.requestId}` : ''));
    }
    if (!['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging', 'awapparel'].includes(data.user?.role)) throw new Error('Production staff account required');
    const id = String(data.user._id || data.user.id);
    if (settings.ownerId && settings.ownerId !== id) { settings.stationId = null; state.phone = null; }
    settings.ownerId = id; saveSettings();
    session = { accessToken: data.accessToken, refreshToken: data.refreshToken, user: { id, name: data.user.name, email: data.user.email, role: data.user.role } };
    saveSession(); notify(); void processQueue(); return publicState();
  });
  handle('logout', () => { if (processing || printing || polling) throw new Error('Wait for active operations to finish'); session = null; saveSession(); state.phone = null; notify(); });
  handle('scan', code => enqueue(code));
  handle('retry', id => { const job = state.jobs.find(item => item.id === id); if (!job || job.status === 'downloading' || processing) throw new Error('Wait for current downloads'); job.status = 'queued'; save(); notify(); void processQueue(); });
  handle('archive', id => { const job = state.jobs.find(item => item.id === id); if (!job || ['queued', 'downloading'].includes(job.status)) throw new Error('Finish this job before archiving'); job.archived = true; save(); notify(); });
  handle('pair', async () => {
    if (!settings.stationId) { const station = await api('/api/production/stations', 'POST', { name: settings.stationName }); settings.stationId = station.id; saveSettings(); }
    const data = await api(`/api/production/stations/${settings.stationId}/pairing`, 'POST');
    const url = `${settings.backend}/api/production/phone#station=${settings.stationId}&secret=${data.secret}`;
    return { url, expiresAt: data.expiresAt, qr: await QRCode.toDataURL(url, { width: 360, margin: 2 }) };
  });
  handle('pairBot', async () => {
    if (!session) throw new Error('Sign in to Shop-Co first');
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows credential encryption is unavailable');
    if (!settings.stationId) { const station = await api('/api/production/stations', 'POST', { name: settings.stationName }); settings.stationId = station.id; saveSettings(); }
    const result = await pairBot({ stationId:settings.stationId, ownerId:settings.ownerId, api,
      register:async body => {
        const response = await fetch(settings.backend + '/api/production/pair', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error('Bot pairing failed. Check the station before retrying.');
        return data;
      },
      persist:async credential => { try { await fsp.writeFile(path.join(app.getPath('userData'),'bot-credential.bin'), safeStorage.encryptString(JSON.stringify(credential))); } catch { throw new Error('Credential could not be saved. Unpair the bot on this PC before retrying.'); } }
    });
    await poll(); return result;
  });
  handle('copyBotCredential', async kind => {
    if (!session || !['stationId','deviceSecret'].includes(kind)) throw new Error('Sign in and select a credential field');
    let credential; try { credential = JSON.parse(safeStorage.decryptString(await fsp.readFile(path.join(app.getPath('userData'),'bot-credential.bin')))); } catch { throw new Error('No saved bot credential. Pair the Telegram bot first.'); }
    if (credential.ownerId !== settings.ownerId || credential.stationId !== settings.stationId) throw new Error('Saved bot credential does not belong to this station');
    const current = await api(`/api/production/stations/${settings.stationId}`);
    if (!current.botPaired) throw new Error('This bot credential is no longer paired');
    const check = await fetch(settings.backend + '/api/production/phone-status', {headers:{'X-Station-ID':credential.stationId,'X-Phone-Key':credential.deviceSecret},signal:AbortSignal.timeout(15000)});
    if (!check.ok) throw new Error('This bot credential has been revoked. Pair the bot again.');
    const value=credential[kind]; clipboard.writeText(value);
    setTimeout(() => { if (clipboard.readText() === value) clipboard.clear(); }, 60000).unref();
  });
  handle('approve', () => api(`/api/production/stations/${settings.stationId}/approve`, 'POST').then(() => poll()));
  handle('approveBot', () => api(`/api/production/stations/${settings.stationId}/approve-bot`, 'POST').then(() => poll()));
  handle('unpairBot', async () => { await api(`/api/production/stations/${settings.stationId}/bot`, 'DELETE'); await fsp.rm(path.join(app.getPath('userData'),'bot-credential.bin'),{force:true}); await poll(); });
  handle('unpair', async () => { await api(`/api/production/stations/${settings.stationId}/phone`, 'DELETE'); state.phone = null; notify(); });
  handle('reconnect', poll);
  handle('bluetooth', () => shell.openExternal('ms-settings:bluetooth'));
  handle('printers', async () => (await win.webContents.getPrintersAsync()).map(printer => ({ name: printer.name, displayName: printer.displayName, isDefault: printer.isDefault })));
  handle('chooseFolder', async () => { const result = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] }); if (result.canceled) return null; settings.downloadRoot = result.filePaths[0]; saveSettings(); notify(); return settings.downloadRoot; });
  handle('settings', value => {
    if (processing || printing || polling) throw new Error('Wait for active operations before changing settings');
    const names = ['stationName', 'awbPrinter', 'draftPrinter', 'awbPaper', 'autoAwb', 'autoArrangeDrafts', 'downloadToPrint', 'downloadDrafts'];
    const next = { ...settings };
    for (const name of names) if (name in value) next[name] = ['autoAwb', 'autoArrangeDrafts', 'downloadToPrint', 'downloadDrafts'].includes(name) ? value[name] === true : String(value[name]).slice(0, 200);
    if (next.autoArrangeDrafts && !next.downloadDrafts) throw new Error('Enable Download DRAFT in Settings before automatic draft arrangement');
    if (!['A4', 'A5', 'A6', '100x150'].includes(next.awbPaper)) throw new Error('Select a supported AWB paper size');
    settings = next;
    saveSettings(); notify();
  });
  handle('openFolder', id => { const job = state.jobs.find(item => item.id === id); if (!job?.folder) throw new Error('No downloaded folder yet'); return shell.openPath(job.folder); });
  handle('import', async () => {
    const result = await dialog.showOpenDialog(win, { title: 'Add portrait drafts', properties: ['openFile', 'multiSelections'], filters: [{ name: 'PDF and images', extensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff'] }] });
    if (result.canceled) return;
    const folder = path.join(settings.downloadRoot, 'Imported drafts'); await fsp.mkdir(folder, { recursive: true });
    const errors = [];
    for (const filename of result.filePaths) {
      try {
        if ((await fsp.stat(filename)).size > 200 * 1024 * 1024) throw new Error('Imported draft exceeds 200 MB');
        const bytes = await fsp.readFile(filename); const key = crypto.createHash('sha256').update(bytes).digest('hex');
        const copy = path.join(folder, key.slice(0, 10) + '_' + safeName(path.basename(filename)));
        await fsp.copyFile(filename, copy); await addDraft(copy, { key, name: path.basename(filename) });
      } catch (error) { errors.push(`${path.basename(filename)}: ${error.message}`); }
    }
    save(); notify(); return errors;
  });
  handle('asset', async id => {
    const asset = assetById(id);
    if (asset.type === 'pdf') return { type: 'pdf', bytes: new Uint8Array(await fsp.readFile(asset.path)), page: asset.page, angle: asset.angle };
    const png = await sharp(asset.path).rotate().resize({ width: 1200, height: 1600, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
    return { type: 'image', src: 'data:image/png;base64,' + png.toString('base64') };
  });
  handle('template', value => {
    const { slots } = require('./lib/layout.cjs'); slots(Number(value.margin), Number(value.gap));
    if (!String(value.name).trim()) throw new Error('Give the template a name');
    const template = { id: crypto.randomUUID(), name: String(value.name).slice(0, 60), margin: Number(value.margin), gap: Number(value.gap) };
    state.templates.push(template); save(); notify(); return template;
  });
  handle('preview', async ({ slots, margin, gap }) => new Uint8Array(await buildSheet(sheetItems(slots), { margin: Number(margin), gap: Number(gap) })));
  handle('export', async ({ slots, margin, gap }) => {
    const pdf = await buildSheet(sheetItems(slots), { margin: Number(margin), gap: Number(gap) });
    const result = await dialog.showSaveDialog(win, { defaultPath: path.join(settings.downloadRoot, 'Drafts-A4.pdf'), filters: [{ name: 'PDF', extensions: ['pdf'] }] });
    if (result.canceled) return null;
    await fsp.mkdir(path.dirname(result.filePath), { recursive: true }); await fsp.writeFile(result.filePath, pdf); return result.filePath;
  });
  handle('printSheet', submitDraftSheet);
  handle('printAwb', async ({ jobId, labelKey, reprint }) => {
    const label = state.jobs.find(job => job.id === jobId)?.labels?.find(item => item.key === labelKey);
    if (!label) throw new Error('AWB not downloaded');
    if (state.printed[label.key]) {
      if (!reprint) throw new Error('Label already submitted. Use Reprint after checking the printer.');
      const result = await dialog.showMessageBox(win, { type: 'question', buttons: ['Cancel', 'Reprint one label'], defaultId: 0, cancelId: 0, message: 'Print this AWB again?', detail: 'Check for an existing printed label first. This may produce a duplicate.' });
      if (result.response !== 1) return;
    }
    await printLabel(label, !!reprint);
  });
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('before-quit', () => { quitting = true; });
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
  app.whenReady().then(() => {
    app.setAppUserModelId('com.kampungcetak.production');
    storePath = path.join(app.getPath('userData'), 'production-state.json');
    settingsPath = path.join(app.getPath('userData'), 'settings.json'); credentialsPath = path.join(app.getPath('userData'), 'credentials.bin');
    settings = { backend: DEFAULT_BACKEND, stationName: os.hostname(), downloadRoot: path.join(app.getPath('documents'), 'KC Production Jobs'), awbPrinter: '', draftPrinter: '', awbPaper: 'A6', autoAwb: true, autoArrangeDrafts: false, downloadToPrint: true, downloadDrafts: false, ...(fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, 'utf8')) : {}) };
    if (!settings.downloadDrafts) settings.autoArrangeDrafts = false;
    if (settings.backend !== DEFAULT_BACKEND) throw new Error('Unsupported Shop-Co server in settings');
    state = loadState(storePath); save();
    try { if (fs.existsSync(credentialsPath)) session = JSON.parse(safeStorage.decryptString(fs.readFileSync(credentialsPath))); } catch { session = null; }
    registerHandlers();
    win = new BrowserWindow({ show: !process.argv.includes('--background'), width: 1440, height: 940, minWidth: 1100, minHeight: 760, icon: path.join(__dirname, 'assets/icon.png'), backgroundColor: '#f5f6f8', title: 'KC Production Station', autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } });
    tray = new Tray(path.join(__dirname, 'assets/icon.ico'));
    tray.setToolTip('KC Production Station');
    tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Open Production Station', click: () => { win.show(); win.focus(); } }, { label: 'Quit', click: () => { quitting = true; app.quit(); } }]));
    tray.on('double-click', () => { win.show(); win.focus(); });
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', (event, url) => { if (url !== trustedRenderer) event.preventDefault(); });
    win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    win.loadFile(path.join(__dirname, 'ui/index.html'));
    win.on('close', event => { if (processing || printing) { event.preventDefault(); void dialog.showMessageBox(win, { message: 'Please wait for the active download or print submission to finish.' }); } else if (!quitting) { event.preventDefault(); win.hide(); } });
    pollTimer = setInterval(() => void poll(), 2500); void processQueue();
  }).catch(error => { dialog.showErrorBox('KC Production Station', error.message); app.quit(); });
  app.on('window-all-closed', () => { clearInterval(pollTimer); app.quit(); });
}
