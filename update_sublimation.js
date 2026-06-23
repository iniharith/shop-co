const fs = require('fs');

let content = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');

const prefix = 'export const dummyProducts: any[] = ';
let arrayStr = content.substring(content.indexOf('['));
if (arrayStr.endsWith(';')) arrayStr = arrayStr.slice(0, -1);
if (arrayStr.endsWith(';\n')) arrayStr = arrayStr.slice(0, -2);
if (arrayStr.endsWith(';\r\n')) arrayStr = arrayStr.slice(0, -3);

let products;
try {
  products = eval('(' + arrayStr + ')');
} catch (e) {
  console.log("Failed to parse array with eval. Falling back to string replacement.");
  process.exit(1);
}

const prod = products.find(p => p._id === 'prod-131');
if (prod) {
  prod.printingOptions = [
    {
      name: "Type of Baju",
      isMultiSelect: false,
      options: [
        { label: "Round Neck", priceAdd: 0 },
        { label: "Muslimah", priceAdd: 0 },
        { label: "Kids", priceAdd: 0 },
        { label: "Sweater Lycra", priceAdd: 0 },
        { label: "Baseball Lycra", priceAdd: 0 },
        { label: "Versity Lycra", priceAdd: 0 },
        { label: "Korporat Shortsleeve", priceAdd: 0 },
        { label: "Korporat Longsleeve", priceAdd: 0 }
      ]
    },
    {
      name: "Add Ons",
      isMultiSelect: true,
      options: [
        { label: "Kain Lycra", priceAdd: 20 },
        { label: "Long Sleeve", priceAdd: 6 },
        { label: "Polo Collar", priceAdd: 8 },
        { label: "Retro Collar", priceAdd: 16 },
        { label: "Mandrin Collar (Button)", priceAdd: 10 },
        { label: "Mandrin Collar (Zip)", priceAdd: 16 },
        { label: "Half Zip Collar", "priceAdd": 14 },
        { label: "NFL V Neck", "priceAdd": 16 },
        { label: "V Neck End", "priceAdd": 8 },
        { label: "Swoosh Collar", "priceAdd": 16 },
        { label: "Retro Lace", "priceAdd": 20 },
        { label: "3XL", priceAdd: 6 },
        { label: "4XL", "priceAdd": 10 },
        { label: "5XL", "priceAdd": 16 },
        { label: "6XL-10XL", "priceAdd": 20 },

      ]
    }
  ];
}

const newFileContent = `export const dummyProducts: any[] = ${JSON.stringify(products, null, 2)};\n`;

fs.writeFileSync('frontend/src/constants/dummy-products.ts', newFileContent);
console.log("Successfully updated prod-131 in dummy-products.ts");
