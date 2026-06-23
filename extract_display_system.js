const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('prices.xlsx');
const sheet = workbook.Sheets['DISPLAY SYSTEM'];
const csv = xlsx.utils.sheet_to_csv(sheet);

fs.writeFileSync('DISPLAY_SYSTEM.csv', csv);
console.log('Saved to DISPLAY_SYSTEM.csv');
