const fs = require('fs');
let content = fs.readFileSync('frontend/src/hooks/useProducts.ts', 'utf8');

const injection = `
    if (response?.product?.name) {
        const dummy = dummyProducts.find(d => d.name === response.product.name);
        if (dummy && dummy.matrixPricing?.enabled) {
            return { data: { ...response, product: { ...response.product, matrixPricing: dummy.matrixPricing, printingOptions: dummy.printingOptions } }, isPending: false };
        }
    }

    if (id?.startsWith('prod-')) {
`;

content = content.replace("if (id?.startsWith('prod-')) {", injection);
fs.writeFileSync('frontend/src/hooks/useProducts.ts', content);
console.log('Patched useProducts.ts');
