const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
(async () => {
  const png = await sharp(path.join(__dirname, 'assets/icon.svg')).resize(256, 256).png().toBuffer();
  await fs.writeFile(path.join(__dirname, 'assets/icon.png'), png);
  const header = Buffer.alloc(22); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4); header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
  await fs.writeFile(path.join(__dirname, 'assets/icon.ico'), Buffer.concat([header, png]));
  const drawable = path.join(__dirname, 'android/res/drawable'); await fs.mkdir(drawable, { recursive: true }); await fs.writeFile(path.join(drawable, 'kc_icon.png'), png);
})().catch(error => { console.error(error); process.exit(1); });
