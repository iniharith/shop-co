/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
let text = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');

const startIdx = text.indexOf('"_id": "prod-139"');
const prodStart = text.lastIndexOf('{', startIdx);
let braces = 0;
let endIdx = prodStart;
for(let i=prodStart; i<text.length; i++) {
  if (text[i] === '{') braces++;
  else if (text[i] === '}') braces--;
  if (braces === 0) {
    endIdx = i + 1;
    break;
  }
}

let newProd = `{
      "_id": "prod-139",
      "name": "Button Badge",
      "description": "High-quality Button Badge with premium materials and vibrant printing. Perfect for event needs.",
      "price": 0,
      "originalPrice": 0,
      "discount": 0,
      "rating": 5,
      "reviews": 41,
      "category": "button-badge",
      "images": [
        "/images/products/digital_printing.png"
      ],
      "printingOptions": [
        {
          "name": "Type",
          "isMultiSelect": false,
          "options": [
            { "label": "BUTTON BADGE PIN", "priceAdd": 2 },
            { "label": "BUTTON BADGE KEYCHAIN", "priceAdd": 3 },
            { "label": "BUTTON BADGE MAGNET", "priceAdd": 3 },
            { "label": "BUTTON BADGE MAGNET TAG", "priceAdd": 4 }
          ]
        }
      ]
    }`;

text = text.substring(0, prodStart) + newProd + text.substring(endIdx);
fs.writeFileSync('frontend/src/constants/dummy-products.ts', text);
console.log('Successfully replaced prod-139 in dummy-products.ts');
