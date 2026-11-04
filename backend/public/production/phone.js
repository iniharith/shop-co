/* The pairing secret stays in the URL fragment and is removed immediately. */
const $ = id => document.getElementById(id);
const fragment = new URLSearchParams(location.hash.slice(1));
const pendingPair = { stationId: fragment.get('station'), secret: fragment.get('secret') };
history.replaceState(null, '', location.pathname);
let device = JSON.parse(localStorage.getItem('kc-production-phone') || 'null');
if (pendingPair.stationId && pendingPair.secret) device = null;
let stream, sending = false, approved = false, lastCode = '', lastAt = 0, tickAt = 0;
const recent = [];
const canvas = $('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }
async function request(endpoint, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (device) { headers['X-Station-ID'] = device.stationId; headers['X-Phone-Key'] = device.deviceSecret; }
  const response = await fetch('/api/production' + endpoint, { method: body === undefined ? 'GET' : 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) { device = null; localStorage.removeItem('kc-production-phone'); stopCamera(); showPanel(); }
  if (!response.ok) throw new Error(data.message || `Connection failed (${response.status})`);
  return data;
}
function showPanel() {
  $('pairPanel').hidden = !!device; $('scannerPanel').hidden = !device;
  $('pairButton').disabled = !pendingPair.stationId || !pendingPair.secret;
  if (device) $('stationName').textContent = device.stationName;
}
async function status() {
  if (!device) return;
  try {
    const data = await request('/phone-status'); approved = data.approved;
    $('connection').textContent = !approved ? 'Waiting for approval on PC' : data.pcOnline ? 'Connected • PC online' : 'Paired • PC offline; scans will wait in queue';
    $('testButton').disabled = !approved; $('sendButton').disabled = !approved;
  } catch (error) { message(error.message, true); }
}
$('pairButton').onclick = async () => {
  $('pairButton').disabled = true;
  try {
    device = await request('/pair', { ...pendingPair, phoneName: $('phoneName').value || 'Staff phone' });
    localStorage.setItem('kc-production-phone', JSON.stringify(device)); showPanel();
    message('Phone paired. Click Approve Phone on the PC, then start scanning.'); await status();
  } catch (error) { message(error.message, true); $('pairButton').disabled = false; }
};
async function send(code, test = false) {
  if (sending) return;
  if (!approved) { message('Approve this phone on the PC first', true); return; }
  if (localStorage.getItem('kc-production-pending')) { message('Retry your queued scan before scanning another task.', true); addRetryButton(); return; }
  if (!test) {
    let valid = /^[a-f0-9]{48}$/i.test(code.trim());
    try { const url = new URL(code.trim()); valid ||= url.protocol === 'https:' && url.hostname === 'admin.kampungcetak.com' && /^\/task-access\/[a-f0-9]{48}\/?$/i.test(url.pathname); } catch {}
    if (!valid) { message('Scan a Shop-Co task QR code.', true); return; }
  }
  if (!test && code === lastCode && Date.now() - lastAt < 10000) return;
  sending = true;
  try {
    // Reuse this request ID if a response is lost. Pending requests survive reloads.
    const event = { code, test, requestId: crypto.randomUUID() };
    localStorage.setItem('kc-production-pending', JSON.stringify(event));
    await dispatch(event);
    lastCode = code; lastAt = Date.now(); navigator.vibrate?.(80);
  } catch (error) { message(error.message + ' — use Retry queued scan below.', true); addRetryButton(); }
  finally { sending = false; }
}
async function dispatch(event) {
  const data = await request('/scan', event);
  localStorage.removeItem('kc-production-pending');
  message(event.test ? 'Test sent. Waiting for PC…' : 'Scan queued. Waiting for PC…');
  const item = document.createElement('li'); item.textContent = `${new Date().toLocaleTimeString()} • ${event.test ? 'Test scan' : 'Task scan'} • queued`;
  if (!recent.length) $('recent').replaceChildren(); recent.unshift(item); $('recent').prepend(item);
  while (recent.length > 15) recent.pop().remove();
  void receipt(data.id, item, event.test);
}
async function receipt(id, item, test) {
  for (let attempt = 0; attempt < 150 && device; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const data = await request('/scan/' + id);
      if (['ready', 'error'].includes(data.status) || (test && data.status === 'received')) { item.textContent += ' → ' + data.message; message(data.message, data.status === 'error'); return; }
      if (data.status === 'received') message('PC received scan. Downloading files…');
    } catch { return; }
  }
  item.textContent += ' → still waiting; check PC';
}
function addRetryButton() {
  if ($('retryButton') || !localStorage.getItem('kc-production-pending')) return;
  const button = document.createElement('button'); button.id = 'retryButton'; button.textContent = 'Retry queued scan';
  button.onclick = async () => {
    if (sending) return; sending = true;
    try { await dispatch(JSON.parse(localStorage.getItem('kc-production-pending'))); button.remove(); }
    catch (error) { message(error.message, true); }
    finally { sending = false; }
  };
  $('scannerPanel').append(button);
}
function stopCamera() { if (stream) stream.getTracks().forEach(track => track.stop()); stream = null; $('cameraButton').textContent = 'Start camera'; }
$('cameraButton').onclick = async () => {
  if (stream) { stopCamera(); return; }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
    $('video').srcObject = stream; await $('video').play(); $('cameraButton').textContent = 'Stop camera';
    requestAnimationFrame(tick);
  } catch (error) { message('Camera unavailable. Allow camera access or use Scan a photo. ' + error.message, true); }
};
function decode(source, width, height) {
  const ratio = Math.min(1, 1000 / Math.max(width, height)); canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' })?.data;
}
function tick(time) {
  if (!stream) return;
  if (!sending && approved && time - tickAt > 200 && $('video').readyState >= 2) {
    tickAt = time;
    const code = decode($('video'), $('video').videoWidth, $('video').videoHeight);
    if (code) void send(code);
  }
  requestAnimationFrame(tick);
}
$('photoInput').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  try { const image = await createImageBitmap(file); const code = decode(image, image.width, image.height); image.close(); if (!code) throw new Error('No QR found. Try a clearer photo.'); await send(code); }
  catch (error) { message(error.message, true); }
  event.target.value = '';
};
$('sendButton').onclick = () => send($('code').value);
$('testButton').onclick = () => send('', true);
$('disconnectButton').onclick = () => { stopCamera(); device = null; approved = false; localStorage.removeItem('kc-production-phone'); localStorage.removeItem('kc-production-pending'); showPanel(); message('Phone forgotten. Generate a new pairing QR on the PC.'); };
document.addEventListener('visibilitychange', () => { if (document.hidden) stopCamera(); });
showPanel(); addRetryButton(); void status(); setInterval(status, 5000);
