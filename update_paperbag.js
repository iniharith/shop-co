/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');

const pricingData = JSON.parse(fs.readFileSync('frontend/paperbag_prices.json', 'utf8'));

let text = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');

const startIdx = text.indexOf('"category": "paper-bag"');
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

const designOptions = Array.from({length: 10}).map((_, i) => ({ "label": "PB" + String(i + 1).padStart(2, '0'), "priceAdd": 0 }));

const newProd = `{
      "_id": "prod-141",
      "name": "Paper Bag",
      "description": "Premium paper bags with your custom design, perfect for retail, events, and corporate gifts. Available in various sizes and materials.",
      "price": 0,
      "originalPrice": 0,
      "discount": 0,
      "rating": 5,
      "reviews": 128,
      "category": "paper-bag",
      "images": [
        "/images/products/digital_printing.png"
      ],
      "printingOptions": [
        {
          "name": "Material",
          "isMultiSelect": false,
          "options": [
            { "label": "157gsm Art Paper", "priceAdd": 0 },
            { "label": "210gsm Art Card", "priceAdd": 0 }
          ]
        },
        {
          "name": "Lamination",
          "isMultiSelect": false,
          "options": [
            { "label": "1 Side Gloss Lamination", "priceAdd": 0 },
            { "label": "1 Side Matt Lamination", "priceAdd": 0 },
            { "label": "1 Side Matt Lamination + 1 Side Spot UV", "priceAdd": 0 }
          ]
        },
        {
          "name": "Design",
          "isMultiSelect": false,
          "options": ${JSON.stringify(designOptions)}
        }
      ],
      "matrixPricing": {
        "enabled": true,
        "hideQuantityGrid": false,
        "pricingData": ${JSON.stringify(pricingData, null, 10).trim()}
      }
    }`;

text = text.substring(0, prodStart) + newProd + text.substring(endIdx);

fs.writeFileSync('frontend/src/constants/dummy-products.ts', text);
console.log('Successfully updated dummy-products.ts with Paper Bag matrix pricing!');
