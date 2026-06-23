const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/page-sections/shop/product-details.tsx', 'utf8');

// 1. Add createPortal import
code = code.replace(
  'import { useEffect, useState } from "react";',
  'import { useEffect, useState } from "react";\nimport { createPortal } from "react-dom";'
);

// 2. Add state
code = code.replace(
  'const [quantity, setQuantity] = useState(1);',
  'const [quantity, setQuantity] = useState(1);\n  const [selectedGridSize, setSelectedGridSize] = useState<string>("A4");\n  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);\n\n  useEffect(() => {\n    setPortalEl(document.getElementById("flyer-pricing-portal"));\n  }, []);'
);

// 3. Update handleAddToCart
code = code.replace(
  /const sizeWithDesign = `Standard \| Design: \$\{designOption === "upload" \? "Upload Artwork" : "Need Design Service"\}`;/,
  'const baseSize = product.category === "flyers" ? selectedGridSize : "Standard";\n      const sizeWithDesign = `${baseSize} | Design: ${designOption === "upload" ? "Upload Artwork" : "Need Design Service"}`;'
);

// 4. Update subtotal logic
const oldSubtotalLogic = `    const matrixRow = product.matrixPricing.pricingData.find(row => 
      row.material === selectedMaterial && row.laminate === selectedLamination
    );

    if (matrixRow) {
      availableQuantities = Object.keys(matrixRow.quantityPrices).map(Number).sort((a,b) => a-b);
      // Auto-adjust quantity if it's not valid for this matrix row
      if (!availableQuantities.includes(quantity) && availableQuantities.length > 0) {
        // We use setTimeout to avoid React state warning during render
        setTimeout(() => setQuantity(availableQuantities[0]), 0);
      }
      
      const exactPrice = matrixRow.quantityPrices[quantity] || matrixRow.quantityPrices[availableQuantities[0]] || 0;
      subtotal = exactPrice + (designOption === "design" ? 50 : 0);
    } else {`;

const newSubtotalLogic = `    let matrixRow: any = null;
    matrixRow = product.matrixPricing.pricingData.find((row: any) => 
      row.material === selectedMaterial && row.laminate === selectedLamination
    );

    if (matrixRow) {
      availableQuantities = Object.keys(matrixRow.quantityPrices).map(Number).sort((a,b) => a-b);
      
      let qPrices: any = matrixRow.quantityPrices[quantity] || matrixRow.quantityPrices[availableQuantities[0]];
      let exactPrice = 0;
      
      if (typeof qPrices === 'object') {
        // Flyer Grid Pricing
        if (!qPrices[selectedGridSize]) {
          const availableSizesForQ = Object.keys(qPrices);
          if (availableSizesForQ.length > 0) {
            setTimeout(() => setSelectedGridSize(availableSizesForQ[0]), 0);
          }
        }
        exactPrice = qPrices[selectedGridSize] || Object.values(qPrices)[0] || 0;
      } else {
        // Normal Matrix Pricing
        exactPrice = qPrices || 0;
      }

      if (!availableQuantities.includes(quantity) && availableQuantities.length > 0) {
        setTimeout(() => setQuantity(availableQuantities[0]), 0);
      }
      
      subtotal = exactPrice + (designOption === "design" ? 50 : 0);
    } else {`;

code = code.replace(oldSubtotalLogic, newSubtotalLogic);

// 5. Hide quantity block for flyers
code = code.replace(
  '{/* STEP 3 */}\n        <div className="space-y-4">',
  '{/* STEP 3 */}\n        {product.category !== "flyers" && (<div className="space-y-4">'
);
code = code.replace(
  '<div className="bg-gray-100 dark:bg-black/40 rounded-xl p-5 space-y-3 mt-8 border border-gray-200 dark:border-border">',
  ')} <div className="bg-gray-100 dark:bg-black/40 rounded-xl p-5 space-y-3 mt-8 border border-gray-200 dark:border-border">'
);

// 6. Add portal rendering at the end
const portalCode = `
      {product.category === 'flyers' && portalEl && (() => {
        let matrixRow: any = null;
        if (product.matrixPricing?.enabled) {
          const materialOptName = options.find(o => o.name.toLowerCase().includes('material'))?.name;
          const laminationOptName = options.find(o => o.name.toLowerCase().includes('lamination') || o.name.toLowerCase().includes('sides'))?.name;
          
          const selectedMaterial = materialOptName && selectedOptions[materialOptName] !== undefined 
            ? options.find(o => o.name === materialOptName)?.options[selectedOptions[materialOptName]]?.label 
            : "";
          const selectedLamination = laminationOptName && selectedOptions[laminationOptName] !== undefined 
            ? options.find(o => o.name === laminationOptName)?.options[selectedOptions[laminationOptName]]?.label 
            : "";
      
          matrixRow = product.matrixPricing.pricingData.find((row: any) => 
            row.material === selectedMaterial && row.laminate === selectedLamination
          );
        }

        if (!matrixRow) return null;

        return createPortal(
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6 overflow-x-auto w-full mb-10">
            <h2 className="text-xl font-bold tracking-tight text-primary mb-4">Format & Size Pricing</h2>
            <table className="w-full text-sm text-center border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700 border border-gray-200">Quantity</th>
                  <th className="p-3 font-semibold text-gray-700 border border-gray-200 w-1/4">A3</th>
                  <th className="p-3 font-semibold text-gray-700 border border-gray-200 w-1/4">A4</th>
                  <th className="p-3 font-semibold text-gray-700 border border-gray-200 w-1/4">A5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {availableQuantities.map((q) => {
                  const qPrices = matrixRow.quantityPrices[q];
                  return (
                    <tr key={q} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-left font-semibold text-gray-800 border border-gray-200">{q}</td>
                      {['A3', 'A4', 'A5'].map((size) => {
                        const price = qPrices[size];
                        const isSelected = quantity === q && selectedGridSize === size;
                        return (
                          <td 
                            key={size}
                            onClick={() => {
                              if (price) {
                                setQuantity(q);
                                setSelectedGridSize(size);
                              }
                            }}
                            className={\`p-3 border border-gray-200 transition-all \${!price ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer'} \${isSelected ? 'bg-primary/10 border-2 border-primary font-bold text-primary shadow-inner' : 'text-gray-600 hover:bg-primary/5'}\`}
                          >
                            {price ? \`RM \${price.toFixed(2)}\` : 'N/A'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>,
          portalEl
        );
      })()}
`;

code = code.replace(
  '    </div>\n  );\n}',
  portalCode + '\n    </div>\n  );\n}'
);

fs.writeFileSync('frontend/src/components/page-sections/shop/product-details.tsx', code);
console.log('patched product-details');
