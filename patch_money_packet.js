const fs = require('fs');
let content = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');

const matrixContent = fs.readFileSync('frontend/src/constants/money-packet-matrix.ts', 'utf8');
const matrixJsonStr = matrixContent.replace('export const moneyPacketMatrixPricing = ', '').replace(/;$/, '');
const matrixPricingData = JSON.parse(matrixJsonStr);

const regex = /_id: "prod-116"[\s\S]*?(?=\s+},\s+{\s+_id: "prod-117")/;

const rep = `_id: "prod-116",
      name: "Money Packet",
      description:
        "High-quality Money Packet with premium materials and vibrant printing. Perfect for corporate gift needs.",
      price: 19,
      originalPrice: 121,
      discount: 19,
      rating: 4.3,
      reviews: 245,
      category: "money-packet",
      images: ["/images/products/digital_printing.png"],
      colors: ["Red", "Blue", "Green", "Black", "White"],
      sizes: ["Standard"],
      matrixPricing: {
        enabled: true,
        pricingData: ${JSON.stringify(matrixPricingData, null, 8).replace(/}/g, '      }')}
      },
      printingOptions: [
        {
          name: "Format",
          options: [
            { label: "Portrait (Vertical)", priceAdd: 0 },
            { label: "Landscape (Horizontal)", priceAdd: 0 }
          ]
        },
        {
          name: "Packaging",
          options: [
            { label: "5pcs/pack", priceAdd: 0 },
            { label: "8pcs/pack", priceAdd: 0 },
            { label: "10pcs/pack", priceAdd: 0 }
          ]
        }
      ]`;

const newContent = content.replace(regex, rep);
fs.writeFileSync('frontend/src/constants/dummy-products.ts', newContent);
console.log('Updated prod-116 in dummy-products.ts');
