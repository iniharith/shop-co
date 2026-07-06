const xlsx = require('xlsx');

function printFirst5Rows(file, sheetName) {
    try {
        const workbook = xlsx.readFile(file);
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            console.log(`Sheet ${sheetName} not found in ${file}`);
            return;
        }
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`--- ${file} [${sheetName}] ---`);
        console.log(data.slice(0, 10));
    } catch (e) {
        console.log(`Error reading ${file}:`, e.message);
    }
}

console.log('OLD PRICING FORMAT:');
printFirst5Rows('prices.xlsx', 'A3 FLYERS');

console.log('\nNEW PRICING FORMAT:');
printFirst5Rows('scratch/prices_update/HARGA/DIGITAL OFSET.xlsx', 'A3 FLYERS');
