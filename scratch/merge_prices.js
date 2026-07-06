const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const dir = './scratch/prices_update/HARGA';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

const newWorkbook = xlsx.utils.book_new();

// Mapping of New Sheet Names to Old Sheet Names for the dynamic scripts
const sheetMapping = {
    'BUSINESS CARD': 'BIZ CARD',
    'WEDDING CARD': 'KAD KAHWIN',
    'SUBLIMATION TSHIRT': 'BAJU SUBLIMATION',
    'MUG': 'MUG PRINTING',
    'BUNTTING': 'BANNER BUNTING', // Temporary fallback, though old sheet had both banner & bunting
    // Others stay the same or don't matter for the dynamic scripts (like A3 FLYERS, A4 FLYERS, MONEY PACKET)
};

for (const file of files) {
    try {
        const workbook = xlsx.readFile(path.join(dir, file));
        for (const sheetName of workbook.SheetNames) {
            const finalSheetName = sheetMapping[sheetName] || sheetName;
            
            // Avoid duplicate sheet names (e.g. money packet is in both premium gift and digital offset)
            if (newWorkbook.SheetNames.includes(finalSheetName)) {
                xlsx.utils.book_append_sheet(newWorkbook, workbook.Sheets[sheetName], finalSheetName + ' 2');
            } else {
                xlsx.utils.book_append_sheet(newWorkbook, workbook.Sheets[sheetName], finalSheetName);
            }
        }
    } catch (e) {
        console.log(`Error reading ${file}:`, e.message);
    }
}

xlsx.writeFile(newWorkbook, 'prices.xlsx');
console.log('Successfully created merged prices.xlsx with ' + newWorkbook.SheetNames.length + ' sheets.');
