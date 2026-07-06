const xlsx = require('xlsx');
const workbook = xlsx.readFile('scratch/prices_update/HARGA/DISPLAY.xlsx');
const sheet = workbook.Sheets['POPUP BACKDROP'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
console.log(data);
