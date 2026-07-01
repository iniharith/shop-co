/**
 * Coded by Harith
 * Kampungcetak ®
 */
const xlsx = require('xlsx');

const workbook = xlsx.readFile('prices.xlsx');
for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = xlsx.utils.sheet_to_csv(sheet);
    if (csv.toLowerCase().includes('personal')) {
        console.log('Found in sheet:', sheetName);
    }
}
console.log('Done searching for personal/personalised');
