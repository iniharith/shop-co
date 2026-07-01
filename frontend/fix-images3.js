/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
let content = fs.readFileSync('src/constants/dummy-products.ts', 'utf8');

content = content.replace(/https:\/\/placehold\.co\/800x800\/eeeeee\/333333\.png\?text=([^\"\\]+)/g, (match, encodedName) => {
    const decodedName = decodeURIComponent(encodedName).toLowerCase();
    const words = decodedName.split(' ').filter(w => w.trim() !== '');
    const keyword = words[0] + (words[1] ? ',' + words[1] : ',product');
    return `https://loremflickr.com/800/800/${keyword}`;
});

fs.writeFileSync('src/constants/dummy-products.ts', content);
console.log('Switched to loremflickr!');
