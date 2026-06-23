const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('../prices.xlsx');
const sheet = workbook.Sheets['PAPER BAG'];
const csv = xlsx.utils.sheet_to_csv(sheet);
const lines = csv.split('\n');

let pricingData = [];
let currentMaterial = '';
let currentLamination = '';
let designs = [];

lines.forEach((line, i) => {
  const parts = line.split(',');
  if (parts[1] && (parts[1].includes('157gsm') || parts[1].includes('210gsm'))) {
    currentMaterial = parts[1].trim();
  } else if (parts[1] && parts[1].includes('Lamination')) {
    // Remove the "(4C + 0C)" or "(4c)" part and clean up extra spaces
    currentLamination = parts[1].replace(/\(4C \+ 0C\)/gi, '').replace(/\(4c\)/gi, '').trim();
    // Also remove the extra non-breaking space if it exists
    currentLamination = currentLamination.replace(/\u00A0/g, ' ').trim();
  } else if (parts[1] && parts[1].includes('PB01')) {
    designs = parts.slice(1).filter(d => d.trim().startsWith('PB'));
  } else if (parts[0] && !isNaN(parseInt(parts[0]))) {
    const qty = parseInt(parts[0]);
    if (qty >= 100) {
      designs.forEach((design, idx) => {
         const priceStr = parts[idx + 1];
         if (priceStr && priceStr.trim() !== '') {
            const price = parseFloat(priceStr.replace(/\"/g, '').replace('MYR', '').replace(/,/g, '').trim());
            pricingData.push({
               material: currentMaterial,
               lamination: currentLamination,
               design: design,
               qty: qty,
               price: price
            });
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
