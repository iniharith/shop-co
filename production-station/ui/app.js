import * as pdfjs from '../node_modules/pdfjs-dist/build/pdf.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('../node_modules/pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;
const $ = id => document.getElementById(id);
const api = window.station;
let state, page = 'queue', lastJobs = '', lastAssets = '', lastSettings = '', lastHistory = '', printers = [];
let slots = [null, null, null, null], toastTimer, pairingTimer;
const thumbnails = new Map(), pendingThumbnails = new Map();
function toast(text, error = false) { clearTimeout(toastTimer); $('toast').textContent = text; $('toast').classList.toggle('error', error); $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, error ? 9000 : 4500); }
async function call(name, ...args) { const result = await api[name](...args); if (!result.ok) throw new Error(result.error); return result.value; }
async function action(button, fn) { if (button?.disabled) return; if (button) button.disabled = true; try { return await fn(); } catch (error) { toast(error.message, true); } finally { if (button) button.disabled = false; } }
function element(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
function button(text, fn, className = 'secondary') { const node = element('button', className, text); node.onclick = () => action(node, fn); return node; }
function date(value) { return new Date(value).toLocaleString('en-MY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
const pageNames = { queue: 'Production queue', layout: 'A4 draft layout', pair: 'Pair Phone', history: 'Print history', settings: 'Settings' };
function navigate(next) {
  page = next;
  for (const name of Object.keys(pageNames)) $('page-' + name).hidden = name !== next;
  document.querySelectorAll('.nav').forEach(node => node.classList.toggle('active', node.dataset.page === next));
  $('pageLabel').textContent = pageNames[next];
  if (next === 'settings') void refreshPrinters();
}
document.querySelectorAll('[data-page]').forEach(node => { node.onclick = () => navigate(node.dataset.page); });
document.querySelectorAll('[data-go]').forEach(node => { node.onclick = () => navigate(node.dataset.go); });
function render(next) {
  state = next;
  $('autoFill').checked = state.settings.autoArrangeDrafts;
  $('autoFill').disabled = !state.settings.downloadDrafts;
  $('scanActionsHint').textContent = [state.settings.downloadToPrint ? 'Download TO PRINT' : '', state.settings.downloadDrafts ? 'Download DRAFT' : '', state.settings.autoAwb ? 'Print available AWB' : 'Save AWB for manual printing', state.settings.autoArrangeDrafts ? 'Arrange drafts on A4' : ''].filter(Boolean).join(' · ');
  const jobs = state.jobs.filter(job => !job.archived);
  const drafts = state.assets.filter(asset => !asset.printedAt);
  $('queueCount').textContent = jobs.length; $('jobCount').textContent = jobs.length;
  $('statJobs').textContent = jobs.length; $('statFiles').textContent = jobs.reduce((count, job) => count + job.files.length + job.labels.length, 0);
  $('statDrafts').textContent = drafts.length; $('statAwbs').textContent = Object.values(state.printed).filter(record => record.status === 'sent').length;
  $('pcName').textContent = state.settings.stationName; $('stationStatus').textContent = state.connected ? state.connectionError ? 'Connection needs attention' : 'Shop-Co signed in' : 'Sign in to connect';
  $('stationDot').classList.toggle('online', state.connected && !state.connectionError);
  $('userName').textContent = state.user?.name || 'Staff sign in'; $('userRole').textContent = state.user?.role || 'Shop-Co account'; $('avatar').textContent = state.user?.name?.slice(0, 2).toUpperCase() || 'KC';
  $('draftPrinterHint').textContent = state.settings.draftPrinter ? 'Printer: ' + state.settings.draftPrinter : 'Choose a draft printer in Settings.';
  const jobHash = JSON.stringify([jobs, state.printed]); if (jobHash !== lastJobs) { lastJobs = jobHash; renderJobs(jobs); }
  const assetHash = JSON.stringify(state.assets); if (assetHash !== lastAssets) { lastAssets = assetHash; if ($('autoFill').checked) autoFill(); renderDrafts(); renderSlots(); }
  const settingHash = JSON.stringify(state.settings); if (settingHash !== lastSettings) { lastSettings = settingHash; fillSettings(); if (state.settings.autoArrangeDrafts) { autoFill(); renderSlots(); renderDrafts(); } }
  const templateSelect = $('templateSelect');
  if (templateSelect.options.length !== state.templates.length) { const selected = templateSelect.value; templateSelect.replaceChildren(...state.templates.map(template => new Option(template.name, template.id))); if (selected) templateSelect.value = selected; }
  renderPhone();
  const historyHash = JSON.stringify([state.printed, state.sheets]); if (lastHistory !== historyHash) { lastHistory = historyHash; renderHistory(); }
}
function renderJobs(jobs) {
  $('jobs').replaceChildren();
  if (!jobs.length) { const empty = element('div', 'empty'); empty.append(element('strong', '', 'Your next job starts with a scan'), element('span', '', 'Pair your phone or paste a Shop-Co task QR link above.')); $('jobs').append(empty); return; }
  for (const job of jobs) {
    const node = element('article', 'job'); const top = element('div', 'job-top'); const title = element('div', 'job-title');
    title.append(element('strong', '', job.title), element('small', '', [job.task?.orderId || 'Manual task', job.task?.customer, job.task?.product, date(job.createdAt), job.source].filter(Boolean).join(' · ')));
    top.append(element('div', 'job-icon', '▧'), title, element('span', 'status ' + job.status, job.status === 'downloaded' ? 'FILES READY' : job.status === 'downloading' ? 'DOWNLOADING ' + (job.progress || '') : job.status.toUpperCase())); node.append(top);
    const footer = element('div', 'job-footer');
    footer.append(element('span', 'file-chip', `${job.files.filter(file => file.tag === 'for_print').length} TO PRINT`), element('span', 'file-chip', `${job.files.filter(file => file.tag === 'draft').length} DRAFT`), element('span', 'file-chip', `${job.labels.length} AWB`));
    const actions = element('div', 'job-actions');
    if (job.folder) actions.append(button('Open folder', () => call('openFolder', job.id)));
    if (!['queued', 'downloading'].includes(job.status)) {
      actions.append(button(job.status === 'error' ? 'Retry download' : 'Refresh files', () => call('retry', job.id)));
      actions.append(button('Archive', () => call('archive', job.id), 'text-button'));
    }
    footer.append(actions); node.append(footer);
    if (job.error || job.warnings.length) node.append(element('div', 'job-warnings', [job.error, ...job.warnings].filter(Boolean).join(' · ')));
    for (const label of job.labels) {
      const ledger = state.printed[label.key]; const row = element('div', 'job-footer');
      row.append(element('span', 'muted', label.name + ' · ' + (ledger?.status === 'sent' ? 'Sent to printer' : ledger ? 'Check printer — uncertain submission' : label.printStatus || 'Ready to print')));
      const printButton = button(ledger ? 'Reprint AWB' : 'Print AWB', () => call('printAwb', { jobId: job.id, labelKey: label.key, reprint: !!ledger })); printButton.style.marginLeft = 'auto'; row.append(printButton); node.append(row);
    }
    $('jobs').append(node);
  }
}
async function renderPdf(bytes, page = 0, maxWidth = 1000) {
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, useSystemFonts: true });
  const pdfDocument = await task.promise;
  try {
    const pdfPage = await pdfDocument.getPage(page + 1); const base = pdfPage.getViewport({ scale: 1 });
    const viewport = pdfPage.getViewport({ scale: Math.min(maxWidth / base.width, maxWidth * 1.5 / base.height) });
    const canvas = document.createElement('canvas'); canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height);
    await pdfPage.render({ canvasContext: canvas.getContext('2d'), canvas, viewport }).promise; return canvas;
  } finally { await pdfDocument.destroy(); }
}
async function thumbnail(id) {
  if (thumbnails.has(id)) return thumbnails.get(id);
  if (pendingThumbnails.has(id)) return pendingThumbnails.get(id);
  const pending = (async () => {
    const file = await call('asset', id); let src;
    if (file.type === 'image') src = file.src;
    else src = (await renderPdf(file.bytes, file.page, 700)).toDataURL('image/png');
    const image = new Image(); image.src = src; await image.decode();
    if (image.naturalWidth > image.naturalHeight) {
      const canvas = document.createElement('canvas'); canvas.width = image.naturalHeight; canvas.height = image.naturalWidth;
      const context = canvas.getContext('2d'); context.translate(canvas.width, 0); context.rotate(Math.PI / 2); context.drawImage(image, 0, 0); src = canvas.toDataURL('image/png');
    }
    thumbnails.set(id, src); pendingThumbnails.delete(id); return src;
  })();
  pendingThumbnails.set(id, pending);
  try { return await pending; } catch (error) { pendingThumbnails.delete(id); throw error; }
}
function renderDrafts() {
  const drafts = state.assets.filter(asset => $('showPrinted').checked || !asset.printedAt);
  $('draftCount').textContent = drafts.length; $('drafts').replaceChildren();
  if (!drafts.length) { $('drafts').append(element('div', 'empty', 'Downloaded drafts will appear here. You can also add local PDF or image drafts.')); return; }
  for (const asset of drafts) {
    const card = element('div', 'draft-card'); card.draggable = true; card.classList.toggle('selected', slots.some(slot => slot?.id === asset.id));
    const image = element('img'); image.alt = asset.name; card.append(image, element('strong', '', asset.name), element('small', '', asset.taskTitle + (asset.type === 'pdf' ? ` · Page ${asset.page + 1}` : '')));
    card.ondragstart = event => { event.dataTransfer.setData('application/kc-draft', JSON.stringify({ id: asset.id })); event.dataTransfer.effectAllowed = 'copy'; };
    card.onclick = () => { const empty = slots.findIndex(slot => !slot); if (empty < 0) { toast('All four slots are filled. Drag a draft onto a slot to replace it.'); return; } slots[empty] = { id: asset.id, rotation: 0 }; renderSlots(); renderDrafts(); };
    void thumbnail(asset.id).then(src => { image.src = src; }).catch(error => { card.append(element('small', 'error', error.message)); });
    $('drafts').append(card);
  }
}
function renderSlots() {
  const margin = Math.max(0, Math.min(20, Number($('margin').value))); const gap = Math.max(0, Math.min(15, Number($('gap').value)));
  $('paper').style.padding = `${margin / 210 * 100}%`;
  // Percent grid gap uses content dimensions; explicit axes keep the preview faithful.
  $('paper').style.columnGap = `${gap / (210 - 2 * margin) * 100}%`; $('paper').style.rowGap = `${gap / (297 - 2 * margin) * 100}%`;
  for (let index = 0; index < 4; index++) {
    const cell = $('slot-' + index); cell.replaceChildren(); const slot = slots[index];
    cell.ondragover = event => { if (!event.dataTransfer.types.includes('application/kc-draft')) return; event.preventDefault(); cell.classList.add('drop'); };
    cell.ondragleave = () => cell.classList.remove('drop');
    cell.ondrop = event => {
      event.preventDefault(); cell.classList.remove('drop');
      try { const data = JSON.parse(event.dataTransfer.getData('application/kc-draft')); if (!state.assets.some(asset => asset.id === data.id)) return; if (Number.isInteger(data.from)) { const previous = slots[index]; slots[index] = slots[data.from]; slots[data.from] = previous; } else slots[index] = { id: data.id, rotation: 0 }; renderSlots(); renderDrafts(); } catch {}
    };
    if (!slot) { const holder = element('div', 'slot-placeholder'); holder.append(element('b', '', '+'), element('span', '', 'Drop draft ' + (index + 1))); cell.append(holder); cell.draggable = false; continue; }
    const asset = state.assets.find(asset => asset.id === slot.id); if (!asset) { slots[index] = null; continue; }
    cell.draggable = true; cell.ondragstart = event => { event.dataTransfer.setData('application/kc-draft', JSON.stringify({ id: slot.id, from: index })); event.dataTransfer.effectAllowed = 'move'; };
    const image = element('img'); image.alt = asset.name; const controls = element('div', 'slot-controls');
    controls.append(button('↻', () => { slot.rotation = (slot.rotation + 90) % 360; renderSlots(); }, ''), button('×', () => { slots[index] = null; renderSlots(); renderDrafts(); }, ''));
    cell.append(image, controls, element('span', 'slot-label', asset.name));
    void thumbnail(asset.id).then(async src => {
      if (slots[index] !== slot || !image.isConnected) return;
      if (slot.rotation) { const source = new Image(); source.src = src; await source.decode(); const canvas = document.createElement('canvas'); const swap = slot.rotation % 180 !== 0; canvas.width = swap ? source.height : source.width; canvas.height = swap ? source.width : source.height; const context = canvas.getContext('2d'); context.translate(canvas.width / 2, canvas.height / 2); context.rotate(slot.rotation * Math.PI / 180); context.drawImage(source, -source.width / 2, -source.height / 2); image.src = canvas.toDataURL(); } else image.src = src;
    }).catch(error => toast(error.message, true));
  }
  $('slotCount').textContent = slots.filter(Boolean).length + ' / 4 drafts';
}
function sheetPayload() { return { slots, margin: Number($('margin').value), gap: Number($('gap').value) }; }
function autoFill() {
  slots = slots.map(slot => slot && state.assets.find(asset => asset.id === slot.id && !asset.printedAt) ? slot : null);
  const available = state.assets.filter(asset => !asset.printedAt && !slots.some(slot => slot?.id === asset.id));
  for (let index = 0; index < 4; index++) if (!slots[index] && available.length) slots[index] = { id: available.shift().id, rotation: 0 };
}
$('autoFill').onchange = async () => { try { await call('settings', { autoArrangeDrafts: $('autoFill').checked }); } catch (error) { $('autoFill').checked = state.settings.autoArrangeDrafts; toast(error.message, true); } };
$('showPrinted').onchange = renderDrafts;
$('autoArrange').onclick = () => { slots = state.assets.filter(asset => !asset.printedAt).slice(0, 4).map(asset => ({ id: asset.id, rotation: 0 })); while (slots.length < 4) slots.push(null); renderSlots(); renderDrafts(); if (!slots.some(Boolean)) toast('Add drafts or scan a task first'); };
$('clearSheet').onclick = () => { slots = [null, null, null, null]; renderSlots(); renderDrafts(); };
$('margin').oninput = renderSlots; $('gap').oninput = renderSlots;
$('templateSelect').onchange = () => { const template = state.templates.find(item => item.id === $('templateSelect').value); if (template) { $('margin').value = template.margin; $('gap').value = template.gap; renderSlots(); } };
$('saveTemplate').onclick = () => $('templateDialog').showModal(); $('cancelTemplate').onclick = () => $('templateDialog').close();
$('templateForm').onsubmit = event => { event.preventDefault(); void action(event.submitter, async () => { const template = await call('template', { name: $('templateName').value, margin: Number($('margin').value), gap: Number($('gap').value) }); $('templateSelect').value = template.id; $('templateDialog').close(); toast('Template saved'); }); };
$('importButton').onclick = () => action($('importButton'), async () => { const errors = await call('import'); if (errors?.length) toast(errors.join(' · '), true); });
$('previewButton').onclick = () => action($('previewButton'), async () => { const bytes = await call('preview', sheetPayload()); const canvas = await renderPdf(bytes, 0, 1200); const target = $('previewCanvas'); target.width = canvas.width; target.height = canvas.height; target.getContext('2d').drawImage(canvas, 0, 0); $('previewDialog').showModal(); });
$('closePreview').onclick = () => $('previewDialog').close();
$('exportButton').onclick = () => action($('exportButton'), async () => { const filename = await call('export', sheetPayload()); if (filename) toast('PDF saved: ' + filename); });
$('printSheet').onclick = () => action($('printSheet'), async () => { await call('printSheet', sheetPayload()); toast('A4 sheet sent to printer. Check the physical output.'); slots = [null, null, null, null]; if ($('autoFill').checked) autoFill(); renderSlots(); renderDrafts(); });

