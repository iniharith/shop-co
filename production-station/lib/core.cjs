const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function tokenFromScan(value) {
  if (typeof value !== 'string') throw new Error('Scan a Shop-Co task QR');
  const input = value.trim();
  if (/^[a-f0-9]{48}$/i.test(input)) return input.toLowerCase();
  try {
    const url = new URL(input);
    const match = /^\/task-access\/([a-f0-9]{48})\/?$/i.exec(url.pathname);
    if (url.protocol === 'https:' && url.hostname === 'admin.kampungcetak.com' && match) return match[1].toLowerCase();
  } catch {}
  throw new Error('This QR is not a Shop-Co task link');
}
function safeName(value) {
  let name = String(value || 'file').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/g, '').slice(0, 120);
  if (!name || name === '.' || name === '..') name = 'file';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) name = '_' + name;
  return name;
}
function fileKey(file) { return crypto.createHash('sha256').update(`${file.id}:${file.version}`).digest('hex'); }
function atomicWrite(filename, value) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const temporary = filename + '.writing';
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2));
  fs.renameSync(temporary, filename);
}
function loadState(filename) {
  if (!fs.existsSync(filename)) return { jobs: [], assets: [], receipts: [], printed: {}, templates: [{ id: 'default', name: 'Four portrait drafts', margin: 5, gap: 3 }], sheets: [] };
  // A damaged state file must not reset the print ledger and cause duplicate labels.
  const state = JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (!Array.isArray(state.jobs) || !state.printed) throw new Error('Production history is damaged. Restore the state file before printing.');
  for (const job of state.jobs) if (job.status === 'downloading') { job.status = 'error'; job.error = 'Interrupted download. Retry this job.'; }
  for (const entry of Object.values(state.printed)) if (entry.status === 'submitting') entry.status = 'uncertain';
  for (const sheet of state.sheets || []) if (sheet.status === 'submitting') sheet.status = 'uncertain';
  return state;
}
module.exports = { tokenFromScan, safeName, fileKey, atomicWrite, loadState };
