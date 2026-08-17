const path = require('path');
const puppeteer = require('../backend/admin/node_modules/puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const input = path.resolve(__dirname, '../docs/sublimation-manager-staff-manual.html');
  const output = path.resolve(__dirname, '../docs/Sublimation-Manager-Staff-Manual.pdf');
  await page.goto(`file:///${input.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
  await page.pdf({ path: output, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  console.log(output);
}

main().catch((error) => { console.error(error); process.exit(1); });
