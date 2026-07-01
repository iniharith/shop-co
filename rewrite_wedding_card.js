/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
const data = require('./wedding_card_data');

let rawContent = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');

// Extract the array content
const prefix = 'export const dummyProducts: any[] = ';
const startIndex = rawContent.indexOf(prefix) + prefix.length;
// Find the last semicolon
const endIndex = rawContent.lastIndexOf(';');

const arrayStr = rawContent.substring(startIndex, endIndex);

// Save to a temp JS file so we can require it
fs.writeFileSync('temp_dummy.js', `module.exports = ${arrayStr};`);

// Require it
const dummyProducts = require('./temp_dummy.js');

// Modify the array
let found = false;
const newArray = dummyProducts.map(prod => {
    if (data[prod._id]) {
        console.log(`Replacing ${prod._id}`);
        const updated = data[prod._id];
        found = true;
        return updated;
    }
    return prod;
});

if (!found) {
    console.log("Could not find prod-142! Maybe the ID is different? Let me check");
} else {
    // Convert back to string
    const newContent = prefix + JSON.stringify(newArray, null, 2) + ';\n';
    fs.writeFileSync('frontend/src/constants/dummy-products.ts', newContent);
    console.log('Successfully updated dummy-products.ts!');
}

// Cleanup
fs.unlinkSync('temp_dummy.js');
