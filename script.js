const fs = require('fs');

const csvPath = './pricing.csv';
const dummyPath = './frontend/src/constants/dummy-products.ts';

const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l);

const quantities = [100, 200, 300, 400, 500, 1000, 2000];

const pricingData = [];

let currentLaminate = '';

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');
    
    if (line.startsWith('HARGA JUAL') || line.startsWith('BUSINESS CARD')) continue;
    
    if (parts[1] === '' && parts[2] === '' && !line.includes('GSM') && !line.includes('SPOT UV')) {
        currentLaminate = parts[0].trim();
        continue;
    }

    if (parts[0].includes('GSM') && parts[1] === '') {
        // This is a grouping header like '260GSM,,,,,,,' under 'UV LAMINATE'
        continue;
    }

    if (parts[0] !== '') {
        // This is a pricing line
        let material = '';
        let laminate = currentLaminate;

        if (parts[0].includes('GSM')) {
            material = parts[0].trim();
        } else if (parts[0].includes('SPOT UV')) {
            laminate = parts[0].trim();
            // Look up to find the nearest GSM
            let j = i - 1;
            while (j >= 0) {
                if (lines[j].split(',')[0].includes('GSM')) {
                    material = lines[j].split(',')[0].trim();
                    break;
                }
                j--;
            }
        }

        const quantityPrices = {};
        for (let k = 0; k < quantities.length; k++) {
            const price = parts[k + 1];
            if (price && price.trim() !== '') {
                quantityPrices[quantities[k]] = parseInt(price.trim());
            }
        }

        pricingData.push({
            laminate,
            material,
            quantityPrices
        });
    }
}

// Ensure string format matches exactly
const replacementString = JSON.stringify(pricingData, null, 4).replace(/"([^"]+)":/g, '"":').replace(/\n/g, '\n    ');

const dummyContent = fs.readFileSync(dummyPath, 'utf8');

// Find the Business Card object
const startIdx = dummyContent.indexOf('"name": "Business Card"');
const matrixStart = dummyContent.indexOf('"pricingData": [', startIdx);
const matrixEnd = dummyContent.indexOf(']', matrixStart);

const newContent = dummyContent.substring(0, matrixStart) + '"pricingData": ' + JSON.stringify(pricingData, null, 12).replace(/^{/gm, '            {').replace(/^}/gm, '            }') + dummyContent.substring(matrixEnd + 1);

fs.writeFileSync(dummyPath, newContent);
console.log('Successfully updated dummy-products.ts');

