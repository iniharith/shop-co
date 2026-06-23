const fs = require('fs');
const data = JSON.parse(fs.readFileSync('parsed_prices.json', 'utf8'));

// Format: 
// pricingData: [ { material, laminate, quantityPrices: { '300': { A3: 100, A4: 50, A5: 25 }, ... } } ]

const materials = ['80gsm Simili Paper', '100gsm Simili Paper', '85gsm Art Paper', '105gsm Art Paper', '128gsm Art Paper', '157gsm Art Paper', '260gsm Art Card', '310gsm Art Card'];

const pricingData = [];

for (const mat of materials) {
    for (const side of ['4C + 0C', '4C + 4C']) {
        // Collect all quantities across A3, A4, A5
        const quantities = new Set();
        for (const size of ['A3', 'A4', 'A5']) {
            if (data[size] && data[size][mat] && data[size][mat][side]) {
                Object.keys(data[size][mat][side]).forEach(q => quantities.add(parseInt(q)));
            }
        }
        
        if (quantities.size === 0) continue;
        
        const sortedQty = Array.from(quantities).sort((a,b) => a-b);
        const quantityPrices = {};
        
        for (const q of sortedQty) {
            quantityPrices[q] = {};
            for (const size of ['A3', 'A4', 'A5']) {
                if (data[size] && data[size][mat] && data[size][mat][side] && data[size][mat][side][q]) {
                    quantityPrices[q][size] = data[size][mat][side][q];
                }
            }
            if (Object.keys(quantityPrices[q]).length === 0) delete quantityPrices[q];
        }
        
        if (Object.keys(quantityPrices).length > 0) {
            pricingData.push({
                material: mat,
                laminate: side,
                quantityPrices
            });
        }
    }
}

const jsCode = 'export const flyerMatrixPricing = ' + JSON.stringify(pricingData, null, 2) + ';';
fs.writeFileSync('flyer_matrix.js', jsCode);
console.log('Built flyer_matrix.js');

