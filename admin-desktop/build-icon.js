const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const path = require('path');
const fs = require('fs');

async function buildIcon() {
  const inputPath = path.join(__dirname, '../backend/admin/public/logo.png');
  const pngPath = path.join(__dirname, 'icon.png');
  const icoPath = path.join(__dirname, 'icon.ico');
  
  console.log('Generating icon with black background...');
  
  try {
    await sharp(inputPath)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(pngPath);
    
    const buf = await pngToIco(pngPath);
    fs.writeFileSync(icoPath, buf);
    
    console.log('Icon generated successfully as PNG and ICO!');
  } catch (error) {
    console.error('Error generating icon:', error);
  }
}

buildIcon();
