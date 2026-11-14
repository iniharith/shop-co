const test = require('node:test');
const assert = require('node:assert/strict');
const { PDFDocument } = require('pdf-lib');
const { designerReportWindow, designerTaskName, designerGroups, createDesignerReportPdf } = require('../dist/shared/utils/designerReport');

test('designer dates cover inclusive Malaysia days and reject invalid or oversized periods', () => {
  const window = designerReportWindow('2026-11-09', '2026-11-14');
  assert.equal(window.start.toISOString(), '2026-11-08T16:00:00.000Z');
  assert.equal(window.endExclusive.toISOString(), '2026-11-14T16:00:00.000Z');
  assert.equal(window.dates.length, 6);
  assert.deepEqual(designerReportWindow('2028-02-29', '2028-02-29').dates, ['2028-02-29']);
  for (const dates of [['2026-02-29', '2026-03-01'], ['2026-11-15', '2026-11-09'], ['2026-01-01', '2026-02-01'], [undefined, '2026-11-14']]) {
    assert.throws(() => designerReportWindow(...dates));
  }
});

test('customer names retain batch distinctions and duplicate tasks remain in their group', () => {
  assert.equal(designerTaskName('AKC | KC homiebdiary | BATCH 2 graduasi', 'DRAFT HOMIEBDIARY.jpg'), 'HOMIEBDIARY - BATCH 2 graduasi');
  assert.equal(designerTaskName('12 JAN 26 | 587138673037641350 | KC customer', undefined, '587138673037641350'), 'customer');
  const groups = designerGroups([1, 2].map(id => ({ id: String(id), title: 'Same', name: 'penn21030', category: 'FRAME' })));
  assert.deepEqual(groups[0].names, ['penn21030 (1)', 'penn21030 (2)']);
});

test('80 customer tasks fit on exactly one A4 and empty days retain their page', async () => {
  const tasks = Array.from({ length: 80 }, (_, i) => ({ id: String(i), title: `Task ${i}`, name: `CUSTOMER_${String(i + 1).padStart(3, '0')}_PHOTOCANVAS`, category: i < 72 ? 'FRAME' : 'ACRYLIC' }));
  const bytes = await createDesignerReportPdf({ staff: { id: 'staff', name: 'HARITH' }, from: '2026-11-09', to: '2026-11-10', timezone: 'Asia/Kuala_Lumpur', generatedAt: new Date().toISOString(), uniqueTasks: 80, taskEntries: 80, days: [{ date: '2026-11-09', tasks }, { date: '2026-11-10', tasks: [] }] });
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 2);
  assert.ok(Math.abs(pdf.getPage(0).getWidth() - 595.3) < 1);
  assert.ok(Math.abs(pdf.getPage(0).getHeight() - 841.9) < 1);
});

test('an unrepresentable number of names fails explicitly instead of dropping tasks', async () => {
  const tasks = Array.from({ length: 500 }, (_, i) => ({ id: String(i), title: `Task ${i}`, name: 'A_very_long_customer_name_that_needs_several_lines_' + i, category: 'FRAME' }));
  await assert.rejects(createDesignerReportPdf({ staff: { id: 'staff', name: 'HARITH' }, from: '2026-11-09', to: '2026-11-09', timezone: 'Asia/Kuala_Lumpur', generatedAt: new Date().toISOString(), uniqueTasks: 500, taskEntries: 500, days: [{ date: '2026-11-09', tasks }] }), error => error.status === 422);
});
