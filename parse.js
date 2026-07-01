/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');

const materialsMap = [
    { std: '80gsm Simili Paper', matches: ['80gsm simili', 'simili paper 80gsm', '80gsm'] },
    { std: '100gsm Simili Paper', matches: ['100gsm simili', 'simili paper 100gsm'] },
    { std: '85gsm Art Paper', matches: ['85gsm art', 'art paper 85gsm'] },
    { std: '105gsm Art Paper', matches: ['105gsm art', 'art paper 105gsm'] },
    { std: '128gsm Art Paper', matches: ['128gsm art', 'art paper 128gsm'] },
    { std: '157gsm Art Paper', matches: ['157gsm art', 'art paper 157gsm'] },
    { std: '260gsm Art Card', matches: ['260gsm art card', 'art card 260gsm', '210gsm / 230gsm / 260gsm'] },
    { std: '310gsm Art Card', matches: ['310gsm art card', 'art card 310gsm'] }
];

const parseFile = (file) => {
    const lines = fs.readFileSync(file, 'utf8').split('\n').map(l => l.split(',').map(c => c.trim().toLowerCase()));
    let results = {};
    for (let r = 0; r < lines.length; r++) {
        for (let c = 0; c < lines[r].length; c++) {
            const cell = lines[r][c];
            if (!cell) continue;
            
            const matDef = materialsMap.find(m => m.matches.some(match => cell === match || cell.includes(match)));
            if (matDef && !results[matDef.std]) {
                const mat = matDef.std;
                // Look down a few rows to find Qty and price headers
                let qtyCol = -1, singleCol = -1, doubleCol = -1;
                for (let i = 1; i <= 3; i++) {
                    if (r+i < lines.length) {
                        for(let dc = 0; dc <= 4; dc++) {
                            const val = lines[r+i][c+dc] || '';
                            if (val.includes('qty')) qtyCol = c+dc;
                            if (val.includes('4c+0c') || val.includes('4c + 0c')) singleCol = c+dc;
                            if (val.includes('4c+4c') || val.includes('4c + 4c')) doubleCol = c+dc;
                        }
                    }
                }
                
                results[mat] = { '4C + 0C': {}, '4C + 4C': {} };
                for (let i = r + 1; i < lines.length; i++) {
                    if (!lines[i] || lines[i].length <= qtyCol) continue;
                    const qtyStr = lines[i][qtyCol];
                    if (!qtyStr || isNaN(parseInt(qtyStr))) {
                        if (Object.keys(results[mat]['4C + 4C']).length > 0) break;
                        continue;
                    }
                    const qty = parseInt(qtyStr);
                    if (singleCol !== -1 && lines[i][singleCol] && !isNaN(parseFloat(lines[i][singleCol]))) {
                        results[mat]['4C + 0C'][qty] = parseFloat(lines[i][singleCol]);
                    }
                    if (doubleCol !== -1 && lines[i][doubleCol] && !isNaN(parseFloat(lines[i][doubleCol]))) {
                        results[mat]['4C + 4C'][qty] = parseFloat(lines[i][doubleCol]);
                    }
                }
            }
        }
    }
    return results;
};

const a3 = parseFile('A3_FLYERS.csv');
const a4 = parseFile('A4_FLYERS.csv');
const a5 = parseFile('A5_FLYERS.csv');

fs.writeFileSync('parsed_prices.json', JSON.stringify({A3: a3, A4: a4, A5: a5}, null, 2));

