'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { designerDates, downloadDesignerReport, sendDesignerReport } = require('../designer-report');

test('designer command dates use Malaysia time and support this week or an inclusive range', () => {
  const now = new Date('2026-11-13T23:00:00Z');
  assert.deepEqual(designerDates('', now), { from: '2026-11-14', to: '2026-11-14' });
  assert.deepEqual(designerDates('week', now), { from: '2026-11-09', to: '2026-11-14' });
  assert.deepEqual(designerDates('2026-11-09 2026-11-14'), { from: '2026-11-09', to: '2026-11-14' });
  for (const input of ['2026-02-30', '2026-11-14 2026-11-09', '2026-01-01 2026-02-01', 'today extra words']) assert.throws(() => designerDates(input));
});

test('PDF download uses the staff API, refreshes once and sends the file as a document', async () => {
  let calls = 0;
  let refreshed = 0;
  const report = await downloadDesignerReport({
    argument: '2026-11-09', actorId: '6a27802984f93088b118c84c', baseUrl: 'https://shop-co.example',
    session: { getAccessToken: async () => 'test-token', refreshAccessToken: async () => { refreshed++; } },
    fetchImpl: async (url, options) => {
      assert.equal(url.pathname, '/api/admin/reports/designer/pdf');
      assert.equal(url.searchParams.get('userId'), '6a27802984f93088b118c84c');
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      calls++;
      return calls === 1 ? new Response('{}', { status: 401 }) : new Response('%PDF-test', { headers: { 'content-type': 'application/pdf' } });
    },
  });
  assert.equal(refreshed, 1);
  assert.equal(report.bytes.toString(), '%PDF-test');
  await sendDesignerReport({ report, token: 'test-bot-token', chat: '123', fetchImpl: async (_url, options) => {
    assert.equal(options.body.get('chat_id'), '123');
    assert.equal(options.body.get('document').name, 'designer-report-2026-11-09-2026-11-09.pdf');
    return new Response('{"ok":true}');
  } });
});

test('download rejects login pages and reports backend layout errors without sending a file', async () => {
  const config = { argument: '2026-11-09', actorId: '6a27802984f93088b118c84c', baseUrl: 'https://shop-co.example', session: { getAccessToken: async () => 'token' } };
  await assert.rejects(downloadDesignerReport({ ...config, fetchImpl: async () => new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }) }), /did not return a PDF/);
  await assert.rejects(downloadDesignerReport({ ...config, fetchImpl: async () => new Response('{"message":"Too many tasks"}', { status: 422 }) }), /Too many tasks/);
});
