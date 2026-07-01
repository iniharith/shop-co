/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
let f = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');
f = f.replace(/"_id": "prod-141",\s*"name": "Paper Bag"/g, '"_id": "prod-114",\n      "name": "Paper Bag"');
fs.writeFileSync('frontend/src/constants/dummy-products.ts', f);
console.log('Fixed');
