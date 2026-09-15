const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
async function main() {
  const directory = path.resolve(process.argv[2]);
  const items = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'));
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const source = await fs.readFile(path.join(directory, path.basename(item.svg)));
    await sharp(source, { limitInputPixels: false, svg: { unlimited: true } }).resize(360, 360, { fit: 'inside' }).flatten({ background: '#ffffff' }).webp({ quality: 82 }).toFile(path.join(directory, path.basename(item.preview)));
    console.log(i + 1, item.name, item.slots.length);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
