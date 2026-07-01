/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/page-sections/shop/product-details.tsx', 'utf8');

// Find the start of the portal block
const portalStartStr = "{(product.category === 'flyers' || product.category === 'kad-kahwin') && portalEl && (() => {";
const portalStartIdx = content.indexOf(portalStartStr);

// Find the end of the portal block (which is right before the last closing </div> of ProductDetails)
const portalEndStr = "      })()}\n\n    </div>\n  );\n}";
const portalEndIdx = content.indexOf(portalEndStr) + "      })()}".length;

if (portalStartIdx === -1 || portalEndIdx < portalStartIdx) {
  console.log("Could not find portal block!");
  process.exit(1);
}

let portalBlock = content.substring(portalStartIdx, portalEndIdx);
// We want to remove it from its current position
content = content.substring(0, portalStartIdx) + content.substring(portalEndIdx);

// Now we need to modify portalBlock to render inline for mobile (lg:hidden) and portal for desktop
// Wait, we can just replace `portalEl && ` with `` in the start string so it always runs.
portalBlock = portalBlock.replace(
  "{(product.category === 'flyers' || product.category === 'kad-kahwin') && portalEl && (() => {",
  "{(product.category === 'flyers' || product.category === 'kad-kahwin') && (() => {"
);

// Modify the return statement of the IIFE
const originalReturn = "return createPortal(\n          <div className=\"bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6 overflow-x-auto w-full mb-10\">";
const newReturn = `
          const PricingTable = ({ className }: { className: string }) => (
            <div className={\`bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6 overflow-x-auto w-full mb-10 \${className}\`}>`;

portalBlock = portalBlock.replace(originalReturn, newReturn);

const originalEnd = `          </div>,
          portalEl
        );`;
const newEnd = `          </div>
          );

          return (
            <>
              {/* Mobile inline render (hidden on desktop) */}
              <PricingTable className="lg:hidden" />
              
              {/* Desktop portal render (hidden on mobile) */}
              {portalEl && createPortal(<PricingTable className="hidden lg:block" />, portalEl)}
            </>
          );`;

portalBlock = portalBlock.replace(originalEnd, newEnd);

// Find the PRICE SUMMARY section to insert above
const summaryStr = "{/* \uD83D\uDCB0 PRICE SUMMARY \uD83D\uDCB0 */}"; // actually, let's just search for PRICE SUMMARY
const summaryIdx = content.indexOf("PRICE SUMMARY");
if (summaryIdx === -1) {
  console.log("Could not find PRICE SUMMARY!");
  process.exit(1);
}

// Find the start of the line containing PRICE SUMMARY
const insertIdx = content.lastIndexOf("\n", summaryIdx);

content = content.substring(0, insertIdx) + "\n\n" + portalBlock + "\n\n" + content.substring(insertIdx);

fs.writeFileSync('frontend/src/components/page-sections/shop/product-details.tsx', content);
console.log("Successfully moved and updated matrix pricing table!");
