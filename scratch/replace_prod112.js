/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
const path = 'c:/Users/PRINTARA/Documents/GitHub/shop-co/frontend/src/constants/dummy-products.ts';
let content = fs.readFileSync(path, 'utf8');

const prodIndex = content.indexOf('"_id": "prod-112"');
if (prodIndex === -1) throw new Error("not found");

const matrixData = {
  enabled: true,
  pricingData: [
    { laminate: "MATT LAMINATE", material: "260GSM", quantityPrices: {100:22, 200:30, 300:32, 400:38, 500:43, 1000:55, 2000:110} },
    { laminate: "MATT LAMINATE", material: "310GSM", quantityPrices: {100:30, 200:40, 300:50, 400:55, 500:60, 1000:70, 2000:125} },
    { laminate: "MATT LAMINATE", material: "350GSM", quantityPrices: {100:30, 200:44, 300:57, 400:72, 500:82, 1000:150, 2000:300} },
    
    { laminate: "NO LAMINATE", material: "260GSM", quantityPrices: {100:15, 200:23, 300:27, 500:35, 1000:50, 2000:95} },
    { laminate: "NO LAMINATE", material: "310GSM", quantityPrices: {200:24, 300:35, 500:52, 1000:70, 2000:140} },
    { laminate: "NO LAMINATE", material: "350GSM", quantityPrices: {200:34, 300:50, 500:75, 1000:140, 2000:270} },
    
    { laminate: "UV VARNISH", material: "260GSM", quantityPrices: {200:25, 300:27, 500:35, 1000:50, 2000:100} },
    
    { laminate: "MATT LAM 1SIDE SPOT UV", material: "260GSM", quantityPrices: {100:40, 200:45, 300:50, 400:60, 500:65, 1000:100, 2000:180} },
    { laminate: "MATT LAM 2 SIDE SPOT UV", material: "260GSM", quantityPrices: {200:65, 300:70, 500:85, 1000:120, 2000:230} },
    
    { laminate: "MATT LAM 1SIDE SPOT UV", material: "310GSM", quantityPrices: {300:55, 500:65, 1000:95, 2000:175} },
    { laminate: "MATT LAM 2 SIDE SPOT UV", material: "310GSM", quantityPrices: {300:55, 500:95, 1000:145, 2000:290} },
    
    { laminate: "MATT LAM 1SIDE SPOT UV", material: "350GSM", quantityPrices: {300:65, 500:110, 1000:199, 2000:360} },
    { laminate: "MATT LAM 2 SIDE SPOT UV", material: "350GSM", quantityPrices: {300:75, 500:120, 1000:240, 2000:500} }
  ]
};

const printingOptions = [
  {
    name: "Material",
    options: [
      { label: "260GSM", priceAdd: 0 },
      { label: "310GSM", priceAdd: 0 },
      { label: "350GSM", priceAdd: 0 }
    ]
  },
  {
    name: "Lamination & Finish",
    options: [
      { label: "MATT LAMINATE", priceAdd: 0 },
      { label: "NO LAMINATE", priceAdd: 0 },
      { label: "UV VARNISH", priceAdd: 0 },
      { label: "MATT LAM 1SIDE SPOT UV", priceAdd: 0 },
      { label: "MATT LAM 2 SIDE SPOT UV", priceAdd: 0 }
    ]
  }
];

const newStr = `"matrixPricing": ${JSON.stringify(matrixData, null, 4)},
    "printingOptions": ${JSON.stringify(printingOptions, null, 4)}`;

// We need to replace `printingOptions: [...]` for prod-112.
const startPrint = content.indexOf('"printingOptions":', prodIndex);
if (startPrint === -1) throw new Error("printingOptions not found");

// find the end of the array
let depth = 0;
let endPrint = -1;
for (let i = startPrint; i < content.length; i++) {
  if (content[i] === '[') depth++;
  if (content[i] === ']') {
    depth--;
    if (depth === 0) {
      endPrint = i + 1; // include the bracket
      break;
    }
  }
}

if (endPrint === -1) throw new Error("end of array not found");

content = content.substring(0, startPrint) + newStr + content.substring(endPrint);

fs.writeFileSync(path, content);
console.log("Done updating prod-112");
