const fs = require('fs');
let content = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');
const matrixPricingData = require('./flyer_matrix.js').flyerMatrixPricing;

const regex = /_id: "prod-110"[\s\S]*?(?=\s+},\s+{\s+_id: "prod-111")/;

const materials = ['80gsm Simili Paper', '100gsm Simili Paper', '85gsm Art Paper', '105gsm Art Paper', '128gsm Art Paper', '157gsm Art Paper', '260gsm Art Card', '310gsm Art Card'];

const rep = `_id: "prod-110",
      name: "Flyers",
      description:
        "High-quality Flyers with premium materials and vibrant printing. Perfect for digital offset needs.",
      price: 44,
      originalPrice: 155,
      discount: 17,
      rating: 4.1,
      reviews: 111,
      category: "flyers",
      images: ["/images/products/digital_offset.png"],
      colors: ["Red", "Blue", "Green", "Black", "White"],
      sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
      matrixPricing: {
        enabled: true,
        pricingData: ${JSON.stringify(matrixPricingData, null, 8).replace(/}/g, '      }')}
      },
      printingOptions: [
        {
          name: "Material",
          options: [
            ${materials.map(m => `{ label: "${m}", priceAdd: 0 }`).join(',\n            ')}
          ]
        },
        {
          name: "Printing Sides",
          options: [
            { label: "4C + 0C", priceAdd: 0 },
            { label: "4C + 4C", priceAdd: 0 }
          ]
        }
      ]`;

const newContent = content.replace(regex, rep);
fs.writeFileSync('frontend/src/constants/dummy-products.ts', newContent);
console.log('Updated dummy-products.ts');
