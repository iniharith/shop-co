/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/page-sections/shop/product-details.tsx', 'utf8');

const oldPortalStart = `{product.category === 'flyers' && portalEl && (() => {
        let matrixRow: any = null;`;

const newPortalStart = `{(product.category === 'flyers' || product.category === 'kad-kahwin') && portalEl && (() => {
        let matrixRow: any = null;`;

content = content.replace(oldPortalStart, newPortalStart);

// Now we need to modify the table rendering part.
// Old code:
const oldTableRender = `        return createPortal(
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
        );`;

// New code:
const newTableRender = `        return createPortal(
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6 overflow-x-auto w-full mb-10">
            <h2 className="text-xl font-bold tracking-tight text-primary mb-4">{product.category === 'kad-kahwin' ? 'Package Pricing' : 'Format & Size Pricing'}</h2>
            <table className="w-full text-sm text-center border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700 border border-gray-200">Quantity</th>
                  {product.category === 'flyers' ? (
                    <>
                      <th className="p-3 font-semibold text-gray-700 border border-gray-200 w-1/4">A3</th>
                      <th className="p-3 font-semibold text-gray-700 border border-gray-200 w-1/4">A4</th>
                      <th className="p-3 font-semibold text-gray-700 border border-gray-200 w-1/4">A5</th>
                    </>
                  ) : (
                    <th className="p-3 font-semibold text-gray-700 border border-gray-200 w-1/2">Price (RM)</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {availableQuantities.map((q) => {
                  const qPrices = matrixRow.quantityPrices[q];
                  
                  if (product.category === 'kad-kahwin') {
                    const price = qPrices; // For kad-kahwin, qPrices is just a number
                    const isSelected = quantity === q;
                    return (
                      <tr key={q} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-left font-semibold text-gray-800 border border-gray-200">{q}</td>
                        <td 
                          onClick={() => {
                            if (price) {
                              setQuantity(q);
                            }
                          }}
                          className={\`p-3 border border-gray-200 transition-all \${!price ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer'} \${isSelected ? 'bg-primary/10 border-2 border-primary font-bold text-primary shadow-inner' : 'text-gray-600 hover:bg-primary/5'}\`}
                        >
                          {price ? \`RM \${price.toFixed(2)}\` : 'N/A'}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={q} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-left font-semibold text-gray-800 border border-gray-200">{q}</td>
                      {['A3', 'A4', 'A5'].map((size) => {
                        const price = qPrices ? qPrices[size] : null;
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
        );`;

content = content.replace(oldTableRender, newTableRender);

// Also we need to make sure the selectedMaterial lookup works for 'Package' which is the material option name for kad-kahwin
// Currently: const materialOptName = options.find(o => o.name.toLowerCase().includes('material') || o.name.toLowerCase().includes('format'))?.name;
// We need to add 'package' to it.
const oldMaterialFind = `const materialOptName = options.find(o => o.name.toLowerCase().includes('material') || o.name.toLowerCase().includes('format'))?.name;`;
const newMaterialFind = `const materialOptName = options.find(o => o.name.toLowerCase().includes('material') || o.name.toLowerCase().includes('format') || o.name.toLowerCase().includes('package'))?.name;`;
content = content.replace(oldMaterialFind, newMaterialFind);

fs.writeFileSync('frontend/src/components/page-sections/shop/product-details.tsx', content);
console.log('Script written!');
