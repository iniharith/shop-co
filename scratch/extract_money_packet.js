const xlsx = require('xlsx');
const fs = require('fs');
const workbook = xlsx.readFile('prices.xlsx');
const sheet = workbook.Sheets['MONEY PACKET'];
if (sheet) {
    const csv = xlsx.utils.sheet_to_csv(sheet);
    fs.writeFileSync('MONEY_PACKET.csv', csv);
    console.log('Saved MONEY_PACKET.csv');
} else {
    console.log('Sheet MONEY PACKET not found');
}
