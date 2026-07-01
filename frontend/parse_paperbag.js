/**
 * Coded by Harith
 * Kampungcetak ®
 */
const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('../prices.xlsx');
const sheet = workbook.Sheets['PAPER BAG'];
// Generate a 2D array of rows
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

let pricingData = [];
let currentMaterial = '';
let currentLamination = '';
let designs = [];

rows.forEach((row, i) => {
  if (!row || row.length === 0) return;
  
  const col0 = row[0];
  const col1 = row[1];
  
  if (col1 && typeof col1 === 'string' && (col1.includes('157gsm') || col1.includes('210gsm'))) {
    currentMaterial = col1.trim();
  } else if (col1 && typeof col1 === 'string' && col1.includes('Lamination')) {
    currentLamination = col1.replace(/\(4C \+ 0C\)/gi, '').replace(/\(4c\)/gi, '').trim();
    currentLamination = currentLamination.replace(/\u00A0/g, ' ').trim();
  } else if (col1 && typeof col1 === 'string' && col1.includes('PB01')) {
    // Extract designs from this row
    designs = row.slice(1).filter(d => typeof d === 'string' && d.trim().startsWith('PB'));
  } else if (col0 && !isNaN(parseInt(col0))) {
    const qty = parseInt(col0);
    if (qty >= 100) {
      designs.forEach((design, idx) => {
         const priceStr = row[idx + 1];
         if (priceStr !== undefined && priceStr !== null) {
            let price = 0;
            if (typeof priceStr === 'number') {
              price = priceStr;
            } else if (typeof priceStr === 'string') {
              price = parseFloat(priceStr.replace(/\"/g, '').replace('MYR', '').replace(/,/g, '').trim());
            }
            if (!isNaN(price)) {
              pricingData.push({
                 material: currentMaterial,
                 lamination: currentLamination,
                 design: design,
                 qty: qty,
                 price: price
              });
            }
         }
      });
    }
  }
});

let matrixRows = [];
let grouped = {};

pricingData.forEach(item => {
  const key = `${item.material}|${item.lamination}|${item.design}`;
  if (!grouped[key]) {
    grouped[key] = {
      material: item.material,
      lamination: item.lamination,
      design: item.design,
      quantityPrices: {}
    };
    matrixRows.push(grouped[key]);
  }
  grouped[key].quantityPrices[item.qty] = item.price;
});

fs.writeFileSync('paperbag_prices.json', JSON.stringify(matrixRows, null, 2));
console.log('Saved to paperbag_prices.json, total rows: ' + matrixRows.length);
