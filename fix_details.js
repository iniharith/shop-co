/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/page-sections/shop/product-details.tsx', 'utf8');
code = code.replace(
  'const laminationOptName = options.find(o => o.name.toLowerCase().includes(\'lamination\'))?.name;',
  'const laminationOptName = options.find(o => o.name.toLowerCase().includes(\'lamination\') || o.name.toLowerCase().includes(\'sides\'))?.name;'
);
fs.writeFileSync('frontend/src/components/page-sections/shop/product-details.tsx', code);
