const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const dir = './scratch/prices_update/HARGA';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

for (const file of files) {
    try {
        const workbook = xlsx.readFile(path.join(dir, file));
        console.log(`--- ${file} ---`);
        console.log('Sheets:', workbook.SheetNames);
    } catch (e) {
        console.log(`Error reading ${file}:`, e.message);
    }
}
