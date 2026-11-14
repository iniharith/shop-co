'use strict';

function designerDates(argument, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const parts = argument.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1 && parts[0].toLowerCase() === 'week') {
    const monday = new Date(`${today}T00:00:00Z`);
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
    return { from: monday.toISOString().slice(0, 10), to: today };
  }
  if (parts.length > 2 || parts.some(day => !/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(`${day}T00:00:00Z`)) || new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day)) {
    throw new Error('Use /designer [YYYY-MM-DD [YYYY-MM-DD]] or /designer week.');
  }
  const from = parts[0] || today;
  const to = parts[1] || from;
  const count = (Date.parse(to) - Date.parse(from)) / 86400000 + 1;
  if (count < 1 || count > 31) throw new Error('Choose an inclusive date range of 1–31 days.');
  return { from, to };
}

async function downloadDesignerReport({ argument, actorId, baseUrl, session, fetchImpl = fetch }) {
  const dates = designerDates(argument);
  if (!/^[a-f\d]{24}$/i.test(actorId || '')) throw new Error('Designer reports require ADMIN_REPORT_ACTOR_ID.');
  const url = new URL('/api/admin/reports/designer/pdf', baseUrl);
  if (url.protocol !== 'https:') throw new Error('Shop-Co URL must use HTTPS.');
  url.search = new URLSearchParams({ ...dates, userId: actorId }).toString();
  let response;
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await session.getAccessToken();
    response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(60000) });
    if (response.status !== 401 || attempt) break;
    await response.body?.cancel();
    await session.refreshAccessToken();
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(typeof error.message === 'string' ? error.message : `Designer report failed (${response.status}).`);
  }
  if (!response.headers.get('content-type')?.includes('application/pdf')) throw new Error('Designer report did not return a PDF.');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 10 * 1024 * 1024) throw new Error('Designer report exceeds the 10 MB download limit.');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes = Buffer.concat(chunks);
  if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('Invalid designer report PDF.');
  return { bytes, filename: `designer-report-${dates.from}-${dates.to}.pdf`, ...dates };
}

async function sendDesignerReport({ report, token, chat, fetchImpl = fetch }) {
  const body = new FormData();
  body.set('chat_id', chat);
  body.set('caption', `Report Harian Designer · ${report.from} – ${report.to}\nMalaysia time · one A4 per day · SELESAI`);
  body.set('document', new Blob([report.bytes], { type: 'application/pdf' }), report.filename);
  const response = await fetchImpl(`https://api.telegram.org/bot${token}/sendDocument`, { method: 'POST', body, signal: AbortSignal.timeout(60000) });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(`Telegram document delivery failed (${response.status}).`);
}

module.exports = { designerDates, downloadDesignerReport, sendDesignerReport };
