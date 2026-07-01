/**
 * Coded by Harith
 * Kampungcetak ®
 */
const photobook = {
  "_id": "prod-143",
  "name": "Photobook",
  "description": "High-quality Photobook with premium materials and vibrant printing. Perfect for preserving your wedding memories.",
  "price": 49,
  "originalPrice": 80,
  "discount": 38,
  "rating": 4.9,
  "reviews": 215,
  "category": "photobook",
  "images": [
    "/images/products/photobook.png"
  ],
  "colors": ["Standard"],
  "sizes": ["Standard"],
  "printingOptions": [
    {
      "name": "Material",
      "options": [
        { "label": "HARDCOVER", "priceAdd": 0 },
        { "label": "SOFTCOVER", "priceAdd": 0 }
      ]
    },
    {
      "name": "Size",
      "options": [
        { "label": "6X6", "priceAdd": 0 },
        { "label": "8X6", "priceAdd": 0 }
      ]
    },
    {
      "name": "Pages",
      "options": [
        { "label": "40 PAGES", "priceAdd": 0 },
        { "label": "60 PAGES", "priceAdd": 0 },
        { "label": "100 PAGES", "priceAdd": 0 }
      ]
    }
  ]
};

const fs = require('fs');

let content = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');

// The array ends before the last semicolon. Let's find the closing bracket of the array.
// To be safe, we can just inject it before the last `];`
const closingBracketIndex = content.lastIndexOf('];');
if (closingBracketIndex !== -1) {
    const newContent = content.substring(0, closingBracketIndex) + 
        ',\\n' + JSON.stringify(photobook, null, 2) + '\\n' + content.substring(closingBracketIndex);
    fs.writeFileSync('frontend/src/constants/dummy-products.ts', newContent);
    console.log("Added photobook to dummy-products.ts");
} else {
    console.log("Failed to find ]; in dummy-products.ts");
}
