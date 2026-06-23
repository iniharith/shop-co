const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/page-sections/shop/product-details.tsx', 'utf8');

const oldLogicStart = `  if (product.matrixPricing?.enabled) {`;

const newLogicStart = `  if (product.category === "photobook") {
    const matName = options.find(o => o.name.toLowerCase().includes('material'))?.name;
    const sizeName = options.find(o => o.name.toLowerCase().includes('size'))?.name;
    const pagesName = options.find(o => o.name.toLowerCase().includes('pages'))?.name;

    const mat = matName && typeof selectedOptions[matName] === 'number' ? options.find(o => o.name === matName)?.options[selectedOptions[matName] as number]?.label : "";
    const size = sizeName && typeof selectedOptions[sizeName] === 'number' ? options.find(o => o.name === sizeName)?.options[selectedOptions[sizeName] as number]?.label : "";
    const pages = pagesName && typeof selectedOptions[pagesName] === 'number' ? options.find(o => o.name === pagesName)?.options[selectedOptions[pagesName] as number]?.label : "";

    const pricingDB: any = {
      "HARDCOVER": {
        "6X6": { "40 PAGES": 109, "60 PAGES": 119, "100 PAGES": 129 },
        "8X6": { "40 PAGES": 129, "60 PAGES": 139, "100 PAGES": 149 }
      },
      "SOFTCOVER": {
        "6X6": { "40 PAGES": 49, "60 PAGES": 59, "100 PAGES": 69 },
        "8X6": { "40 PAGES": 55, "60 PAGES": 65, "100 PAGES": 75 }
      }
    };
    
    const unitPrice = pricingDB[mat]?.[size]?.[pages] || 0;
    subtotal = unitPrice * quantity + (designOption === "design" ? 100 : 0);
  } else if (product.matrixPricing?.enabled) {`;

content = content.replace(oldLogicStart, newLogicStart);

fs.writeFileSync('frontend/src/components/page-sections/shop/product-details.tsx', content);
console.log("Updated product-details.tsx with photobook logic");