function renderPhone() {
  const phone = state.phone; $('phoneDetails').replaceChildren(element('strong', '', phone?.phoneName || 'No phone paired'), element('small', '', !phone?.phoneName ? 'Generate a pairing QR to connect your phone.' : !phone.approved ? 'Waiting for your approval' : phone.phoneOnline ? 'Approved · phone online' : 'Approved · phone offline'));
  $('approvePhone').hidden = !phone?.phoneName || phone.approved; $('unpairPhone').disabled = !phone?.phoneName;
  $('pairError').textContent = state.connectionError || 'Phone pairing grants scan access only. Task downloads stay on this PC.';
  if (state.lastTest) { $('testStatus').textContent = `Test received from ${state.lastTest.source} at ${date(state.lastTest.at)}`; $('btResult').textContent = $('testStatus').textContent; }
}
$('generatePair').onclick = () => action($('generatePair'), async () => { const pair = await call('pair'); const image = element('img'); image.src = pair.qr; image.alt = 'Phone pairing QR'; $('pairQr').replaceChildren(image); clearInterval(pairingTimer); const update = () => { const seconds = Math.max(0, Math.round((new Date(pair.expiresAt) - Date.now()) / 1000)); $('pairExpiry').textContent = seconds ? `Pairing code expires in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Pairing code expired. Generate a new code.'; if (!seconds) { clearInterval(pairingTimer); $('pairQr').replaceChildren(element('span', '', 'Pairing QR expired')); } }; update(); pairingTimer = setInterval(update, 1000); });
$('pairTelegramBot').onclick = () => action($('pairTelegramBot'), async () => { await call('pairBot'); toast('Telegram bot paired. Approve it here, then copy its credentials to Railway.'); });
$('copyBotStation').onclick = () => action($('copyBotStation'), async () => { await call('copyBotCredential', 'stationId'); toast('Station ID copied for Railway.'); });
$('copyBotKey').onclick = () => action($('copyBotKey'), async () => { await call('copyBotCredential', 'deviceSecret'); toast('Bot key copied. Paste only into Railway; clipboard clears in one minute.'); });
$('approvePhone').onclick = () => action($('approvePhone'), () => call('approve')); $('unpairPhone').onclick = () => action($('unpairPhone'), () => call('unpair')); $('reconnectPhone').onclick = () => action($('reconnectPhone'), () => call('reconnect'));
$('wifiTab').onclick = () => { $('wifiPanel').hidden = false; $('bluetoothPanel').hidden = true; $('wifiTab').classList.add('active'); $('bluetoothTab').classList.remove('active'); };
$('bluetoothTab').onclick = () => { $('wifiPanel').hidden = true; $('bluetoothPanel').hidden = false; $('bluetoothTab').classList.add('active'); $('wifiTab').classList.remove('active'); $('btCode').focus(); };
$('openBluetooth').onclick = () => action($('openBluetooth'), () => call('bluetooth'));
async function receive(code, input) { const result = await call('scan', code); input.value = ''; toast(result.test ? 'Test scan received successfully' : result.duplicate ? 'Task already in queue' : 'Task added to production queue'); }
$('scanForm').onsubmit = event => { event.preventDefault(); void action(event.submitter, () => receive($('scanCode').value, $('scanCode'))); };
$('btForm').onsubmit = event => { event.preventDefault(); void action(event.submitter, () => receive($('btCode').value, $('btCode'))); };
// HID input is only accepted by explicit scan fields, never passwords or settings.
document.addEventListener('keydown', event => { if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey && event.target === document.body && !$('loginDialog').open) { const input = page === 'pair' && !$('bluetoothPanel').hidden ? $('btCode') : page === 'queue' ? $('scanCode') : null; if (input) { input.focus(); input.value += event.key; event.preventDefault(); } } });
function fillSettings() { $('settingName').value = state.settings.stationName; $('settingFolder').value = state.settings.downloadRoot; $('settingBackend').value = state.settings.backend; $('settingAwbPaper').value = state.settings.awbPaper; $('settingAutoAwb').checked = state.settings.autoAwb; $('settingAutoArrange').checked = state.settings.autoArrangeDrafts; $('settingDownloadToPrint').checked = state.settings.downloadToPrint; $('settingDownloadDrafts').checked = state.settings.downloadDrafts; $('settingAutoArrange').disabled = !state.settings.downloadDrafts; fillPrinterOptions(); }
$('settingDownloadDrafts').onchange = () => { $('settingAutoArrange').disabled = !$('settingDownloadDrafts').checked; if (!$('settingDownloadDrafts').checked) $('settingAutoArrange').checked = false; };
function fillPrinterOptions() {
  for (const [id, key] of [['settingDraftPrinter', 'draftPrinter'], ['settingAwbPrinter', 'awbPrinter']]) {
    const names = [...new Set([...printers.map(printer => printer.name), state.settings[key]].filter(name => name && name !== '@windows-default'))];
    const options = [new Option('Select a printer…', ''), ...(key === 'awbPrinter' ? [new Option('Windows default printer', '@windows-default')] : []), ...names.map(name => new Option(name, name))];
    $(id).replaceChildren(...options); $(id).value = state.settings[key];
  }
}
async function refreshPrinters() { await action($('refreshPrinters'), async () => { printers = await call('printers'); fillPrinterOptions(); }); }
$('refreshPrinters').onclick = refreshPrinters;
$('chooseFolder').onclick = () => action($('chooseFolder'), () => call('chooseFolder'));
$('settingsForm').onsubmit = event => { event.preventDefault(); void action(event.submitter, async () => { await call('settings', { stationName: $('settingName').value, awbPrinter: $('settingAwbPrinter').value, draftPrinter: $('settingDraftPrinter').value, awbPaper: $('settingAwbPaper').value, autoAwb: $('settingAutoAwb').checked, autoArrangeDrafts: $('settingAutoArrange').checked, downloadToPrint: $('settingDownloadToPrint').checked, downloadDrafts: $('settingDownloadDrafts').checked }); toast('Station settings saved'); }); };
function renderHistory() {
  for (const id of ['awbHistory', 'sheetHistory']) $(id).replaceChildren();
  const entries = Object.values(state.printed).sort((a, b) => b.at.localeCompare(a.at));
  for (const entry of entries) { const row = element('div', 'history-row'); const title = element('div'); title.append(element('strong', '', entry.name), element('small', '', `${date(entry.at)} · ${entry.printer} · ${entry.attempts} submission(s)`)); row.append(title, element('span', 'status ' + entry.status, entry.status.toUpperCase())); if (entry.error) title.append(element('small', 'error', entry.error)); $('awbHistory').append(row); }
  for (const entry of state.sheets) { const row = element('div', 'history-row'); const title = element('div'); title.append(element('strong', '', `A4 portrait · ${entry.assetIds.length} drafts`), element('small', '', `${date(entry.at)} · ${entry.printer}`)); row.append(title, element('span', 'status ' + entry.status, entry.status.toUpperCase())); if (entry.error) title.append(element('small', 'error', entry.error)); $('sheetHistory').append(row); }
  if (!entries.length) $('awbHistory').append(element('p', 'muted', 'No AWB submissions yet.')); if (!state.sheets.length) $('sheetHistory').append(element('p', 'muted', 'No A4 sheets submitted yet.'));
}
$('accountButton').onclick = async () => { if (state.connected) { await action($('accountButton'), () => call('logout')); } $('loginDialog').showModal(); };
$('loginLater').onclick = () => $('loginDialog').close();
$('showLoginPassword').onchange = () => { $('loginPassword').type = $('showLoginPassword').checked ? 'text' : 'password'; };
for (const eventName of ['keydown', 'keyup']) $('loginPassword').addEventListener(eventName, event => { $('loginCapsLock').hidden = !event.getModifierState('CapsLock'); });
$('loginForm').onsubmit = event => { event.preventDefault(); void action($('loginSubmit'), async () => { $('loginError').textContent = ''; try { const next = await call('login', { email: $('loginEmail').value, password: $('loginPassword').value }); $('loginPassword').value = ''; render(next); $('loginDialog').close(); toast('Signed in. Ready to scan.'); } catch (error) { $('loginError').textContent = error.message; } }); };
setInterval(() => { $('clock').textContent = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }); }, 1000);
api.onUpdate(render);
try { render(await call('state')); renderSlots(); if (!state.connected) $('loginDialog').showModal(); }
catch (error) { toast(error.message, true); }
