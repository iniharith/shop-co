const fs = require('fs');

let p = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');
const regex = /{\s*name:\s*"Turnaround Time"[\s\S]*?},\n\s*/;
p = p.replace(regex, '');
fs.writeFileSync('frontend/src/constants/dummy-products.ts', p);
console.log("Removed Turnaround Time from Wind Flag");
