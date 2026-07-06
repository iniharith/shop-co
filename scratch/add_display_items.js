const fs = require('fs');

const items = [
  { name: 'Personalised Flag', price: 255 },
  { name: 'Popup Backdrop', price: 1700 },
  { name: 'Popup Table', price: 500 },
  { name: 'Promotion Counter', price: 300 },
  { name: 'Roll Up Bunting', price: 130 },
  { name: 'Wind Flag', price: 222 },
  { name: 'Human Standee', price: 350 },
  { name: 'Tripod Stand', price: 55 },
  { name: 'Water Bag', price: 35 }
];

let content = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');

// Find the last _id in the file
const matches = [...content.matchAll(/"?_id"?:\s*"(prod-\d+)"/g)];
let lastId = 100;
matches.forEach(m => {
    const num = parseInt(m[1].split('-')[1]);
    if (num > lastId) lastId = num;
});

let newProductsStr = '';

items.forEach((item, index) => {
    const newId = `prod-${lastId + index + 1}`;
    const slug = item.name.toLowerCase().replace(/ /g, '-');
    newProductsStr += `
  {
    "_id": "${newId}",
    "name": "${item.name}",
    "description": "High-quality ${item.name} with premium materials and vibrant printing. Perfect for display item needs.",
    "price": ${item.price},
    "originalPrice": ${Math.round(item.price * 1.2)},
    "discount": 20,
    "rating": 4.8,
    "reviews": 42,
    "category": "display-item",
    "images": ["/images/products/display_item.png"],
    "colors": ["Standard"],
    "sizes": ["Standard"],
    "printingOptions": [
      {
        "name": "Type & Size",
        "options": [
          { "label": "Standard", "priceAdd": 0 }
        ]
      }
    ]
  },`;
});

// Append right before the last bracket
const lastBracketIndex = content.lastIndexOf('];');
if (lastBracketIndex !== -1) {
    content = content.slice(0, lastBracketIndex) + (content[lastBracketIndex - 1] === ',' ? '' : ',') + newProductsStr + '\n];\n';
    fs.writeFileSync('frontend/src/constants/dummy-products.ts', content);
    console.log(`Successfully added ${items.length} display products starting from prod-${lastId + 1}`);
} else {
    console.log("Could not find ending bracket ]; in dummy-products.ts");
}
