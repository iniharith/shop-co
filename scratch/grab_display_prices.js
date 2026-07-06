const xlsx = require('xlsx');

const workbook = xlsx.readFile('scratch/prices_update/HARGA/DISPLAY.xlsx');

for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    // Attempt to find the first price by looking for "RM" or numbers in the first 10 rows
    let basePrice = 50;
    for (let r = 0; r < Math.min(10, data.length); r++) {
        for (let c = 0; c < data[r].length; c++) {
            const val = String(data[r][c]);
            if (val.includes('RM')) {
                const match = val.match(/RM\s*([\d,.]+)/);
                if (match) {
                    basePrice = parseFloat(match[1].replace(',', ''));
                    break;
                }
            } else if (!isNaN(parseFloat(val)) && parseFloat(val) > 20 && String(data[r-1] && data[r-1][c]).includes('RM')) {
                basePrice = parseFloat(val);
                break;
            }
        }
    }
    
    console.log(`${sheetName}: ${basePrice}`);
}
