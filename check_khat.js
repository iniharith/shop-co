const fs = require('fs');
let content = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');
// remove the export const dummyProducts: any[] = [ and the trailing ];
content = content.replace(/export const dummyProducts: any\\[\\] = \\[/, '[').replace(/];?\\s*$/, ']');
try {
    const products = JSON.parse(content);
    const khats = products.filter(p => p.category.toLowerCase() === 'islamic khat');
    console.log("Islamic Khat Products:", khats.map(k => k.name).join(', '));
    const prod134 = products.find(p => p._id === 'prod-134');
    console.log("prod-134 Name:", prod134?.name);
} catch (e) {
    console.log("Error parsing dummy-products", e.message);
}
