/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
let content = fs.readFileSync('src/constants/dummy-products.ts', 'utf8');

// Use a regex to fix the literal string to actual evaluated string
content = content.replace(/"name":\s*"([^"]+)"([\s\S]*?)"images":\s*\[\s*"https:\/\/placehold\.co\/800x800\/eeeeee\/333333\?text="\s*\+\s*encodedName\s*\+\s*""\s*\]/g, (match, name, middle) => {
    const encodedName = encodeURIComponent(name);
    const newImage = `"https://placehold.co/800x800/eeeeee/333333?text=${encodedName}"`;
    return `"name": "${name}"${middle}"images": [\n      ${newImage}\n    ]`;
});

fs.writeFileSync('src/constants/dummy-products.ts', content);
console.log('Fixed images!');
