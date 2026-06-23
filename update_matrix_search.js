const fs = require('fs');

let text = fs.readFileSync('frontend/src/components/page-sections/shop/product-details.tsx', 'utf8');

const targetStr = `      let matrixRow: any = null;
    matrixRow = product.matrixPricing.pricingData.find((row: any) => 
      row.material === selectedMaterial && row.laminate === selectedLamination
    );`;

const newStr = `      let matrixRow: any = null;
    
    if (product.category === 'paper-bag') {
      const designOptName = options.find(o => o.name.toLowerCase().includes('design'))?.name;
      const selectedDesign = designOptName && typeof selectedOptions[designOptName] === 'number' 
        ? options.find(o => o.name === designOptName)?.options[selectedOptions[designOptName] as number]?.label 
        : "";
        
      matrixRow = product.matrixPricing.pricingData.find((row: any) => 
        row.material === selectedMaterial && 
        row.lamination === selectedLamination && 
        row.design === selectedDesign
      );
    } else {
      matrixRow = product.matrixPricing.pricingData.find((row: any) => 
        row.material === selectedMaterial && row.laminate === selectedLamination
      );
    }`;

text = text.replace(targetStr, newStr);

fs.writeFileSync('frontend/src/components/page-sections/shop/product-details.tsx', text);
console.log('Successfully updated product-details.tsx for Paper Bag matrix pricing search');
