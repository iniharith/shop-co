/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');

const sizes = {
  "PB01": "PB01 (203mm H x 180mm W x 80mm G)",
  "PB02": "PB02 (203mm H x 222mm W x 80mm G)",
  "PB03": "PB03 (343mm H x 220mm W x 80mm G)",
  "PB04": "PB04 (380mm H x 350mm W x 100mm G)",
  "PB05": "PB05 (432mm H x 305mm W x 140mm G)",
  "PB06": "PB06 (210mm H x 250mm W x 110mm G)",
  "PB07": "PB07 (210mm H x 250mm W x 90mm G)",
  "PB08": "PB08 (135mm H x 175mm W x 80mm G)",
  "PB09": "PB09 (340mm H x 250mm W x 120mm G)",
  "PB10": "PB10 (200mm H x 310mm W x 110mm G)",
  "PB11": "PB11 (350mm H x 126mm W x 90mm G)"
};

let f = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');

// We need to parse the array or do regex. Regex is risky for large changes.
// Since dummyProducts is exported as a module, let's extract it, modify it, and write it back.
// But writing it back perfectly is tricky without formatting.
// Instead, let's use the same logic as `update_paperbag.js`!

const startIdx = f.indexOf('"category": "paper-bag"');
const prodStart = f.lastIndexOf('{', startIdx);
let braces = 0;
let endIdx = prodStart;
for(let i=prodStart; i<f.length; i++) {
  if (f[i] === '{') braces++;
  else if (f[i] === '}') braces--;
  if (braces === 0) {
    endIdx = i + 1;
    break;
  }
}

let paperBagStr = f.substring(prodStart, endIdx);
let paperBag = JSON.parse(paperBagStr);

// Modify printingOptions
paperBag.printingOptions.forEach(opt => {
  if (opt.name === "Design") {
    opt.name = "Size";
    opt.options.forEach(subOpt => {
      let key = subOpt.label.trim();
      if (sizes[key]) {
        subOpt.label = sizes[key];
      }
    });
  }
});

// Modify matrixPricing
if (paperBag.matrixPricing && paperBag.matrixPricing.pricingData) {
  paperBag.matrixPricing.pricingData.forEach(row => {
    let key = row.design ? row.design.trim() : "";
    if (sizes[key]) {
      row.design = sizes[key];
    }
  });
}

const newPaperBagStr = JSON.stringify(paperBag, null, 6);
f = f.substring(0, prodStart) + newPaperBagStr + f.substring(endIdx);

fs.writeFileSync('frontend/src/constants/dummy-products.ts', f);
console.log('Successfully updated sizes for Paper Bag');
