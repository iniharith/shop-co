/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');

let content = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');
const regex = /_id: "prod-109"[\s\S]*?category: "wind-flag",[\s\S]*?images: \[.*?\],[\s\S]*?colors: \[.*?\],[\s\S]*?sizes: \[.*?\],[\s\S]*?printingOptions: \[[\s\S]*?\](?=\n\s*},)/;

const match = content.match(regex);
if (match) {
    let replacedBlock = match[0].replace(/,\s*{\s*name:\s*"Turnaround Time"[\s\S]*?}\s*(?=\])/g, '');
    content = content.replace(match[0], replacedBlock);
    fs.writeFileSync('frontend/src/constants/dummy-products.ts', content);
    console.log("Successfully removed Turnaround Time from Wind Flag!");
}
