const fs = require('fs');
let code = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');
code = code.replace(/4C \+ 0C/g, 'Single Side');
code = code.replace(/4C \+ 4C/g, 'Front and Back');
fs.writeFileSync('frontend/src/constants/dummy-products.ts', code);
