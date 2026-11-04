const { PDFDocument, degrees, rgb } = require('pdf-lib');
const fs = require('node:fs/promises');
const sharp = require('sharp');
const MM = 72 / 25.4;

function slots(margin = 5, gap = 3) {
  if (!Number.isFinite(margin) || margin < 0 || margin > 20 || !Number.isFinite(gap) || gap < 0 || gap > 15) throw new Error('Invalid page margins or spacing');
  const width = (210 - margin * 2 - gap) / 2;
  const height = (297 - margin * 2 - gap) / 2;
  return Array.from({ length: 4 }, (_, index) => ({
    x: (margin + (index % 2) * (width + gap)) * MM,
    y: (297 - margin - (Math.floor(index / 2) + 1) * height - Math.floor(index / 2) * gap) * MM,
    width: width * MM, height: height * MM,
  }));
}

function fit(width, height, slot, rotation = 0) {
  const turn = ((rotation % 360) + 360) % 360;
  if (![0, 90, 180, 270].includes(turn)) throw new Error('Rotate in 90 degree steps');
  const swapped = turn === 90 || turn === 270;
  const scale = Math.min(slot.width / (swapped ? height : width), slot.height / (swapped ? width : height));
  const w = width * scale, h = height * scale;
  const boxW = swapped ? h : w, boxH = swapped ? w : h;
  const left = slot.x + (slot.width - boxW) / 2;
  const bottom = slot.y + (slot.height - boxH) / 2;
  const offset = turn === 90 ? [h, 0] : turn === 180 ? [w, h] : turn === 270 ? [0, w] : [0, 0];
  return { x: left + offset[0], y: bottom + offset[1], width: w, height: h, rotate: degrees(turn), box: { x: left, y: bottom, width: boxW, height: boxH } };
}

async function buildSheet(items, options = {}) {
  if (!Array.isArray(items) || items.length !== 4 || !items.some(Boolean)) throw new Error('Place between one and four drafts');
  const output = await PDFDocument.create();
  output.setTitle('KC Production — four drafts / A4 portrait');
  const page = output.addPage([210 * MM, 297 * MM]);
  page.drawRectangle({ x: 0, y: 0, width: 210 * MM, height: 297 * MM, color: rgb(1, 1, 1) });
  const cells = slots(options.margin ?? 5, options.gap ?? 3);
  for (let index = 0; index < 4; index++) {
    const item = items[index];
    if (!item) continue;
    const bytes = await fs.readFile(item.path);
    let embedded;
    if (bytes.subarray(0, 5).toString() === '%PDF-') {
      const document = await PDFDocument.load(bytes);
      const source = document.getPage(item.page || 0);
      // Embedding keeps vector artwork and QR codes sharp on the printed sheet.
      [embedded] = await output.embedPages([source]);
      const auto = source.getRotation().angle;
      const sourceRotation = ((-auto % 360) + 360) % 360;
      const portraitRotation = (sourceRotation === 90 || sourceRotation === 270 ? embedded.height > embedded.width : embedded.width > embedded.height) ? 270 : 0;
      page.drawPage(embedded, fit(embedded.width, embedded.height, cells[index], sourceRotation + portraitRotation - (item.rotation || 0)));
    } else {
      const png = await sharp(bytes, { limitInputPixels: 100000000 }).rotate().png().toBuffer();
      embedded = await output.embedPng(png);
      const portraitRotation = embedded.width > embedded.height ? 270 : 0;
      page.drawImage(embedded, fit(embedded.width, embedded.height, cells[index], portraitRotation - (item.rotation || 0)));
    }
  }
  return Buffer.from(await output.save());
}

async function imagePdf(source, paper = 'A6') {
  const bytes = await fs.readFile(source);
  if (bytes.subarray(0, 5).toString() === '%PDF-') { await PDFDocument.load(bytes); return bytes; }
  const png = await sharp(bytes).rotate().png().toBuffer();
  const output = await PDFDocument.create();
  const sizes = { A4: [210, 297], A5: [148, 210], A6: [105, 148], '100x150': [100, 150] };
  const size = sizes[paper] || sizes.A6;
  const page = output.addPage(size.map(n => n * MM));
  const image = await output.embedPng(png);
  page.drawImage(image, fit(image.width, image.height, { x: 0, y: 0, width: size[0] * MM, height: size[1] * MM }));
  return Buffer.from(await output.save());
}
module.exports = { MM, slots, fit, buildSheet, imagePdf };
