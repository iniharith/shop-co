const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { PDFDocument, degrees, rgb } = require('pdf-lib');
const QRCode = require('qrcode');
const jsQR = require('jsqr');
const sharp = require('sharp');
const { MM, slots, fit, buildSheet } = require('../lib/layout.cjs');
const { tokenFromScan, safeName, fileKey, atomicWrite, loadState } = require('../lib/core.cjs');
const { isPrivate } = require('../lib/download.cjs');

test('task scan accepts existing QR links and rejects lookalikes', () => {
  const token = 'ab'.repeat(24);
  assert.equal(tokenFromScan(`https://admin.kampungcetak.com/task-access/${token}`), token);
  assert.equal(tokenFromScan(token.toUpperCase()), token);
  for (const link of [`https://admin.kampungcetak.com.evil.test/task-access/${token}`, `http://admin.kampungcetak.com/task-access/${token}`, `https://evil.test/${token}`, '../../file', 'a'.repeat(47)]) assert.throws(() => tokenFromScan(link));
});
test('download names stay in one folder, and reject Windows device names', () => {
  assert.equal(safeName('../CON.pdf'), '.._CON.pdf');
  assert.equal(safeName('CON.pdf'), '_CON.pdf');
  assert.ok(!safeName('a/b\\c:*?').includes('/')); assert.ok(!safeName('a/b\\c:*?').includes('\\'));
  assert.equal(fileKey({ id: 'parcel:one', version: 'AWB123' }), fileKey({ id: 'parcel:one', version: 'AWB123' }));
  assert.notEqual(fileKey({ id: 'parcel:one', version: 'AWB123' }), fileKey({ id: 'parcel:one', version: 'AWB124' }));
});
test('four equal portrait slots stay inside A4 with margins and no overlap', () => {
  const cells = slots(5, 3);
  for (const cell of cells) { assert.ok(cell.width < cell.height); assert.ok(cell.x >= 5 * MM); assert.ok(cell.y >= 5 * MM - .001); assert.ok(cell.x + cell.width <= 205 * MM + .001); assert.ok(cell.y + cell.height <= 292 * MM + .001); }
  assert.ok(cells[0].x + cells[0].width < cells[1].x); assert.ok(cells[2].y + cells[2].height < cells[0].y);
  for (const rotation of [0, 90, 180, 270]) { const value = fit(148 * MM, 210 * MM, cells[0], rotation); assert.ok(value.box.width <= cells[0].width + .001); assert.ok(value.box.height <= cells[0].height + .001); assert.ok(value.box.x >= cells[0].x - .001); }
  assert.throws(() => slots(30, 3));
});
test('restart preserves label deduplication and marks interrupted submissions uncertain', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'kc-ledger-')); const filename = path.join(folder, 'state.json');
  try {
    atomicWrite(filename, { jobs: [{ status: 'downloading' }], printed: { one: { status: 'sent' }, two: { status: 'submitting' } }, sheets: [{ status: 'submitting' }] });
    const state = loadState(filename); assert.equal(state.jobs[0].status, 'error'); assert.equal(state.printed.one.status, 'sent'); assert.equal(state.printed.two.status, 'uncertain'); assert.equal(state.sheets[0].status, 'uncertain');
    await fs.writeFile(filename, '{bad'); assert.throws(() => loadState(filename));
  } finally { await fs.rm(folder, { recursive: true, force: true }); }
});
test('download rejects private network addresses', () => {
  for (const ip of ['127.0.0.1', '10.1.1.1', '192.168.1.3', '172.16.0.3', '::1', 'fe80::abcd', '::ffff:127.0.0.1', '169.254.169.254']) assert.equal(isPrivate(ip), true, ip);
  for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) assert.equal(isPrivate(ip), false, ip);
});
test('four A5 vector PDFs become exactly one portrait A4, all four QR codes decode at 150 dpi', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'kc-a4-'));
  try {
    const items = [], expected = [];
    for (let index = 0; index < 4; index++) {
      const code = `https://admin.kampungcetak.com/task-access/${String(index + 1).repeat(48)}`; expected.push(code);
      const pdf = await PDFDocument.create(); const page = pdf.addPage([148 * MM, 210 * MM]);
      page.drawRectangle({ x: 0, y: 0, width: 148 * MM, height: 210 * MM, color: rgb(1, 1, 1) });
      const qr = await pdf.embedPng(await QRCode.toBuffer(code, { width: 900, margin: 2, errorCorrectionLevel: 'H' }));
      page.drawImage(qr, { x: 80 * MM, y: 143 * MM, width: 58 * MM, height: 58 * MM });
      page.drawText(`DRAFT ${index + 1}`, { x: 12 * MM, y: 120 * MM, size: 22 });
      page.drawRectangle({ x: 3 * MM, y: 3 * MM, width: 142 * MM, height: 204 * MM, borderWidth: 1, borderColor: rgb(.2, .5, .3) });
      const filename = path.join(folder, `draft-${index}.pdf`); await fs.writeFile(filename, await pdf.save()); items.push({ path: filename });
      const output = path.join(__dirname, '../test-output'); await fs.mkdir(output, { recursive: true }); await fs.copyFile(filename, path.join(output, `sample-draft-${index + 1}.pdf`));
    }
    const sheet = await buildSheet(items); const document = await PDFDocument.load(sheet);
    assert.equal(document.getPageCount(), 1); assert.ok(Math.abs(document.getPage(0).getWidth() - 210 * MM) < .001); assert.ok(document.getPage(0).getHeight() > document.getPage(0).getWidth());
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { createCanvas } = require('@napi-rs/canvas');
    const rendered = await pdfjs.getDocument({ data: new Uint8Array(sheet), isEvalSupported: false, useSystemFonts: true }).promise;
    const page = await rendered.getPage(1), viewport = page.getViewport({ scale: 150 / 72 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvasContext: canvas.getContext('2d'), canvas, viewport }).promise;
    const context = canvas.getContext('2d');
    for (let index = 0; index < 4; index++) {
      const x = Math.floor((index % 2) * canvas.width / 2), y = Math.floor(Math.floor(index / 2) * canvas.height / 2);
      const width = Math.floor(canvas.width / 2), height = Math.floor(canvas.height / 2);
      const decoded = jsQR(context.getImageData(x, y, width, height).data, width, height);
      assert.equal(decoded?.data, expected[index], `QR slot ${index + 1} must decode`);
    }
    const output = path.join(__dirname, '../test-output'); await fs.mkdir(output, { recursive: true });
    await fs.writeFile(path.join(output, 'four-drafts-A4.pdf'), sheet); await fs.writeFile(path.join(output, 'four-drafts-A4.png'), canvas.toBuffer('image/png'));
    await rendered.destroy();
  } finally { await fs.rm(folder, { recursive: true, force: true }); }
});
test('image and landscape PDF drafts fit whole, partial sheets remain one A4 page', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'kc-image-'));
  try {
    const filename = path.join(folder, 'landscape.png'); await sharp({ create: { width: 800, height: 400, channels: 4, background: '#11aa77' } }).png().toFile(filename);
    const pdf = await PDFDocument.create(); const page = pdf.addPage([210 * MM, 148 * MM]); page.setRotation(degrees(90)); page.drawText('Rotated landscape PDF', { x: 30, y: 30 }); const pdfFile = path.join(folder, 'rotated.pdf'); await fs.writeFile(pdfFile, await pdf.save());
    const sheet = await PDFDocument.load(await buildSheet([{ path: filename }, { path: pdfFile }, null, null])); assert.equal(sheet.getPageCount(), 1);
    await assert.rejects(() => buildSheet([null, null, null, null]));
  } finally { await fs.rm(folder, { recursive: true, force: true }); }
});
