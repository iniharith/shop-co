const xlsx = require('xlsx');

const file = 'C:\\Users\\PRINTARA\\Downloads\\jadual_berat_kertas_A5_A4_A3.xlsx';
try {
    const workbook = xlsx.readFile(file);
    for (const sheetName of workbook.SheetNames) {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        console.log(data.slice(0, 20));
    }
} catch (e) {
    console.log(`Error reading ${file}:`, e.message);
}
