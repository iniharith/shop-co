/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');

const generatePrices = (baseTiers) => {
    const qtyPrices = {};
    for (let i = 1; i <= 100; i++) {
        if (i <= 2) qtyPrices[i] = baseTiers[0];
        else if (i <= 5) qtyPrices[i] = baseTiers[1];
        else if (i <= 10) qtyPrices[i] = baseTiers[2];
        else if (i <= 20) qtyPrices[i] = baseTiers[3];
        else if (i <= 50) qtyPrices[i] = baseTiers[4];
        else qtyPrices[i] = baseTiers[5];
    }
    return qtyPrices;
};

const matrixPricing = {
    enabled: true,
    hideQuantityGrid: true,
    pricingData: [
        {
            material: "2.8 Meters",
            laminate: "",
            quantityPrices: generatePrices([222, 218, 214, 210, 206, 200])
        },
        {
            material: "3.4 Meters",
            laminate: "",
            quantityPrices: generatePrices([240, 234, 230, 226, 222, 214])
        },
        {
            material: "4.5 Meters",
            laminate: "",
            quantityPrices: generatePrices([286, 278, 276, 270, 264, 256])
        }
    ]
};

const options = [
    {
        name: "Format",
        options: [
            { label: "2.8 Meters", priceAdd: 0 },
            { label: "3.4 Meters", priceAdd: 0 },
            { label: "4.5 Meters", priceAdd: 0 }
        ]
    },
    {
        name: "Base",
        options: [
            { label: "Full Set - Cross Stand (1 Side Printing)", priceAdd: 0 }
        ]
    },
    {
        name: "Turnaround Time",
        options: [
            { label: "Standard (3-5 Working Days)", priceAdd: 0 },
            { label: "Express (1-2 Working Days)", priceAdd: 30 }
        ]
    }
];

let content = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');

const regex = /_id: "prod-109"[\s\S]*?category: "wind-flag",[\s\S]*?images: \[.*?\],[\s\S]*?colors: \[.*?\],[\s\S]*?sizes: \[.*?\],[\s\S]*?printingOptions: \[[\s\S]*?\](?=\n\s*},)/;

const match = content.match(regex);

if (match) {
    const replacement = match[0].replace(/printingOptions: \[[\s\S]*?\]$/, `matrixPricing: ${JSON.stringify(matrixPricing, null, 10)},\n        printingOptions: ${JSON.stringify(options, null, 10)}`);
    content = content.replace(regex, replacement);
    fs.writeFileSync('frontend/src/constants/dummy-products.ts', content);
    console.log("Successfully patched Wind Flag!");
} else {
    console.log("Could not find Wind Flag!");
}
