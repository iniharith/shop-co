const fs = require('fs');
const lines = fs.readFileSync('MONEY_PACKET.csv', 'utf8').split('\n').map(l => l.split(',').map(c => c.trim().replace(/'/g, '').replace(/\"/g, '')));

const pricingData = [];

// Helper to extract prices for a format (startCol is the Qty column)
const extractFormat = (formatLabel, startCol) => {
    // 5pcs is startCol+1, 8pcs is startCol+2, 10pcs is startCol+3
    const packs = ['5pcs/pack', '8pcs/pack', '10pcs/pack'];
    packs.forEach((packLabel, packIdx) => {
        const quantityPrices = {};
        for(let r=3; r<lines.length; r++) {
            if(!lines[r] || lines[r].length <= startCol) continue;
            const qtyStr = lines[r][startCol];
            const priceStr = lines[r][startCol + 1 + packIdx];
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
console.log('Built money packet matrix');
