const fs = require('fs');
const data = require('./display_items_data');

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
const newArray = dummyProducts.map(prod => {
    if (data[prod._id]) {
        console.log(`Replacing ${prod._id}`);
        const updated = data[prod._id];
        delete data[prod._id]; // Mark as processed
        return updated;
    }
    return prod;
});

// Append the remaining items in data
for (const id in data) {
    console.log(`Appending ${id}`);
    newArray.push(data[id]);
}

// Convert back to string
const newContent = prefix + JSON.stringify(newArray, null, 2) + ';\n';
fs.writeFileSync('frontend/src/constants/dummy-products.ts', newContent);

// Cleanup
fs.unlinkSync('temp_dummy.js');
console.log('Successfully updated dummy-products.ts!');
