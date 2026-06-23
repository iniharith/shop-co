const fs = require('fs');
const text = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');
const p = text.indexOf('"prod-141"');
console.log(text.substring(p-20, p+300));
