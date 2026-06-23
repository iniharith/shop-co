const fs = require('fs');
let p = fs.readFileSync('frontend/src/components/page-sections/shop/product-details.tsx', 'utf8');
p = p.replace(/\+RM 50\.00/g, '+RM 100.00');
p = p.replace(/designOption === "design" \? 50 : 0/g, 'designOption === "design" ? 100 : 0');
fs.writeFileSync('frontend/src/components/page-sections/shop/product-details.tsx', p);
console.log("Updated 50 to 100");
