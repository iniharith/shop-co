const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/page-sections/shop/product-details.tsx', 'utf8');

code = code.replace(
    /const materialOptName = options\.find\(o => o\.name\.toLowerCase\(\)\.includes\('material'\)\)\?\.name;/g,
    "const materialOptName = options.find(o => o.name.toLowerCase().includes('material') || o.name.toLowerCase().includes('format'))?.name;"
);

code = code.replace(
    /const laminationOptName = options\.find\(o => o\.name\.toLowerCase\(\)\.includes\('lamination'\) \|\| o\.name\.toLowerCase\(\)\.includes\('sides'\)\)\?\.name;/g,
    "const laminationOptName = options.find(o => o.name.toLowerCase().includes('lamination') || o.name.toLowerCase().includes('sides') || o.name.toLowerCase().includes('packaging'))?.name;"
);

fs.writeFileSync('frontend/src/components/page-sections/shop/product-details.tsx', code);
console.log('Patched product-details.tsx for Format and Packaging');
