const fs = require('fs');
const { parse } = require('csv-parse/sync');

const fileContent = fs.readFileSync('MONEY_PACKET.csv', 'utf8');
const records = parse(fileContent, {
  skip_empty_lines: true
});

const pricingData = [];

// Helper to extract prices for a format (startCol is the Qty column)
const extractFormat = (formatLabel, startCol) => {
    // 5pcs is startCol+1, 8pcs is startCol+2, 10pcs is startCol+3
    const packs = ['5pcs/pack', '8pcs/pack', '10pcs/pack'];
    packs.forEach((packLabel, packIdx) => {
        const quantityPrices = {};
        for(let r=2; r<records.length; r++) {
            const row = records[r];
            if(!row || row.length <= startCol) continue;
            const qtyStr = row[startCol];
            const priceStr = row[startCol + 1 + packIdx];
            if(qtyStr && !isNaN(parseInt(qtyStr)) && priceStr) {
                const qty = parseInt(qtyStr);
                const price = parseFloat(priceStr.replace('MYR ', '').replace(/,/g, ''));
                if(!isNaN(price)) {
                    quantityPrices[qty] = price;
                }
            }
        }
        pricingData.push({
            material: formatLabel,
            laminate: packLabel,
            quantityPrices
        });
    });
};

extractFormat('Portrait (Vertical)', 0);
extractFormat('Landscape (Horizontal)', 5);

fs.writeFileSync('frontend/src/constants/money-packet-matrix.ts', 'export const moneyPacketMatrixPricing = ' + JSON.stringify(pricingData, null, 2) + ';');
console.log('Built money packet matrix properly');
