const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getMonthWindow,
  formatBytes,
  formatFileSizeCell,
  escapeCsvCell,
} = require('../dist/shared/utils/monthlyReport.js');

test('month window in Asia/Kuala_Lumpur (UTC+8) is an exclusive [start, end)', () => {
  const w = getMonthWindow('2026-07');
  assert.equal(w.month, '2026-07');
  assert.equal(w.timezone, 'Asia/Kuala_Lumpur');
  assert.equal(w.start.toISOString(), '2026-06-30T16:00:00.000Z');
  assert.equal(w.endExclusive.toISOString(), '2026-07-31T16:00:00.000Z');
});

test('month window uses UTC+8 boundary for the last month of the year', () => {
  const w = getMonthWindow('2026-12');
  assert.equal(w.start.toISOString(), '2026-11-30T16:00:00.000Z');
  assert.equal(w.endExclusive.toISOString(), '2026-12-31T16:00:00.000Z');
});

test('month window respects a custom timezone', () => {
  const w = getMonthWindow('2026-07', 'UTC');
  assert.equal(w.start.toISOString(), '2026-07-01T00:00:00.000Z');
  assert.equal(w.endExclusive.toISOString(), '2026-08-01T00:00:00.000Z');
});

test('rejects invalid month strings', () => {
  assert.throws(() => getMonthWindow('2026-13'), /Invalid month/);
  assert.throws(() => getMonthWindow('2026-7'), /Invalid month/);
  assert.throws(() => getMonthWindow('07-2026'), /Invalid month/);
  assert.throws(() => getMonthWindow(''), /Invalid month/);
  assert.throws(() => getMonthWindow(undefined), /Invalid month/);
});

test('formatBytes handles zero, positive and large values', () => {
  assert.deepEqual(formatBytes(0), { mb: '0.00 MB', gb: '0.00 GB' });
  assert.deepEqual(formatBytes(5 * 1024 * 1024), { mb: '5.00 MB', gb: '0.00 GB' });
  assert.deepEqual(formatBytes(1024 * 1024 * 1024), { mb: '1024.00 MB', gb: '1.00 GB' });
});

test('formatFileSizeCell combines MB and GB', () => {
  assert.equal(formatFileSizeCell(2 * 1024 * 1024 * 1024), '2048.00 MB (2.00 GB)');
  assert.equal(formatFileSizeCell(0), '0.00 MB (0.00 GB)');
});

test('escapeCsvCell quotes only when needed and doubles embedded quotes', () => {
  assert.equal(escapeCsvCell('plain'), 'plain');
  assert.equal(escapeCsvCell('has,comma'), '"has,comma"');
  assert.equal(escapeCsvCell('line\nbreak'), '"line\nbreak"');
  assert.equal(escapeCsvCell('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCsvCell(null), '');
  assert.equal(escapeCsvCell(undefined), '');
  assert.equal(escapeCsvCell(123), '123');
});
