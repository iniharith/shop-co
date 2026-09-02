/** Generate small catalog thumbnails used by product-card surfaces. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDir = path.resolve(__dirname, '../../../../frontend/public/images/catalog');
const outputDir = path.join(sourceDir, 'thumbs');

const main = async () => {
  await fs.mkdir(outputDir, { recursive: true });
  const files = (await fs.readdir(sourceDir)).filter((file) => file.endsWith('.webp'));
  await Promise.all(files.map(async (file) => {
    await sharp(path.join(sourceDir, file))
      .resize({ width: 320, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(path.join(outputDir, file));
  }));
  console.log(`Generated ${files.length} catalog thumbnails in ${outputDir}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
