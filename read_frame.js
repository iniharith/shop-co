const xlsx = require('xlsx');

const workbook = xlsx.readFile('prices.xlsx');
const sheetName = 'FRAME';

if (workbook.Sheets[sheetName]) {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log("\\n--- Data from " + sheetName + " ---");
    data.forEach(row => console.log(row.join(',')));
} else {
    console.log("Could not find FRAME sheet.");
}
