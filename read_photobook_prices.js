const xlsx = require('xlsx');

const workbook = xlsx.readFile('prices.xlsx');
console.log("Sheet names:", workbook.SheetNames);

const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('kad kahwin') || s.toLowerCase().includes('wedding') || s.toLowerCase().includes('photobook') || s.toLowerCase().includes('kad'));

if (sheetName) {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log("\\n--- Data from " + sheetName + " ---");
    data.forEach(row => console.log(row.join(',')));
} else {
    console.log("Could not find a relevant sheet.");
}
