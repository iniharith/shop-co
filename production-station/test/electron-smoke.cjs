// Exercises the real renderer/preload/main IPC with synthetic jobs and mocked printers.
// No production requests, credentials or physical printing are used.
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const Module = require('node:module');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kc-electron-smoke-'));
app.setName('KC Production Station Isolated Smoke'); app.setPath('userData', path.join(root, 'profile'));
fs.mkdirSync(app.getPath('userData'), { recursive: true });
const downloads = path.join(root, 'downloads');
fs.writeFileSync(path.join(app.getPath('userData'), 'settings.json'), JSON.stringify({ downloadRoot: downloads, awbPrinter: 'MOCK AWB', draftPrinter: 'MOCK DRAFT' }));
const source = path.join(__dirname, '../test-output');
const printCalls = [];
const originalLoad = Module._load;
Module._load = function(name, ...args) {
  if (name === 'pdf-to-printer') return { getPrinters: async () => [{ name: 'MOCK AWB' }, { name: 'MOCK DRAFT' }], print: async (filename, options) => { assert.ok(fs.existsSync(filename)); printCalls.push({ filename, options }); } };
  return originalLoad.call(this, name, ...args);
};
dialog.showMessageBox = async () => ({ response: 1 });
dialog.showSaveDialog = async () => ({ canceled: false, filePath: path.join(root, 'export.pdf') });
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path.join(source, 'sample-draft-4.pdf')] });
const code = 'ab'.repeat(24), second = 'cd'.repeat(24), printOnly = 'ef'.repeat(24), manualAwb = '12'.repeat(24);
let failedDownload = false;
global.fetch = async (url, options = {}) => {
  const endpoint = new URL(url).pathname;
  if (endpoint === '/draft-2' && !failedDownload) { failedDownload = true; return new Response('Synthetic network failure', { status: 503 }); }
  if (endpoint === '/api/auth/login') return Response.json({ accessToken: 'synthetic-access', refreshToken: 'synthetic-refresh', user: { _id: 'synthetic-user', name: 'Test Staff', role: 'production', email: 'test@invalid.test' } });
  if (endpoint.startsWith('/api/production/manifest/')) return Response.json({ task: { id: endpoint.endsWith(code) ? '12345678' : '87654321', title: endpoint.endsWith(code) ? 'Synthetic print job' : 'Shared parcel job', orderId: 'ORDER-TEST' }, files: [...[1,2,3].map(n => ({ id: 'draft-'+n, version: 'v1', name: `draft-${n}.pdf`, tag: 'draft', url: `https://example.com/draft-${n}` })), { id: 'print-one', version: 'v1', name: 'TO-PRINT.pdf', tag: 'for_print', url: 'https://example.com/draft-1' }], labels: [{ id: endpoint.endsWith(printOnly) ? 'parcel:print-only' : endpoint.endsWith(manualAwb) ? 'parcel:manual' : 'parcel:shared-one', version: 'AWB-SHARED', name: 'AWB.pdf', url: 'https://example.com/awb' }], warnings: [] });
  if (new URL(url).hostname === 'example.com') return new Response(fs.readFileSync(path.join(source, 'sample-draft-' + (endpoint.startsWith('/draft-') ? endpoint.slice(-1) : '1') + '.pdf')), { headers: { 'Content-Type': 'application/pdf' } });
  throw new Error('Unexpected network request in isolated smoke: ' + endpoint);
};
require('../main.cjs');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(fn, label) { for (let n=0;n<200;n++) { const value = await fn(); if (value) return value; await sleep(100); } throw new Error('Timed out: '+label); }
(async () => {
  try {
    await app.whenReady();
    const win = await waitFor(() => BrowserWindow.getAllWindows()[0], 'window');
    const consoleErrors = [];
    win.webContents.on('console-message', (_event, level, message) => { if (level >= 3 && !/WSALookup|Autofill/.test(message)) consoleErrors.push(message); });
    await waitFor(() => win.webContents.executeJavaScript('!!window.station && !!document.getElementById("jobs").children.length').catch(() => false), 'renderer boot');
    async function call(method, value) {
      const result = await win.webContents.executeJavaScript(`window.station[${JSON.stringify(method)}](${value === undefined ? '' : JSON.stringify(value)})`);
      assert.equal(result.ok, true, result.error); return result.value;
    }
    await call('login', { email: 'test@invalid.test', password: 'synthetic' });
    await win.webContents.executeJavaScript('document.getElementById("loginDialog").close()');
    const defaults = await call('state'); assert.equal(defaults.settings.downloadToPrint, true); assert.equal(defaults.settings.downloadDrafts, false); assert.equal(defaults.settings.autoAwb, true);
    await call('settings', { downloadToPrint: false, downloadDrafts: true, autoArrangeDrafts: false });
    await call('scan', code);
    await waitFor(async () => { const data = await call('state'); return !data.processing && data.jobs[0]?.status === 'error'; }, 'download error');
    let interrupted = await call('state'); assert.equal(interrupted.assets.length, 1); assert.equal(printCalls.length, 0, 'No AWB before all downloads finish');
    await call('retry', interrupted.jobs[0].id);
    await waitFor(async () => { const data = await call('state'); return !data.processing && data.jobs[0]?.status === 'downloaded'; }, 'download');
    let data = await call('state'); assert.equal(data.jobs[0].files.length, 3); assert.equal(data.assets.length, 3); assert.equal(printCalls.length, 1);
    assert.equal(await win.webContents.executeJavaScript('document.querySelectorAll(".slot>img").length'), 0, 'Auto-arrange off keeps scanned drafts in the library');
    await call('settings', { autoArrangeDrafts: true });
    await waitFor(() => win.webContents.executeJavaScript('document.querySelectorAll(".slot>img").length === 3'), 'Auto-arrange enabled fills slots');
    assert.equal(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'settings.json'), 'utf8')).autoArrangeDrafts, true, 'Setting persists on disk');
    const duplicate = await call('scan', code); assert.equal(duplicate.duplicate, true);
    await call('scan', second);
    await waitFor(async () => !(await call('state')).processing, 'second download');
    assert.equal(printCalls.length, 1, 'Shared parcel must not print twice');
    await call('import'); data = await call('state'); assert.equal(data.assets.length, 4);
    await waitFor(() => win.webContents.executeJavaScript('document.getElementById("draftCount").textContent === "4"'), 'renderer asset update');
    await win.webContents.executeJavaScript('document.querySelector("[data-page=layout]").click(); document.getElementById("autoArrange").click()');
    await waitFor(() => win.webContents.executeJavaScript('document.querySelectorAll(".slot>img").length===4 && Array.from(document.querySelectorAll(".slot>img")).every(image=>image.complete&&image.naturalWidth>0)'), 'four thumbnails');
    await fsp.writeFile(path.join(source, 'app-layout.png'), (await win.webContents.capturePage()).toPNG());
    await win.webContents.executeJavaScript('document.getElementById("previewButton").click()');
    await waitFor(() => win.webContents.executeJavaScript('document.getElementById("previewDialog").open && document.getElementById("previewCanvas").width>0'), 'PDF preview');
    await win.webContents.executeJavaScript('document.getElementById("closePreview").click()');
    await sleep(100);
    const slots = data.assets.map(asset => ({ id: asset.id, rotation: 0 })); const payload = { slots, margin: 5, gap: 3 };
    await call('export', payload); assert.ok(fs.existsSync(path.join(root, 'export.pdf')));
    await call('printSheet', payload); assert.equal(printCalls.length, 2); assert.equal(printCalls[1].options.paperSize, 'A4'); assert.equal(printCalls[1].options.scale, 'noscale');
    data = await call('state'); assert.ok(data.assets.every(asset => asset.printedAt)); assert.equal(data.sheets[0].status, 'sent');
    const label = data.jobs[0].labels[0]; await call('printAwb', { jobId: data.jobs[0].id, labelKey: label.key, reprint: true }); assert.equal(printCalls.length, 3);
    await win.webContents.executeJavaScript('document.querySelector("[data-page=pair]").click();document.getElementById("bluetoothTab").click()');
    assert.equal(await win.webContents.executeJavaScript('!document.getElementById("bluetoothPanel").hidden'), true);
    await call('scan', '0'.repeat(48)); assert.ok((await call('state')).lastTest);
    await call('settings', { downloadToPrint: true, downloadDrafts: false, autoArrangeDrafts: false, autoAwb: true });
    await call('scan', printOnly);
    await waitFor(async () => !(await call('state')).processing, 'TO PRINT only scan');
    data = await call('state'); assert.equal(data.jobs[0].files.length, 1); assert.equal(data.jobs[0].files[0].tag, 'for_print'); assert.equal(data.assets.length, 4, 'DRAFT downloads remain off'); assert.equal(printCalls.length, 4, 'AWB auto-prints with TO PRINT only workflow');
    await call('settings', { autoAwb: false }); await call('scan', manualAwb);
    await waitFor(async () => !(await call('state')).processing, 'manual AWB scan');
    assert.equal(printCalls.length, 4, 'Automatic AWB setting OFF prevents submission');
    await call('settings', { autoAwb: true });
    await win.webContents.executeJavaScript('document.querySelector("[data-page=settings]").click()'); await sleep(100);
    assert.equal(await win.webContents.executeJavaScript('document.getElementById("settingDownloadToPrint").checked && !document.getElementById("settingDownloadDrafts").checked && !document.getElementById("settingAutoArrange").checked'), true);
    await fsp.writeFile(path.join(source, 'app-settings.png'), (await win.webContents.capturePage()).toPNG());
    assert.deepEqual(consoleErrors, [], 'Renderer console must be free of errors');
    const output = path.join(__dirname, '../test-output');
    await win.webContents.executeJavaScript('document.querySelector("[data-page=layout]").click();document.getElementById("showPrinted").click();'); await sleep(500);
    await fsp.writeFile(path.join(output, 'app-layout-after-print.png'), (await win.webContents.capturePage()).toPNG());
    await win.webContents.executeJavaScript('document.querySelector("[data-page=pair]").click();document.getElementById("wifiTab").click();'); await sleep(200);
    await fsp.writeFile(path.join(output, 'app-pair-phone.png'), (await win.webContents.capturePage()).toPNG());
    console.log('PASS: real Electron IPC, login, failed download + retry, saved scan actions, TO PRINT only + automatic AWB, automatic AWB OFF, auto-arrange ON/OFF, shared AWB deduplication, import, four thumbnails, PDF preview/export, mocked print, reprint, Pair Phone and Bluetooth test.');
    console.log('Physical printer and phone hardware were not used.');
    console.log('Temporary test profile: ' + root);
    win.destroy(); app.exit(0);
  } catch (error) {
    console.error(error);
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      try { console.error(await win.webContents.executeJavaScript('JSON.stringify({text:document.body.innerText,images:Array.from(document.querySelectorAll(".slot>img")).map(image=>({complete:image.complete,width:image.naturalWidth,src:image.src.slice(0,50)}))})')); await fsp.writeFile(path.join(__dirname, '../test-output/smoke-failure.png'), (await win.webContents.capturePage()).toPNG()); }
      catch (captureError) { console.error('Failure capture: '+captureError.message); }
    }
    app.exit(1);
  }
})();
